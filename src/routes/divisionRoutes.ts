import { Router } from "express";
import {
    authenticateToken,
    authorizeRole,
} from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import {
    divisionCreateSchema,
    divisionUpdateSchema,
} from "../schemas";
import * as divisionController from "../controllers/divisionController";

const router = Router();

router.post(
    "/",
    authenticateToken,
    authorizeRole("ADMIN"),
    validate(divisionCreateSchema),
    divisionController.createDivision,
);

router.get(
    "/",
    authenticateToken,
    authorizeRole("ADMIN"),
    divisionController.getDivisions,
);

router.get(
    "/:id",
    authenticateToken,
    authorizeRole("ADMIN"),
    divisionController.getDivisionById,
);

router.put(
    "/:id",
    authenticateToken,
    authorizeRole("ADMIN"),
    validate(divisionUpdateSchema),
    divisionController.updateDivision,
);

router.delete(
    "/:id",
    authenticateToken,
    authorizeRole("ADMIN"),
    divisionController.deleteDivision,
);

export default router;

