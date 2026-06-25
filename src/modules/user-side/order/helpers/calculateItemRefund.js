export const calculateItemRefund = ({ order, item, operation = "RETURN" }) => {
  const itemTotal = (item.salePrice ?? item.price) * item.quantity;

  const discountedSubtotal = (order.subtotal ?? 0) - (order.discount ?? 0);

  const couponDiscount = order.coupon?.discountAmount ?? 0;

  const couponShare =
    discountedSubtotal > 0
      ? (itemTotal / discountedSubtotal) * couponDiscount
      : 0;

  let refund = itemTotal - couponShare;

  if (operation === "CANCELLATION") {
    const allCancelled = order.items.every(
      (i) => i._id.equals(item._id) || i.itemStatus === "CANCELLED",
    );

    if (allCancelled) {
      refund += (order.shippingCharge ?? 0) + (order.speedCharge ?? 0);
    }
  }

  return Number(refund.toFixed(2));
};
