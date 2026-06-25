import { calculateBestOffer } from "./calculateBestOffer.helper.js";

export const applyOfferToProduct = ({ product, offers }) => {
  const productObj = product.toObject ? product.toObject() : product;

  const variants = productObj.variants.map((variant) => {
    const offer = calculateBestOffer({
      product: productObj,
      offers,
      price: variant.price,
    });

    return {
      ...variant,
      salePrice: offer.salePrice,
      discountAmount: offer.discount,
      appliedOffer: offer.appliedOffer,
    };
  });

  return {
    ...productObj,
    variants,
  };
};