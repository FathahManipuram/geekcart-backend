import { Router } from "express";
import { blockUserController, createUserController, deleteUserController, getUserByIdController, getUserManagementController, updateUserController } from "../controllers/user-management.controller.js";
import { validate } from "../../../../common/middleware/validate.middleware.js";
import { createUserSchema } from "../validations/createUser.validation.js";
import { updateUserSchema } from "../validations/updateUser.validation.js";

const router = Router()

router.get("/users", getUserManagementController)
router.get("/users/:userId", getUserByIdController)
router.delete("/users/:userId", deleteUserController)
router.patch("/users/:userId/block", blockUserController)
router.post("/users/create-user", validate(createUserSchema), createUserController)
router.patch("/users/edit-user/:userId", validate(updateUserSchema), updateUserController)

export default router