import { z } from "zod";

export const divisionCreateSchema = z.object({
    name: z.string().min(1, { message: "Nama wajib diisi" }),
    isActive: z.boolean({ message: "Status aktif harus boolean" }).optional(),
});

export const divisionUpdateSchema = z.object({
    name: z.string().min(1, { message: "Nama wajib diisi" }).optional(),
    isActive: z.boolean({ message: "Status aktif harus boolean" }).optional(),
});

