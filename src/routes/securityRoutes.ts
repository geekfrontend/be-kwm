import { Router } from "express";
import { authenticateToken, authorizeRole } from "../middlewares/authMiddleware";
import { scan } from "../controllers/attendanceController";
import { validate } from "../middlewares/validationMiddleware";
import { scanAttendanceSchema } from "../schemas";
import { $Enums } from "../../prisma/generated/client/client";

const router = Router();

router.post(
  "/scan-attendance",
  authenticateToken,
  authorizeRole($Enums.Role.SECURITY),
  validate(scanAttendanceSchema),
  scan,
);

export default router;
