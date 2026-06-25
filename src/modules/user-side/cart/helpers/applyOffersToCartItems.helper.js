import { calculateBestOffer } from "../../offer/helpers/calculateBestOffer.helper.js";

export const applyOffersToCartItems = ({ items, offers }) => {
  return items.map((item) => {
    const cartItem = item.toObject ? item.toObject() : item;

    const offer = calculateBestOffer({
      product: cartItem.productId,
      offers,
      price: cartItem.price,
    });

    return {
      ...cartItem,
      salePrice: offer.salePrice,
      discountAmount: offer.discount,
      appliedOffer: offer.appliedOffer,
    };
  });
};
