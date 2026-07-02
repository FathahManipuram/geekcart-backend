
export const calculateCartSummary = (items = [], speedCharge = 0) => {
  let subtotal = 0;
  let discount = 0;

  items.forEach((item) => {
    const originalPrice = item.price * item.quantity;
    const salePrice = (item.salePrice ?? item.price) * item.quantity;

    subtotal += originalPrice;
    discount += originalPrice - salePrice;
  });

  const netSubtotal = subtotal - discount;

  const shippingCharge = netSubtotal >= 1500 || items.length === 0 ? 0 : 40;

  const deliveryCharge = shippingCharge + speedCharge;

  return {
    subtotal,
    discount,
    shippingCharge,
    speedCharge,
    deliveryCharge,
    total: netSubtotal + deliveryCharge,
  };
};