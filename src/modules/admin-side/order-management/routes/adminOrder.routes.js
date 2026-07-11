import { Router } from "express";
import {
  getOrderByIdController,
  getOrdersController,
  updateOrderItemStatusController,
  updateOrderStatusController,
} from "../controllers/adminOrder.contoller.js";
import { validate } from "../../../../common/middleware/validate.middleware.js";
import { updateOrderStatusSchema } from "../validations/order.validation.js";

const router = Router();

router.get("/", getOrdersController);
router.get("/:orderId", getOrderByIdController);
router.patch(
  "/:orderId/status",
  validate(updateOrderStatusSchema),
  updateOrderStatusController,
);
router.patch("/:orderId/items/:itemId/status", updateOrderItemStatusController);

export default router;
