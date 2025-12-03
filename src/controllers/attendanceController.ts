import { Request, Response, NextFunction } from "express";
import { sendSuccess, sendPaginatedSuccess } from "../utils/response";
import { AuthRequest } from "../middlewares/authMiddleware";
import {
	scanAttendance,
	getMyAttendance,
	generateQrString,
	getTodayAttendance,
	getTodaySummary,
} from "../services/attendanceService";

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
