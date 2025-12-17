import { Router } from "express";
import * as userController from "../controllers/userController";
import {
    authenticateToken,
    authorizeRole,
    authorizeSelfOrAdmin,
} from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import { userCreateSchema, userUpdateSchema } from "../schemas";

const router = Router();

router.post(
	"/",
	authenticateToken,
	authorizeRole("ADMIN"),
	validate(userCreateSchema),
	userController.createUser,
);
router.get(
	"/",
	// authenticateToken,
	// authorizeRole("ADMIN"),
	userController.getUsers,
);
router.get(
	"/:id",
	authenticateToken,
	authorizeSelfOrAdmin,
	userController.getUserById,
);
router.put(
	"/:id",
	authenticateToken,
	authorizeRole("ADMIN"),
	validate(userUpdateSchema),
	userController.updateUser,
);
router.delete(
	"/:id",
	userController.deleteUser,
);

export default router;
