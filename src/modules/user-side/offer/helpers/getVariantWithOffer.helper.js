import { Product } from "../../../admin-side/product-management/models/product.model.js";
import { applyOfferToProduct } from "./applyOfferToProduct.helper.js";
import { getActiveOffers } from "./getActiveOffers.helper.js";

export const getVariantWithOffer = async (variant) => {
  const offers = await getActiveOffers();

  const product = await Product.findById(variant.product._id)
    .populate("category")
    .populate("subcategory")
    .lean();

  const productWithOffer = applyOfferToProduct({
    product: {
      ...product,
      variants: [variant.toObject()],
    },
    offers,
  });

  return productWithOffer.variants[0];
};
