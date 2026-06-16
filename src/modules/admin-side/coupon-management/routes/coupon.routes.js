import { Router } from "express";
import { createCouponController, DeleteCouponController, getCouponController, getCouponDetailsController, toggleCouponStatusController, updateCouponController } from "../controllers/coupon.controller.js";
import { validate } from "../../../../common/middleware/validate.middleware.js";
import { createCouponScheama } from "../validations/coupoun.validation.js";

const router = Router()

router.post("/", validate(createCouponScheama), createCouponController)
router.get("/", getCouponController)
router.get("/:couponId", getCouponDetailsController)
router.put("/:couponId", updateCouponController)
router.patch("/:couponId/status", toggleCouponStatusController)
router.delete("/:couponId", DeleteCouponController)

export default router