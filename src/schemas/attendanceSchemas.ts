import { z } from "zod";

export const scanAttendanceSchema = z.object({
	qr: z.string().min(1, { message: "QR code tidak boleh kosong" }),
});
