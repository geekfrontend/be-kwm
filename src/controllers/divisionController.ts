import { Request, Response, NextFunction } from "express";
import { sendSuccess, sendPaginatedSuccess } from "../utils/response";
import * as divisionService from "../services/divisionService";

export const createDivision = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const division = await divisionService.createDivision(req.body);
        sendSuccess(res, division, "Division berhasil dibuat");
    } catch (error) {
        next(error);
    }
};

export const getDivisions = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const pageRaw = req.query.page;
        const pageSizeRaw = req.query.pageSize;
        const page = Math.max(1, Number(pageRaw ?? 1) || 1);
        const pageSize = Math.max(1, Number(pageSizeRaw ?? 10) || 10);
        const { items, totalItems } = await divisionService.getDivisions(page, pageSize);
        sendPaginatedSuccess(res, items, page, pageSize, totalItems, "Daftar division berhasil diambil");
    } catch (error) {
        next(error);
    }
};

export const getDivisionById = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const id = req.params.id;
        const division = await divisionService.getDivisionById(id);
        if (!division) {
            const err = new Error("Division not found") as Error & { status?: number };
            err.status = 404;
            next(err);
            return;
        }
        sendSuccess(res, division, "Division berhasil diambil");
    } catch (error) {
        next(error);
    }
};

export const updateDivision = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const id = req.params.id;
        const division = await divisionService.updateDivision(id, req.body);
        sendSuccess(res, division, "Division berhasil diperbarui");
    } catch (error) {
        next(error);
    }
};

export const deleteDivision = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const id = req.params.id;
        await divisionService.deleteDivision(id);
        sendSuccess(res, { message: "Division berhasil dihapus" }, "Division berhasil dihapus");
    } catch (error) {
        next(error);
    }
};

