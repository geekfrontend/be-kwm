import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "../lib/prisma";
import { sendError } from "../utils/response";
import { $Enums } from "../../prisma/generated/client/client";

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthRequest extends Request {
	user?: {
		userId: string;
		noHp: string;
		role: $Enums.Role;
	};
}

interface AppJwtPayload extends JwtPayload {
	userId: string;
	noHp: string;
	role: string;
}

export const authenticateToken = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (!token) {
		sendError(res, 401, "Unauthorized");
		return;
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		if (typeof decoded !== "object" || decoded === null) {
			sendError(res, 401, "Unauthorized");
			return;
		}
		const payload = decoded as AppJwtPayload;
		const userId = payload.userId;
		if (!userId) {
			sendError(res, 401, "Unauthorized");
			return;
		}
		const dbUser = await prisma.user.findUnique({ where: { id: userId } });
		if (!dbUser || !dbUser.token || dbUser.token !== token) {
			sendError(res, 401, "Unauthorized");
			return;
		}
		if (!dbUser.isActive) {
			sendError(res, 403, "Account disabled");
			return;
		}
		(req as AuthRequest).user = {
			userId,
			noHp: dbUser.noHp,
			role: dbUser.role,
		};
		next();
	} catch {
		sendError(res, 401, "Unauthorized");
	}
};

export const authorizeRole =
	(role: $Enums.Role) => (req: Request, res: Response, next: NextFunction) => {
		const user = (req as AuthRequest).user;
		if (!user) {
			sendError(res, 401, "Unauthorized");
			return;
		}
		if (user.role !== role) {
			sendError(res, 403, "Forbidden");
			return;
		}
		next();
	};

export const authorizeSelfOrAdmin = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const user = (req as AuthRequest).user;
	const targetId = req.params.id;
	if (!user) {
		sendError(res, 401, "Unauthorized");
		return;
	}
	if (user.role === $Enums.Role.ADMIN || user.userId === targetId) {
		next();
		return;
	}
	sendError(res, 403, "Forbidden");
};
