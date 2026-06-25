import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { calculateBestOffer } from "../../offer/helpers/calculateBestOffer.helper.js";
import { getActiveOffers } from "../../offer/helpers/getActiveOffers.helper.js";
import { Wishlist } from "../models/wishlist.model.js";

export const addToWishlistService = async (userId, productId, variantId) => {
  const result = await Wishlist.updateOne(
    { userId },
    {
      $addToSet: {
        products: { productId, variantId },
      },
    },
    { upsert: true },
  );
  console.log("result ", result);

  if (result.matchedCount > 0 && result.modifiedCount === 0) {
    throw new AppError(
      "Product already exists in wishlist",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return {
    message: "Product added to wishlist",
  };
};

// Get wishlist
export const getWishlistService = async (userId) => {
  const wishlist = await Wishlist.findOne({ userId })
    .populate({
      path: "products.productId",
      select: "name slug category subcategory isActive",
    })
    .populate({
      path: "products.variantId",
      select: "color size price images stock isActive",
    });

    const offers = await getActiveOffers();


const formattedProducts = wishlist.products.map((item) => {
  const offer = calculateBestOffer({
    product: {
      _id: item.productId._id,
      category: item.productId.category,
      subcategory: item.productId.subcategory,
    },
    offers,
    price: item.variantId.price,
  });

  return {
    ...item.toObject(),

    variantId: {
      ...item.variantId.toObject(),
      salePrice: offer.salePrice,
      discountAmount: offer.discount,
      appliedOffer: offer.appliedOffer,
    },
  };
});

wishlist.products = formattedProducts;
  return {
    message: "Wishlist fetched successfully",
    data: wishlist || { products: [] },
  };
};

//Remove wishlist
export const removeWishlistService = async (userId, variantId) => {
  const result= await Wishlist.updateOne(
    { userId },
    {
      $pull: {
        products: {
          variantId,
        },
      },
    },
  );

console.log("result: ", result)
if (result.matchedCount > 0 && result.modifiedCount === 0) {
  throw new Error("Item not found in your wishlist");
}
  return {
    message: "Product removed from wishlist",
  };
};