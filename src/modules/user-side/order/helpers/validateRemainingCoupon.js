export const validateRemainingCoupon = ({ order, remainingItems }) => {
  if (!remainingItems || remainingItems.length === 0) {
    return { isValid: false, discount: 0 };
  }

  const remainingSubtotal = remainingItems.reduce(
    (sum, item) => sum + (item.salePrice ?? item.price) * item.quantity,
    0,
  );

  const minOrderAmount =
    order.coupon?.minOrderAmount || order.coupon?.couponId?.minOrderAmount || 0;

  if (remainingSubtotal < minOrderAmount) {
    return { isValid: false, discount: 0 };
  }

  const remainingCouponDiscount = remainingItems.reduce(
    (sum, item) => sum + (item.couponDiscount ?? 0),
    0,
  );

  return {
    isValid: true,
    discount: Number(remainingCouponDiscount.toFixed(2)),
  };
};
