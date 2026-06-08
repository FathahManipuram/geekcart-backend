import { Router } from "express";
import { getOrderByIdController, getOrdersController, updateOrderStatusController } from "../controllers/adminOrder.contoller.js";
import { validate } from "../../../../common/middleware/validate.middleware.js";
import { updateOrderStatusSchema } from "../validations/order.validation.js";

const router= Router()

router.get("/", getOrdersController)
router.get("/:orderId",getOrderByIdController)
router.patch("/:orderId/status", validate(updateOrderStatusSchema), updateOrderStatusController)

export default router