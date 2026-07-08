import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { Variant } from "../../../admin-side/product-management/models/variant.model.js";
import { Cart } from "../../cart/models/cart.model.js";
import { calculateBestOffer } from "../../offer/helpers/calculateBestOffer.helper.js";
import { getActiveOffers } from "../../offer/helpers/getActiveOffers.helper.js";
import { Wishlist } from "../models/wishlist.model.js";

export const addToWishlistService = async (userId, productId, variantId) => {
  const variant= await Variant.findById(variantId).populate("product", "name isActive isDeleted")
  if(!variant){
    throw new AppError("Variant is no existed", HTTP_STATUS.BAD_REQUEST)
  }

  if(!variant.product.isActive || variant.product.isDeleted ){
    throw new AppError("Product is disabled", HTTP_STATUS.BAD_REQUEST)
  }


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
  const [wishlist, cart] = await Promise.all([
    Wishlist.findOne({ userId })
      .populate({
        path: "products.productId",
        select: "name slug category subcategory isActive",
      })
      .populate({
        path: "products.variantId",
        select: "color size price images stock isActive",
      }),

    Cart.findOne({ userId }),
  ]);


  if (!wishlist || !wishlist.products || wishlist.products.length === 0) {
    return {
      message: "Wishlist fetched successfully",
      data: [],
    };
  }


  let wishlistProducts = wishlist.products;

  if (cart && cart.items && cart.items.length > 0) {

    const cartVariantIds = new Set(
      cart.items.map((item) => item.variantId.toString()),
    );

    const itemsToRemove = [];
    wishlistProducts = wishlist.products.filter((item) => {
      if (!item.variantId) return false;


      const isInCart = cartVariantIds.has(item.variantId._id.toString());
      if (isInCart) {
        itemsToRemove.push(item.variantId._id);
      }
      return !isInCart;
    });


    if (itemsToRemove.length > 0) {
      Wishlist.updateOne(
        { userId },
        { $pull: { products: { variantId: { $in: itemsToRemove } } } },
      ).catch((err) =>
        console.error("Background wishlist sync cleanup failed:", err),
      );
    }
  }


    const offers = await getActiveOffers();


const formattedProducts = wishlistProducts.map((item) => {

  if (!item.productId || !item.variantId) return item;

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

  return {
    message: "Wishlist fetched successfully",
    data: {
      ...wishlist.toObject(),
      products: formattedProducts,
    },
  };
};



//Remove wishlist
export const removeWishlistService = async (userId, variantId, isAutoClean= false) => {
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
if (!isAutoClean && result.matchedCount > 0 && result.modifiedCount === 0) {
  throw new Error("Item not found in your wishlist");
}
  return {
    message: "Product removed from wishlist",
  };
};