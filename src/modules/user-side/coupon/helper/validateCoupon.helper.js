import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { getCouponUsageByUser } from "./getCouponUsageByUser.js";

export const validateCoupon = async ({ userId, coupon, subtotal }) => {
  if (!coupon) {
    throw new AppError("Coupon not found", HTTP_STATUS.NOT_FOUND);
  }

  if (!coupon.isActive) {
    throw new AppError("Coupon is inactive", HTTP_STATUS.BAD_REQUEST);
  }

  if (coupon.startDate && coupon.startDate > new Date()) {
    throw new AppError("Coupon is not active yet", HTTP_STATUS.BAD_REQUEST);
  }

  if (coupon.expiryDate && coupon.expiryDate < new Date()) {
    throw new AppError("Coupon has expired", HTTP_STATUS.BAD_REQUEST);
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError("Coupon usage limit reached", HTTP_STATUS.BAD_REQUEST);
  }

  if (subtotal < coupon.minOrderAmount) {
    throw new AppError(
      `Coupon not valid. Minimum order amount is ₹${coupon.minOrderAmount}`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (coupon.perUserLimit) {
    const userUsageCount = await getCouponUsageByUser({
      userId,
      couponId: coupon._id,
    });

    if (userUsageCount >= coupon.perUserLimit) {
      throw new AppError(
        `You've already used this coupon. It can only be redeemed ${coupon.perUserLimit} ${coupon.perUserLimit === 1 ? "time" : "times"} per customer.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  return true;
};
