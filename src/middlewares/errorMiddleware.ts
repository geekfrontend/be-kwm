import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response";
import { Prisma } from "../../prisma/generated/client/client";

export const errorHandler = (
	err: unknown,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	let status = 500;
	let message = "Internal Server Error";

	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code === "P2002") {
			status = 400;
			message = "Duplicate value";
		} else if (err.code === "P2025") {
			status = 404;
			message = "Resource not found";
		} else if (
			typeof (err as unknown as { status?: unknown }).status === "number"
		) {
			status = (err as unknown as { status: number }).status;
		}
	} else if (err instanceof Error) {
		message = err.message;
		if (typeof (err as unknown as { status?: unknown }).status === "number") {
			status = (err as unknown as { status: number }).status;
		}
		const code = (err as { code?: unknown }).code;
		if (code === "P2002") {
			status = 400;
			message = "Duplicate value";
		} else if (code === "P2025") {
			status = 404;
			message = "Resource not found";
		}
	}

	sendError(res, status, message);
};
