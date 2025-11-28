import { z } from "zod";

export const roles = ["ADMIN", "SECURITY", "EMPLOYEE"] as const;

export const userCreateSchema = z.object({
	name: z.string().min(1, { message: "Nama wajib diisi" }),
	email: z.email({ message: "Email tidak valid" }),
	password: z.string().min(8, { message: "Kata sandi minimal 8 karakter" }),
	role: z.enum(roles, { message: "Role tidak valid" }).optional(),
	isActive: z.boolean({ message: "Status aktif harus boolean" }).optional(),
});

export const userUpdateSchema = z.object({
	name: z.string().min(1, { message: "Nama wajib diisi" }).optional(),
	email: z.email({ message: "Email tidak valid" }).optional(),
	password: z
		.string()
		.min(8, { message: "Kata sandi minimal 8 karakter" })
		.optional(),
	role: z.enum(roles, { message: "Role tidak valid" }).optional(),
	isActive: z.boolean({ message: "Status aktif harus boolean" }).optional(),
});
