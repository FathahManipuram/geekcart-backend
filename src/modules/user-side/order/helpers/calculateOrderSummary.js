import { validateRemainingCoupon } from "./validateRemainingCoupon.js";

export const calculateOrderSummary = (order) => {
  if (!order || !order.items || order.items.length === 0) {
    return {
      subtotal: 0,
      discount: 0,
      couponDiscount: 0,
      deliveryCharge: 0,
      totalAmount: 0,
    };
  }

  const activeItems = order.items.filter((item) => {
    const currentStatus = item.itemStatus || order.orderStatus || "PLACED";
    return !["CANCELLED", "RETURN_COMPLETED"].includes(currentStatus);
  });

  if (activeItems.length === 0) {
    return {
      subtotal: 0,
      discount: 0,
      couponDiscount: 0,
      deliveryCharge: 0,
      totalAmount: 0,
    };
  }

  const subtotal = activeItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const discount = activeItems.reduce(
    (sum, item) => sum + (item.price - item.salePrice) * item.quantity,
    0,
  );

  let couponDiscount = 0;
  if (
    order.coupon &&
    (order.coupon.discountAmount > 0 || order.coupon.originalDiscountAmount > 0)
  ) {
    const couponCheck = validateRemainingCoupon({
      order,
      remainingItems: activeItems,
    });

    if (couponCheck.isValid) {
      couponDiscount = activeItems.reduce(
        (sum, item) => sum + (item.couponDiscount ?? 0),
        0,
      );
    } else {
      couponDiscount = 0;
    }
  }

  const deliveryCharge = (order.shippingCharge ?? 0) + (order.speedCharge ?? 0);

  const total = subtotal - discount - couponDiscount + deliveryCharge;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    couponDiscount: Number(couponDiscount.toFixed(2)),
    deliveryCharge,
    totalAmount: Math.max(0, Number(total.toFixed(2))),
  };
};
