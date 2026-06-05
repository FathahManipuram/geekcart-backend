import { Router } from "express";
import authMiddleware from "../../../../common/middleware/auth.middleware.js";
import { validateCheckoutController, validatePaymentController, validateShippingController } from "../controllers/checkout.controller.js";
import { validate } from "../../../../common/middleware/validate.middleware.js";
import { validatePaymentSchema, validateShippingSchema } from "../valdations/checkout.validation.js";

const router= Router()

router.post("/validate", authMiddleware, validateCheckoutController);
router.post(
  "/shipping/validate",
  authMiddleware,
  validate(validateShippingSchema),
  validateShippingController,
);
router.post("/payment/validate", authMiddleware, validate(validatePaymentSchema), validatePaymentController)
export default router