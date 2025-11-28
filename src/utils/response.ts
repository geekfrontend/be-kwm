import { Response } from "express";

type Meta = {
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
};

type SuccessPayload<T = unknown> = {
	status: "success";
	message: string;
	data: T;
	meta?: Meta;
};

type ErrorPayload = {
	status: "error";
	message: string;
	errors?: Record<string, string>;
};

export const sendSuccess = <T = unknown>(
	res: Response,
	data: T,
	message?: string,
	meta?: Meta,
) => {
	const msg = message ?? "Operasi berhasil.";
	const payload: SuccessPayload<T> = { status: "success", message: msg, data };
	if (meta) payload.meta = meta;
	return res.json(payload);
};

export const sendPaginatedSuccess = <T = unknown>(
	res: Response,
	items: T[],
	page: number,
	pageSize: number,
	totalItems: number,
	message?: string,
) => {
	const totalPages = Math.ceil(totalItems / pageSize);
	const msg = message ?? "Operasi berhasil.";
	const payload: SuccessPayload<{ items: T[] }> = {
		status: "success",
		message: msg,
		data: { items },
		meta: { page, pageSize, totalItems, totalPages },
	};
	return res.json(payload);
};

export const sendError = (
	res: Response,
	statusCode: number,
	message: string,
	errors?: Record<string, string>,
) => {
	const payload: ErrorPayload = { status: "error", message };
	if (errors) payload.errors = errors;
	return res.status(statusCode).json(payload);
};
