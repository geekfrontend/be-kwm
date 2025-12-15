import { z } from "zod";

export const roles = ["ADMIN", "SECURITY", "EMPLOYEE"] as const;


export const userCreateSchema = z.object({
  name: z.string().min(1, { message: "Nama wajib diisi" }),

  email: z.email({ message: "Email tidak valid" }),

  password: z.string().min(8, {
    message: "Kata sandi minimal 8 karakter",
  }),

  role: z.enum(roles, {
    message: "Role tidak valid",
  }).optional(),

  isActive: z.boolean({
    message: "Status aktif harus boolean",
  }).optional(),

  divisionId: z.string().optional(),

  // ===== tambahan sesuai model =====
  address: z.string().optional(),

  education: z.string().optional(),

  position: z.string().optional(),

  nik: z.string().optional(),

  bpjsTk: z.string().optional(),

  bpjsKes: z.string().optional(),

  startWorkDate: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      "Tanggal mulai kerja tidak valid",
    ),
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
  divisionId: z.string({ message: "DivisionId harus string" }).optional(),

  // 🔽 tambahan field sesuai model User
  ttl: z.string().optional(),
  address: z.string().optional(),
  education: z.string().optional(),
  startWorkDate: z
    .string()
    .optional(),
  position: z.string().optional(),
  nik: z.string().optional(),
  bpjsTk: z.string().optional(),
  bpjsKes: z.string().optional(),
});