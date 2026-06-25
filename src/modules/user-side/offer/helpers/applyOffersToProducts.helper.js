import { applyOfferToProduct } from "./applyOfferToProduct.helper.js";

export const applyOffersToProducts = ({ products, offers }) => {
  return products.map((product) => {
    const productWithOffer = applyOfferToProduct({
      product,
      offers,
    });

    return {
      ...productWithOffer,
      lowestPrice: Math.min(
        ...productWithOffer.variants.map((v) => v.salePrice),
      ),
    };
  });
};
