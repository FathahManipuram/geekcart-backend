// import { Cart } from "../models/cart.model.js";

import { HTTP_STATUS } from "../../../../common/constants/statusCode";
import { Cart } from "../models/cart.model";

// import { Product } from "../../product-management/models/product.model.js";

// import { Variant } from "../../product-management/models/variant.model.js";

// import { AppError } from "../../../../common/utils/AppError.js";

// import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";

// /**
//  * Add To Cart
//  */
// export const addToCartService =
//   async (
//     userId,
//     data
//   ) => {
//     const {
//       productId,

//       variantId,

//       quantity,
//     } = data;

//     /**
//      * Check Product
//      */
//     const existingProduct =
//       await Product.findOne({
//         _id: productId,

//         isDeleted: false,
//       });

//     if (
//       !existingProduct
//     ) {
//       throw new AppError(
//         "Product not found",

//         HTTP_STATUS.NOT_FOUND
//       );
//     }

//     /**
//      * Check Variant
//      */
//     const existingVariant =
//       await Variant.findById(
//         variantId
//       );

//     if (
//       !existingVariant
//     ) {
//       throw new AppError(
//         "Variant not found",

//         HTTP_STATUS.NOT_FOUND
//       );
//     }

//     /**
//      * Find Cart
//      */
//     let cart =
//       await Cart.findOne({
//         userId,
//       });

//     /**
//      * Create Cart
//      */
//     if (!cart) {
//       cart =
//         await Cart.create({
//           userId,

//           items: [],

//           summary: {
//             subtotal: 0,

//             discount: 0,

//             total: 0,
//           },
//         });
//     }

//     /**
//      * Existing Item
//      */
//     const existingCartItem =
//       cart.items.find(
//         (item) =>
//           item.variantId.toString() ===
//           variantId
//       );

//     /**
//      * Increase Quantity
//      */
//     if (
//       existingCartItem
//     ) {
//       existingCartItem.quantity +=
//         quantity;
//     } else {
//       /**
//        * Add New Item
//        */
//       cart.items.push({
//         productId,

//         variantId,

//         quantity,

//         priceSnapshot:
//           existingVariant.price,
//       });
//     }

//     /**
//      * Recalculate Summary
//      */
//     const subtotal =
//       cart.items.reduce(
//         (
//           total,
//           item
//         ) =>
//           total +
//           item.priceSnapshot *
//             item.quantity,

//         0
//       );

//     cart.summary.subtotal =
//       subtotal;

//     cart.summary.discount =
//       0;

//     cart.summary.total =
//       subtotal;

//     /**
//      * Save Cart
//      */
//     await cart.save();

//     return {
//       message:
//         "Item added to cart",

//       data: cart,
//     };
//   };

// Add to cart
export const addToCartService = async (userId, data) => {
  const { productId, variantId, quantity } = data;

  const [existingProduct, existingVariant, cart] = await Promise.all([
    Product.findOne({ _id: productId, isDeleted: false }),
    Variant.findById(variantId),
    Cart.findOne({ userId }),
  ]);

  if (!existingProduct) {
    throw new AppError(
      "Product not found or unavailable",
      HTTP_STATUS.NOT_FOUND,
    );
  }

  if (!existingVariant) {
    throw new AppError("Product variant not found", HTTP_STATUS.NOT_FOUND);
  }

  if (existingVariant.productId.toString() !== productId) {
    throw new AppError(
      "Invalid product and variant combination",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  let userCart = cart;
  if (!userCart) {
    userCart = new Cart({
      userId,
      items: [],
      summery: { subtotal: 0, discount: 0, total: 0 },
    });
  }

  const existingCartItem = userCart.items.find(
    (item) => item.variantId.toString() === variantId,
  );
  const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;
  const targetQuantity = currentCartQuantity + quantity;

  const isNewItem = !existingCartItem;

  if (isNewItem && userCart.items.length >= 15) {
    throw new AppError(
      "Cart limit reached. You can only have a maximum of 15 unique items in your cart.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (targetQuantity > 5) {
    throw new AppError(
      `Purchase limit exceeded. You can only add a maximum of 5 units per item variant. (You already have ${currentCartQuantity} in cart)`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (targetQuantity > existingVariant.stock) {
    throw new AppError(
      `Insufficient stock. Only ${existingVariant.stock} unit(s) available.`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (existingCartItem) {
    existingCartItem.quantity = targetQuantity;
  } else {
    userCart.items.push({
      productId,
      variantId,
      quantity,
      priceSnapshot: existingVariant.price,
    });
  }

  const subtotal = userCart.items.reduce((total, item) => {
    return total + item.priceSnapshot * item.quantity;
  }, 0);

  userCart.summary.subtotal = subtotal;
  userCart.summary.discount = 0;
  userCart.summary.total = Math.max(0, subtotal - userCart.summary.discount);

  await userCart.save();

  return {
    message: "Item added to cart successfully",
    data: userCart,
  };
};

// Get cart
export const getCartService=(userId)=>{
	const cart= await Cart.findOne({userId}).populate({
		path:"items.productId",
		select: "name slug coverImage isDeleted",
	})
	.populate({
		path: "items.variantId",
		select: "size color price stock isActive",
	})

	if(!cart){
		return {
			message: "Cart fetched successfully",
      data: {
        items: [],
        summary: { subtotal: 0, discount: 0, total: 0 },
		}
		}
	}
		const activeItem= cart.items.filter((item)=> 
		item.productId && 
		!item.productId.isDeleted &&
		item.variantId && 
      item.variantId.isActive
		)

		const subtotal = activeItems.reduce((total, item) => {
    return total + item.priceSnapshot * item.quantity;
  }, 0);

  if (activeItems.length !== cart.items.length || cart.summary.subtotal !== subtotal) {
    cart.items = activeItems;
    cart.summary.subtotal = subtotal;
    cart.summary.total = Math.max(0, subtotal - cart.summary.discount);
    await cart.save(); // Async background sync
  }

  return {
    message: "Cart fetched successfully",
    data: cart,
  };
	
}
