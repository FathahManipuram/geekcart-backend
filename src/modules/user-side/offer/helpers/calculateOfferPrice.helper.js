export const calculateOfferPrice = ({ price, offer }) => {
  let discount;

  if (offer.discountType === "PERCENTAGE") {
    discount = (price * offer.discountValue) / 100;

    if (offer.maxDiscountAmount) {
      discount = Math.min(discount, offer.maxDiscountAmount);
    }
  } else {
    discount = offer.discountValue;
  }

  discount = Math.min(discount, price);

  return {
    discount,
    salePrice: price - discount,
  };
};
