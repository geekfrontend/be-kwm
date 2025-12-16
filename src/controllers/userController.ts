import { Request, Response, NextFunction } from "express";
import * as userService from "../services/userService";
import prisma from "../lib/prisma";
import { sendSuccess, sendPaginatedSuccess } from "../utils/response";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201);
    sendSuccess(res, user, "User berhasil dibuat");
  } catch (error: unknown) {
    next(error);
  }
};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pageRaw = req.query.page;
    const pageSizeRaw = req.query.pageSize;
    const page = Math.max(1, Number(pageRaw ?? 1) || 1);
    const pageSize = Math.max(1, Number(pageSizeRaw ?? 10) || 10);
    const skip = (page - 1) * pageSize;

    const select = {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      division: { select: { id: true, name: true } },
      ketStatus: true,
      ttl: true,
      noHp: true,
      address: true,
      education: true,
      startWorkDate: true,
      position: true,
      nik: true,
      bpjsTk: true,
      bpjsKes: true,
      createdAt: true,
      updatedAt: true,
    };

    const [items, totalItems] = await Promise.all([
      prisma.user.findMany({ skip, take: pageSize, select }),
      prisma.user.count(),
    ]);

    sendPaginatedSuccess(
      res,
      items,
      page,
      pageSize,
      totalItems,
      "Daftar user berhasil diambil"
    );
  } catch (error: unknown) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const user = await userService.getUserById(id);
    if (!user) {
      const err = new Error("User not found") as Error & { status?: number };
      err.status = 404;
      next(err);
      return;
    }
    sendSuccess(res, user, "User berhasil diambil");
  } catch (error: unknown) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const user = await userService.updateUser(id, req.body);
    sendSuccess(res, user, "User berhasil diperbarui");
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    await userService.deleteUser(id);
    sendSuccess(
      res,
      { message: "User berhasil dihapus" },
      "User berhasil dihapus"
    );
  } catch (error: unknown) {
    next(error);
  }
};
