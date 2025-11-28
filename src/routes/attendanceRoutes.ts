import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import { myHistory, myQr } from "../controllers/attendanceController";

const router = Router();

router.get("/me", authenticateToken, myHistory);
router.get("/my-qr", authenticateToken, myQr);

export default router;
