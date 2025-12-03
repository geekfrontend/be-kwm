import { Router } from "express";
import { authenticateToken, authorizeRole } from "../middlewares/authMiddleware";
import { myHistory, myQr, myToday, dashboardSummary } from "../controllers/attendanceController";
import { $Enums } from "../../prisma/generated/client/client";

const router = Router();

router.get("/me", authenticateToken, myHistory);
router.get("/my-qr", authenticateToken, myQr);
router.get("/today", authenticateToken, myToday);
router.get(
  "/summary/today",
  authenticateToken,
  authorizeRole($Enums.Role.ADMIN),
  dashboardSummary,
);

export default router;
