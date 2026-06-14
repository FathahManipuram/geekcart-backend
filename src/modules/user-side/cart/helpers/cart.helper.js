export const calculateCartSummary = (items = [], speedCharge =0) => {
  let subtotal = 0;
  let discount = 0;

  items.forEach((item) => {
    const OriginalPrice = item.price * item.quantity;
    const finalPrice = (item.salePrice || item.price) * item.quantity;

    subtotal += OriginalPrice;
    discount += OriginalPrice - finalPrice;
  });

  const shippingCharge =
    subtotal - discount > 1500 || items.length === 0 ? 0 : 40;

    const totalDeliveryCharge= shippingCharge + speedCharge


  const total = subtotal - discount + totalDeliveryCharge;

  return {
    subtotal,
    discount,
    shippingCharge,
    deliveryCharge: totalDeliveryCharge,
    total,
  };
};