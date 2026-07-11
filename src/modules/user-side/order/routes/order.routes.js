import { Router } from "express";
import authMiddleware from "../../../../common/middleware/auth.middleware.js";
import { validate } from "../../../../common/middleware/validate.middleware.js";
import {
  cancelAllOrderController,
  cancelOrderItemController,
  createOrderController,
  downloadinvoiceController,
  getAllOrdersController,
  getOrderByIdController,
} from "../controllers/order.controller.js";
import {
  cancelOrderItemSchema,
  cancelOrderSchema,
} from "../validations/order.validation.js";

const router = Router();

router.post("/", authMiddleware, createOrderController);
router.get("/success/:orderId", authMiddleware, getOrderByIdController);
router.get("/order-history", authMiddleware, getAllOrdersController);
router.patch(
  "/:orderId/cancel",
  authMiddleware,
  validate(cancelOrderSchema),
  cancelAllOrderController,
);
router.patch(
  "/:orderId/items/:itemId/cancel",
  authMiddleware,
  validate(cancelOrderItemSchema),
  cancelOrderItemController,
);
router.get("/:orderId/invoice", authMiddleware, downloadinvoiceController);
export default router;
