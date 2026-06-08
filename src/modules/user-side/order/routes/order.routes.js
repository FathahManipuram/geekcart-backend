import { Router } from "express";
import authMiddleware from "../../../../common/middleware/auth.middleware.js";
import { validate } from "../../../../common/middleware/validate.middleware.js";
import { cancelOrderController, createOrderController, getAllOrdersController, getOrderByIdController } from "../controllers/order.controller.js";
import { cancelOrderSchema } from "../validations/order.validation.js";

const router= Router()

router.post("/", authMiddleware, createOrderController)
router.get("/success/:orderId", authMiddleware, getOrderByIdController);
router.get("/order-history", authMiddleware, getAllOrdersController)
router.patch("/:orderId/cancel", authMiddleware, validate(cancelOrderSchema), cancelOrderController,)

export default router