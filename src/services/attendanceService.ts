import prisma from "../lib/prisma";
import { createHmac } from "crypto";

export type ScanResult = {
	mode: "CHECK_IN" | "CHECK_OUT";
	attendance: {
		id: string;
		userId: string;
		checkInAt: Date | null;
		checkOutAt: Date | null;
		createdAt: Date;
		updatedAt: Date;
	};
};

export const parseQr = (qr: string) => {
	const parts = qr.split("|");
	if (parts.length !== 3) {
		const err = new Error("QR tidak valid") as Error & { status?: number };
		err.status = 400;
		throw err;
	}
	const [userId, ts, signature] = parts;
	const timestamp = new Date(ts);
	if (!userId || !signature || isNaN(timestamp.getTime())) {
		const err = new Error("QR tidak valid") as Error & { status?: number };
		err.status = 400;
		throw err;
	}
	const expected = signQr(userId, ts);
	if (expected !== signature) {
		const err = new Error("Signature tidak valid") as Error & {
			status?: number;
		};
		err.status = 400;
		throw err;
	}
	return { userId, timestamp };
};

export const validateTimestamp = (timestamp: Date) => {
	const now = new Date();
	const diff = Math.abs(now.getTime() - timestamp.getTime());
	if (diff > 60_000) {
		const err = new Error("QR kadaluarsa") as Error & { status?: number };
		err.status = 400;
		throw err;
	}
};

const addWitaOffset = (date: Date) =>
	new Date(date.getTime() + 8 * 60 * 60 * 1000);
const removeWitaOffset = (date: Date) =>
	new Date(date.getTime() - 8 * 60 * 60 * 1000);
export const startOfDayWita = (date: Date) => {
	const d = addWitaOffset(date);
	d.setUTCHours(0, 0, 0, 0);
	return removeWitaOffset(d);
};
export const endOfDayWita = (date: Date) => {
	const d = addWitaOffset(date);
	d.setUTCHours(23, 59, 59, 999);
	return removeWitaOffset(d);
};
const witaDateOnly = (date: Date) => {
	const d = addWitaOffset(date);
	const y = d.getUTCFullYear();
	const m = d.getUTCMonth();
	const day = d.getUTCDate();
	return new Date(Date.UTC(y, m, day));
};

const getQrSecret = () => {
	const secret = process.env.QR_SECRET || process.env.JWT_SECRET;
	if (!secret) {
		const err = new Error("QR secret tidak tersedia") as Error & {
			status?: number;
		};
		err.status = 500;
		throw err;
	}
	return secret;
};

export const signQr = (userId: string, ts: string) => {
	const secret = getQrSecret();
	return createHmac("sha256", secret).update(`${userId}|${ts}`).digest("hex");
};

export const generateQrString = (userId: string) => {
	const timestamp = new Date().toISOString();
	const signature = signQr(userId, timestamp);
	const qr = `${userId}|${timestamp}|${signature}`;
	return { qr, expiresInMs: 60000 };
};

export const scanAttendance = async (qr: string): Promise<ScanResult> => {
	const { userId, timestamp } = parseQr(qr);
	validateTimestamp(timestamp);

	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) {
		const err = new Error("User tidak ditemukan") as Error & {
			status?: number;
		};
		err.status = 404;
		throw err;
	}
	if (!user.isActive) {
		const err = new Error("Akun dinonaktifkan") as Error & { status?: number };
		err.status = 403;
		throw err;
	}

	const now = new Date();
	const todayDate = witaDateOnly(now);

	const add = addWitaOffset;
	const cut = removeWitaOffset;
	const cutoffCalc = add(now);
	cutoffCalc.setUTCHours(8, 0, 0, 0);
	const cutoffUtc = cut(cutoffCalc);
	const isOnTime = now <= cutoffUtc;
	const cutoffCalcAllowance = add(now);
	cutoffCalcAllowance.setUTCHours(8, 1, 0, 0);
	const cutoffUtcAllowance = cut(cutoffCalcAllowance);
	const isEligible = now <= cutoffUtcAllowance;

	const result = await prisma.$transaction(async (tx) => {
		const prevOpen = await tx.attendance.findFirst({
			where: { userId, checkOutAt: null, attendanceDate: { lt: todayDate } },
			orderBy: { attendanceDate: "desc" },
		});
		if (prevOpen) {
			const endPrev = endOfDayWita(new Date(prevOpen.attendanceDate));
			await tx.attendance.update({
				where: { id: prevOpen.id },
				data: { checkOutAt: endPrev },
			});
		}

		let rec = await tx.attendance.findUnique({
			where: { userId_attendanceDate: { userId, attendanceDate: todayDate } },
			select: {
				id: true,
				userId: true,
				attendanceDate: true,
				checkInAt: true,
				checkOutAt: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!rec) {
			const created = await tx.attendance.create({
				data: {
					userId,
					attendanceDate: todayDate,
					checkInAt: now,
					status: isOnTime ? "ONTIME" : "LATE",
				},
				select: {
					id: true,
					userId: true,
					attendanceDate: true,
					checkInAt: true,
					checkOutAt: true,
					status: true,
					createdAt: true,
					updatedAt: true,
				},
			});
			await tx.mealAllowance.upsert({
				where: { attendanceId: created.id },
				update: {
					isEligible,
					amount: isEligible ? 35000 : 0,
					isPaid: false,
					paidAt: null,
				},
				create: {
					attendanceId: created.id,
					isEligible,
					amount: isEligible ? 35000 : 0,
					isPaid: false,
				},
			});
			return { mode: "CHECK_IN", attendance: created } as ScanResult;
		}

		if (!rec.checkInAt) {
			const updated = await tx.attendance.update({
				where: { id: rec.id },
				data: { checkInAt: now, status: isOnTime ? "ONTIME" : "LATE" },
				select: {
					id: true,
					userId: true,
					attendanceDate: true,
					checkInAt: true,
					checkOutAt: true,
					status: true,
					createdAt: true,
					updatedAt: true,
				},
			});
			await tx.mealAllowance.upsert({
				where: { attendanceId: updated.id },
				update: {
					isEligible,
					amount: isEligible ? 35000 : 0,
					isPaid: false,
					paidAt: null,
				},
				create: {
					attendanceId: updated.id,
					isEligible,
					amount: isEligible ? 35000 : 0,
					isPaid: false,
				},
			});
			return { mode: "CHECK_IN", attendance: updated } as ScanResult;
		}

		if (!rec.checkOutAt) {
			const updated = await tx.attendance.update({
				where: { id: rec.id },
				data: { checkOutAt: now },
				select: {
					id: true,
					userId: true,
					attendanceDate: true,
					checkInAt: true,
					checkOutAt: true,
					status: true,
					createdAt: true,
					updatedAt: true,
				},
			});
			return { mode: "CHECK_OUT", attendance: updated } as ScanResult;
		}

		const err = new Error("Presensi hari ini lengkap") as Error & {
			status?: number;
		};
		err.status = 400;
		throw err;
	});

	return result;
};

export const getMyAttendance = async (
	userId: string,
	page: number,
	pageSize: number,
) => {
	const skip = (page - 1) * pageSize;
	const [items, totalItems] = await Promise.all([
		prisma.attendance.findMany({
			where: { userId },
			orderBy: [{ attendanceDate: "desc" }, { createdAt: "desc" }],
			skip,
			take: pageSize,
			select: {
				id: true,
				userId: true,
				attendanceDate: true,
				checkInAt: true,
				checkOutAt: true,
				status: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		prisma.attendance.count({ where: { userId } }),
	]);
	return { items, totalItems };
};

export const getTodayAttendance = async (userId: string) => {
	const now = new Date();
	const start = startOfDayWita(now);
	const end = endOfDayWita(now);
	const rec = await prisma.attendance.findFirst({
		where: {
			userId,
			createdAt: { gte: start, lte: end },
		},
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			userId: true,
			checkInAt: true,
			checkOutAt: true,
			status: true,
			createdAt: true,
			updatedAt: true,
		},
	});
	if (!rec) return null;
	const attendanceDate = witaDateOnly(rec.createdAt);
	return { ...rec, attendanceDate };
};

export const getTodaySummary = async (cutoffHour = 8, cutoffMinute = 0) => {
	const now = new Date();
	const start = startOfDayWita(now);
	const end = endOfDayWita(now);
	const users = await prisma.user.findMany({
		where: { isActive: true },
		select: { id: true },
	});
	const ids = users.map((u) => u.id);
	const totalUsers = ids.length;
	if (totalUsers === 0) {
		return { belumCheckIn: 0, onTime: 0, terlambat: 0, totalUsers: 0 };
	}
	const records = await prisma.attendance.findMany({
		where: {
			userId: { in: ids },
			createdAt: { gte: start, lte: end },
		},
		select: { userId: true, checkInAt: true },
	});
	const add = addWitaOffset;
	const cut = removeWitaOffset;
	const d = add(now);
	d.setUTCHours(cutoffHour, cutoffMinute, 0, 0);
	const cutoffUtc = cut(d);
	let belumCheckIn = 0;
	let onTime = 0;
	let terlambat = 0;
	const map = new Map<string, { checkInAt: Date | null }>();
	for (const r of records) {
		map.set(r.userId, { checkInAt: r.checkInAt ?? null });
	}
	for (const id of ids) {
		const rec = map.get(id);
		if (!rec || !rec.checkInAt) {
			belumCheckIn++;
		} else if (rec.checkInAt <= cutoffUtc) {
			onTime++;
		} else {
			terlambat++;
		}
	}
	return { belumCheckIn, onTime, terlambat, totalUsers };
};

export const getMealAllowanceSummary = async (start: Date, end: Date) => {
	const items = await prisma.mealAllowance.findMany({
		where: {
			isEligible: true,
			isPaid: false,
			createdAt: { gte: start, lte: end },
		},
		select: { id: true, amount: true },
	});
	const total = items.reduce((s, i) => s + i.amount, 0);
	return { total, count: items.length };
};

export const markMealAllowancePaid = async (start: Date, end: Date) => {
	const now = new Date();
	await prisma.mealAllowance.updateMany({
		where: {
			isEligible: true,
			isPaid: false,
			createdAt: { gte: start, lte: end },
		},
		data: { isPaid: true, paidAt: now },
	});
};
