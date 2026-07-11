import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { Coupon } from "../../../admin-side/coupon-management/models/coupon.model.js";
import { Cart } from "../../cart/models/cart.model.js";
import { calculateCouponDiscount } from "../helper/calculateCouponDiscount.helper.js";
import { validateCoupon } from "../helper/validateCoupon.helper.js";

//Get available coupons
export const getAvailableCouponsService = async () => {
  const now = new Date();

  const coupons = await Coupon.find({
    isActive: true,

    startDate: {
      $lte: now,
    },

    expiryDate: {
      $gte: now,
    },

    isDeleted: false,
  })
    .select(
      `
      code
      description
      discountType
      discountValue
      minOrderAmount
      maxDiscountAmount
    `,
    )
    .sort({
      createdAt: -1,
    });

  return {
    message: "Coupons fetched successfully",

    data: coupons,
  };
};

//Apply coupon
export const applyCouponService = async ({ userId, couponCode }) => {
  if (!couponCode?.trim()) {
    throw new AppError("Coupon code is required", HTTP_STATUS.BAD_REQUEST);
  }

  const cart = await Cart.findOne({ userId });

  if (!cart || !cart.items.length) {
    throw new AppError("Cart is empty", HTTP_STATUS.BAD_REQUEST);
  }

  const coupon = await Coupon.findOne({
    code: couponCode.trim().toUpperCase(),
  });

  const subtotal = cart.summary?.subtotal || 0;

  await validateCoupon({
    userId,
    coupon,
    subtotal,
  });

  const discount = calculateCouponDiscount({
    coupon,
    subtotal,
  });

  return {
    message: "Coupon applied successfully",

    data: {
      couponId: coupon._id,

      couponCode: coupon.code,

      discount,

      discountType: coupon.discountType,

      discountValue: coupon.discountValue,
    },
  };
};
