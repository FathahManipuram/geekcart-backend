import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";

export const validateCoupon = ({ coupon, subtotal }) => {
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
      `Minimum order amount is ₹${coupon.minOrderAmount}`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return true;
};
