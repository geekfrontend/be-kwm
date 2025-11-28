import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { sendError } from "../utils/response";

export const validate =
    <T>(schema: z.ZodSchema<T>) =>
    (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
		if (!result.success) {
			const flattened = result.error.flatten();
			const formatted: Record<string, string> = {};
			const fe = flattened.fieldErrors as Record<string, string[] | undefined>;
			for (const key of Object.keys(fe)) {
				const msgs = fe[key];
				if (msgs && msgs.length > 0) formatted[key] = msgs[0];
			}
			return sendError(res, 400, "Validation failed.", formatted);
		}
		req.body = result.data as T;
        next();
    };
