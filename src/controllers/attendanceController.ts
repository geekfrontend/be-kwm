import { Request, Response, NextFunction } from "express";
import { sendSuccess, sendPaginatedSuccess } from "../utils/response";
import { AuthRequest } from "../middlewares/authMiddleware";
import {
	scanAttendance,
	getMyAttendance,
	generateQrString,
	getTodayAttendance,
	getTodaySummary,
	getMealAllowanceSummary,
	markMealAllowancePaid,
} from "../services/attendanceService.js";

export const scan = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { qr } = req.body as { qr: string };
		const result = await scanAttendance(qr);
		sendSuccess(
			res,
			{ mode: result.mode, attendance: result.attendance },
			result.mode === "CHECK_IN"
				? "Presensi berhasil check-in"
				: "Presensi berhasil check-out",
		);
	} catch (error) {
		next(error);
	}
};

export const myHistory = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = (req as AuthRequest).user?.userId;
		if (!userId) {
			const err = new Error("Unauthorized") as Error & { status?: number };
			err.status = 401;
			throw err;
		}
		const pageRaw = (req.query.page as string) ?? "1";
		const pageSizeRaw = (req.query.pageSize as string) ?? "10";
		const page = Math.max(1, Number(pageRaw) || 1);
		const maxPageSize = 100;
		const pageSize = Math.min(
			maxPageSize,
			Math.max(1, Number(pageSizeRaw) || 10),
		);
		const { items, totalItems } = await getMyAttendance(userId, page, pageSize);
		sendPaginatedSuccess(
			res,
			items,
			page,
			pageSize,
			totalItems,
			"Riwayat presensi berhasil diambil",
		);
	} catch (error) {
		next(error);
	}
};

const lastQrAt = new Map<string, number>();

export const myQr = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const userId = (req as AuthRequest).user?.userId;
		if (!userId) {
			const err = new Error("Unauthorized") as Error & { status?: number };
			err.status = 401;
			throw err;
		}
		const now = Date.now();
		const last = lastQrAt.get(userId) || 0;
		if (now - last < 10000) {
			const err = new Error("Terlalu sering membuat QR") as Error & {
				status?: number;
			};
			err.status = 429;
			throw err;
		}
		lastQrAt.set(userId, now);
		const { qr, expiresInMs } = generateQrString(userId);
		sendSuccess(res, { qr, expiresInMs }, "QR berhasil dibuat");
	} catch (error) {
		next(error);
	}
};

export const myToday = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = (req as AuthRequest).user?.userId;
		if (!userId) {
			const err = new Error("Unauthorized") as Error & { status?: number };
			err.status = 401;
			throw err;
		}
		const attendance = await getTodayAttendance(userId);
		const msg = attendance
			? "Presensi hari ini berhasil diambil"
			: "Belum ada presensi hari ini";
		sendSuccess(res, attendance, msg);
	} catch (error) {
		next(error);
	}
};

export const dashboardSummary = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const summary = await getTodaySummary();
		sendSuccess(res, summary, "Ringkasan presensi hari ini berhasil diambil");
	} catch (error) {
		next(error);
	}
};

export const allowanceSummary = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const startRaw = (req.query.start as string) ?? "";
		const endRaw = (req.query.end as string) ?? "";
		let start: Date;
		let end: Date;
		if (startRaw && endRaw) {
			start = new Date(startRaw);
			end = new Date(endRaw);
		} else {
			const now = new Date();
			end = now;
			start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
		}
		const { total, count } = await getMealAllowanceSummary(start, end);
		sendSuccess(res, { total, count, start, end }, "Ringkasan tunjangan makan");
	} catch (error) {
		next(error);
	}
};

export const markAllowancePaid = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const startRaw =
			(req.body.start as string) ?? (req.query.start as string) ?? "";
		const endRaw = (req.body.end as string) ?? (req.query.end as string) ?? "";
		if (!startRaw || !endRaw) {
			const err = new Error("Parameter periode tidak lengkap") as Error & {
				status?: number;
			};
			err.status = 400;
			throw err;
		}
		const start = new Date(startRaw);
		const end = new Date(endRaw);
		await markMealAllowancePaid(start, end);
		sendSuccess(res, {
			message: "Tunjangan makan ditandai sudah dibayar",
			start,
			end,
		});
	} catch (error) {
		next(error);
	}
};
