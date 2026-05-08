import { Router } from "express";
import { deleteUserController, getUserByIdController, getUserManagementController } from "../controllers/user-management.controller.js";

const router = Router()

router.get("/users", getUserManagementController)
router.get("/users/:userId", getUserByIdController)
router.delete("/users/:userId", deleteUserController)

export default router