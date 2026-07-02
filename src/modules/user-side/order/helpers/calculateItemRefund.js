import { validateRemainingCoupon } from "./validateRemainingCoupon.js";

export const calculateItemRefund = ({ order, item, operation = "RETURN" }) => {
  // Scenario A: Cash on Delivery (COD) Check
  // Since no money leaves the customer's wallet/account on COD cancellations,
  // the refund amount must strictly be 0.
  if (order.paymentMethod === "COD" && operation === "CANCELLATION") {
    return 0;
  }
  // 1. Calculate true combined delivery costs from your database schema properties
  const deliveryCharge = (order.shippingCharge ?? 0) + (order.speedCharge ?? 0);

  // 2. Identify all items remaining AFTER this target item is processed
  const remainingItems = order.items.filter((i) => {
    const isThisItem = i._id.toString() === item._id.toString();
    const isAlreadyInactive = ["CANCELLED", "RETURN_COMPLETED"].includes(
      i.itemStatus,
    );
    return !isThisItem && !isAlreadyInactive;
  });

  // 3. Aggregate all previously completed refunds to prevent duplication loops
  const alreadyRefunded = order.items
    .filter((i) => i._id.toString() !== item._id.toString())
    .reduce((sum, i) => sum + (i.refundAmount || 0), 0);

  // 4. Edge Case Guard: If NO active items remain at all (Final active item processing)
  if (remainingItems.length === 0) {
    if (operation === "CANCELLATION") {
      // Full Order Cancellation -> Return all remaining invoice funds (includes delivery charge safely)
      return Math.max(
        0,
        Number((order.totalAmount - alreadyRefunded).toFixed(2)),
      );
    } else {
      // Full Order Return -> Retain delivery charge for the business ledger; give back remaining item balance
      const finalRefund = order.totalAmount - deliveryCharge - alreadyRefunded;
      return Math.max(0, Number(finalRefund.toFixed(2)));
    }
  }

  // 5. Compute net remaining order subtotal (After product offers, before coupon)
  const remainingSubtotal = remainingItems.reduce((sum, i) => {
    return sum + (i.salePrice ?? i.price) * i.quantity;
  }, 0);

  // 6. Dynamic Coupon Threshold Check & Proportional Scaling
  let remainingCouponDiscount = 0;
  if (order.coupon && order.coupon.discountAmount > 0) {
    const minOrderRequirement = order.coupon.minOrderAmount || 0;

    // Coupon validation is based on the remaining order subtotal after product offers
    const remainingBaseSubtotal = remainingItems.reduce((sum, i) => {
      return sum + (i.salePrice ?? i.price) * i.quantity;
    }, 0);

    if (remainingBaseSubtotal >= minOrderRequirement) {
      // Coupon remains valid: Compute its exact proportional share for what is left active
      const originalSubtotal =
        (order.subtotal ?? 0) - (order.discount ?? 0) || 1;
      remainingCouponDiscount = Number(
        (
          (remainingBaseSubtotal / originalSubtotal) *
          order.coupon.discountAmount
        ).toFixed(2),
      );
    } else {
      // Subtotal dropped below threshold! Coupon is completely revoked (0)
      remainingCouponDiscount = 0;
    }
  }

  // 7. Target Payable: What the customer should pay for keeping the remaining items
  const newOrderPayable =
    remainingSubtotal - remainingCouponDiscount + deliveryCharge;

  // 8. Inversion Math: Total Paid - What they should pay now - What we already gave back
  let refund = order.totalAmount - newOrderPayable - alreadyRefunded;

  // 9. Safety fallback logic for structural sequential item cancellations
  const allItemsInactive = order.items.every((i) => {
    return (
      i._id.toString() === item._id.toString() ||
      ["CANCELLED", "RETURN_COMPLETED"].includes(i.itemStatus)
    );
  });

  if (
    operation === "CANCELLATION" &&
    allItemsInactive &&
    remainingItems.length > 0
  ) {
    refund += deliveryCharge;
  }

  return Math.max(0, Number(refund.toFixed(2)));
};
