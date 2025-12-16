import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { AuthRequest } from "../middlewares/authMiddleware";
import { sendSuccess } from "../utils/response";

export const login = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { noHp, password } = req.body;
		const result = await authService.login(noHp, password);
		sendSuccess(res, result, "Login berhasil");
	} catch (error: unknown) {
		const status =
			typeof (error as { status?: unknown }).status === "number"
				? (error as { status: number }).status
				: 401;
		const message =
			error instanceof Error ? error.message : "Authentication failed";
		const err = new Error(message) as Error & { status?: number };
		err.status = status;
		next(err);
	}
};

export const logout = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = (req as AuthRequest).user?.userId;
		if (userId) {
			await authService.logout(userId);
		}
		sendSuccess(res, null, "Logout berhasil");
	} catch (error: unknown) {
		next(error);
	}
};

export const getMe = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const userId = (req as AuthRequest).user?.userId;
		if (!userId) {
			const err = new Error("Unauthorized") as Error & { status?: number };
			err.status = 401;
			next(err);
			return;
		}
		const user = await authService.getMe(userId);
		sendSuccess(res, user, "Profil berhasil diambil");
	} catch (error: unknown) {
		next(error);
	}
};
