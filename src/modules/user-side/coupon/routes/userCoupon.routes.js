import { Router } from "express";
import authMiddleware from "../../../../common/middleware/auth.middleware.js";
import { applyCouponController, getAvailableCouponsController } from "../controllers/userCoupon.controller.js";

const router= Router()
router.get("/available", authMiddleware, getAvailableCouponsController);
router.post("/apply-coupon", authMiddleware, applyCouponController);

export default router