import { Router } from "express";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/authMiddleware";
import {
  myHistory,
  myQr,
  myToday,
  dashboardSummary,
  allowanceSummary,
  markAllowancePaid,
  attendanceByUserId,
} from "../controllers/attendanceController.js";
import { $Enums } from "../../prisma/generated/client/client";

const router = Router();

router.get("/me", authenticateToken, myHistory);
router.get("/my-qr", authenticateToken, myQr);
router.get("/today", authenticateToken, myToday);
router.get(
  "/summary/today",
  authenticateToken,
  authorizeRole($Enums.Role.ADMIN),
  dashboardSummary
);

router.get(
  "/user/:userId",
  authenticateToken,
  authorizeRole($Enums.Role.ADMIN),
  attendanceByUserId
);

router.get(
  "/allowances/summary",
  authenticateToken,
  authorizeRole($Enums.Role.ADMIN),
  allowanceSummary
);

router.put(
  "/allowances/:attendanceId/pay",
  authenticateToken,
  authorizeRole($Enums.Role.ADMIN),
  markAllowancePaid
);

export default router;
