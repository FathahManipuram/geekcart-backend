import { Router } from "express";
import {
  createRazorpayOrderController,
  verifyPaymentController,
} from "../controller/payment.controller.js";

const router = Router();

router.post("/create-order", createRazorpayOrderController);
router.post("/verify", verifyPaymentController);

export default router;
