import { z } from "zod";

export const loginSchema = z.object({
	noHp: z.string({ message: "No Hp Harus String" }).min(1, { message: "No Hp wajib diisi" }).max(12, { message: "No Hp maksimal 12 karakter" }),
	password: z.string().min(8, { message: "Kata sandi minimal 8 karakter" }),
});
