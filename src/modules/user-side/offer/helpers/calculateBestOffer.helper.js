import { calculateOfferPrice } from "./calculateOfferPrice.helper.js";

export const calculateBestOffer = ({ product, offers, price }) => {
  const matchedOffers = offers.filter((offer) => {
    switch (offer.offerType) {
      case "Product":
        return offer.targetId.equals(product._id);

      case "Category":
        return offer.targetId.equals(product.category?._id || product.category);

      case "Subcategory":
        return offer.targetId.equals(
          product.subcategory?._id || product.subcategory,
        );

      default:
        return false;
    }
  });

  let bestOffer = null;
  let highestDiscount = 0;
  let salePrice = price;

  for (const offer of matchedOffers) {
    const result = calculateOfferPrice({
      price,
      offer,
    });

    if (result.discount > highestDiscount) {
      highestDiscount = result.discount;
      salePrice = result.salePrice;
      bestOffer = offer;
    }
  }

  return {
    salePrice,
    discount: highestDiscount,
    appliedOffer: bestOffer,
  };
};
