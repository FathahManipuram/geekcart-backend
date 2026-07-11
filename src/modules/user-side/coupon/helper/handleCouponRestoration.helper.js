import { Coupon } from "../../../admin-side/coupon-management/models/coupon.model.js";

export const handleCouponRestoration = async (order) => {
  if (!order.coupon || !order.coupon.couponId) return;

  try {
    await Coupon.findByIdAndUpdate(order.coupon.couponId, {
      $inc: { usedCount: -1 },
    });
  } catch (error) {
    console.error("Failed to restore coupon usage:", error);
  }
};
