
export const calculateItemRefund = ({ order, item, operation = "RETURN" }) => {

  if (order.paymentMethod === "COD" && operation === "CANCELLATION") {
    return 0;
  }

  const deliveryCharge = (order.shippingCharge ?? 0) + (order.speedCharge ?? 0);

  const remainingItems = order.items.filter((i) => {
    const isThisItem = i._id.toString() === item._id.toString();
    const isAlreadyInactive = ["CANCELLED", "RETURN_COMPLETED"].includes(
      i.itemStatus,
    );
    return !isThisItem && !isAlreadyInactive;
  });


  const alreadyRefunded = order.items
    .filter((i) => i._id.toString() !== item._id.toString())
    .reduce((sum, i) => sum + (i.refundAmount || 0), 0);


  if (remainingItems.length === 0) {
    if (operation === "CANCELLATION") {
     
      return Math.max(
        0,
        Number((order.totalAmount - alreadyRefunded).toFixed(2)),
      );
    } else {
     
      const finalRefund = order.totalAmount - deliveryCharge - alreadyRefunded;
      return Math.max(0, Number(finalRefund.toFixed(2)));
    }
  }


  const remainingSubtotal = remainingItems.reduce((sum, i) => {
    return sum + (i.salePrice ?? i.price) * i.quantity;
  }, 0);


  let remainingCouponDiscount = 0;
  if (order.coupon && order.coupon.discountAmount > 0) {
    const minOrderRequirement = order.coupon.minOrderAmount || 0;


    const remainingBaseSubtotal = remainingItems.reduce((sum, i) => {
      return sum + (i.salePrice ?? i.price) * i.quantity;
    }, 0);

    if (remainingBaseSubtotal >= minOrderRequirement) {
      
      const originalSubtotal =
        (order.subtotal ?? 0) - (order.discount ?? 0) || 1;
      remainingCouponDiscount = Number(
        (
          (remainingBaseSubtotal / originalSubtotal) *
          order.coupon.discountAmount
        ).toFixed(2),
      );
    } else {

      remainingCouponDiscount = 0;
    }
  }


  const newOrderPayable =
    remainingSubtotal - remainingCouponDiscount + deliveryCharge;


  let refund = order.totalAmount - newOrderPayable - alreadyRefunded;


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
