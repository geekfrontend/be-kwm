import { Router } from "express";
import * as authController from "../controllers/authController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import { loginSchema } from "../schemas";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.delete("/logout", authenticateToken, authController.logout);
router.get("/me", authenticateToken, authController.getMe);

export default router;
