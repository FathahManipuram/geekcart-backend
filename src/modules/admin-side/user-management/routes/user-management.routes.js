import { Router } from "express";
import { blockUserController, deleteUserController, getUserByIdController, getUserManagementController } from "../controllers/user-management.controller.js";

const router = Router()

router.get("/users", getUserManagementController)
router.get("/users/:userId", getUserByIdController)
router.delete("/users/:userId", deleteUserController)
router.patch("/users/:userId/block", blockUserController)

export default router