// import { Cart } from "../models/cart.model.js";

import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { Variant } from "../../../admin-side/product-management/models/variant.model.js";
import { calculateCartSummary } from "../helpers/cart.helper.js";
import { Cart } from "../models/cart.model.js";


// Add to cart
export const addToCartService = async (userId, variantId, quantity) => {

  if (quantity < 1) {
    throw new AppError("Quantity must be at least 1", HTTP_STATUS.BAD_REQUEST);
  }

  if (quantity > 5) {
    throw new AppError("You can add a maximum of 5 units per item.", HTTP_STATUS.BAD_REQUEST);
  }

const [variant, cart] = await Promise.all([
    Variant.findOne({
      _id: variantId,
      isDeleted: false,
      isActive: true,
    }).populate("product", "name"),
    
    Cart.findOne({ userId })
  ]);

if(!variant){
  throw new AppError("Variant not found Or variant disabled", HTTP_STATUS.NOT_FOUND)
}

if(variant.stock < quantity){
  throw new AppError(`Insufficient stock. Only ${variant.stock} units available.`, HTTP_STATUS.BAD_REQUEST);
}


let activeCart= cart

if(!activeCart){
  activeCart = await Cart.create({
      userId,
      items: [],
    });
}


const existingItemIndex = activeCart.items.findIndex(
    (item) => item.variantId.toString() === variantId.toString()
  );

// const isNewItem= existingItemIndex === -1

if(existingItemIndex < 0 && activeCart.items.length >=10){
  throw new AppError(
    "Your cart cannot contain more than 10 unique products.",
    HTTP_STATUS.BAD_REQUEST,
  );
}

if (existingItemIndex > -1) {
    const existingItem = activeCart.items[existingItemIndex];
    const newQuantity = existingItem.quantity + quantity;

    if (newQuantity > 5) {
      throw new AppError(
        "You can add a maximum of 5 units per item.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    if (newQuantity > variant.stock) {
      throw new AppError(
        `Cannot add more items. Total quantity would exceed available stock (${variant.stock}).`,
        HTTP_STATUS.BAD_REQUEST
      );
    }


activeCart.items[existingItemIndex].quantity = newQuantity;

}else{
  activeCart.items.push({
      productId: variant.product._id,
      variantId: variant._id,
      name: variant.product.name,
      image: variant.images?.[0] || "",
      color: variant.color,
      size: variant.size,
      price: variant.price,
      salePrice: variant.salePrice,
      quantity,
      stock: variant.stock,
    });
}

activeCart.summary = calculateCartSummary(activeCart.items)

await activeCart.save();

  return {
    message: "Added to cart successfully",
    data: activeCart,
  };

};



//Get cart
export const getCartService=async(userId)=>{
  const cart = await Cart.findOne({ userId })
    .populate({
      path: "items.productId",
      select: "name isActive isDeleted slug",
    })
    .populate({
      path: "items.variantId",
      select: "stock isActive isDeleted",
    });

  if(!cart){
    return {
      message: "Cart fetched successfully",
      data: {
        items: [],

        summary: {
          subtotal: 0,

          discount: 0,

          shippingCharge: 0,

          total: 0,
        },
      },
    };
  }

  return {
    message: "Cart fetched successfully",
    data: cart,
  };

}

//Upadte cart quantity
export const updateCartQuantityService= async({
  userId, variantId, quantity
})=>{

  console.log("servi", userId, variantId, quantity)
  if(quantity < 1){
    throw new AppError("Quantity must be at least 1", HTTP_STATUS.BAD_REQUEST);
  }

  if (quantity > 5) {
    throw new AppError("Maximum quantity is 5", HTTP_STATUS.BAD_REQUEST);
  }


const [cart, variant] = await Promise.all([
  Cart.findOne({userId}),
  Variant.findOne({_id: variantId, isDeleted: false, isActive: true})

])
   
  if (!cart) {
    throw new AppError("Cart not found", HTTP_STATUS.NOT_FOUND);
  }

   if (!variant) {
     throw new AppError("Variant not found", HTTP_STATUS.NOT_FOUND);
   }

   const item = cart.items.find(
     (item) => item.variantId.toString() === variantId.toString(),
   );

 if (!item) {
   throw new AppError("Cart item not found", HTTP_STATUS.NOT_FOUND);
 }


if(quantity > variant.stock){
  throw new AppError(
    `Insufficient stock. Only ${variant.stock} units left.`,
    HTTP_STATUS.BAD_REQUEST,
  );
}

item.quantity = quantity
item.stock = variant.stock
item.price= variant.price;
item.salePrice= variant.salePrice

cart.summary= calculateCartSummary(cart.items)

await cart.save()

return {
  message: "Cart quantity updated successfully",
  data: cart,
};

}


// Remove from cart
export const removeCartItemService= async({userId, variantId})=>{
  const cart= await Cart.findOne({userId})

  if(!cart){
     throw new AppError("Cart not found", HTTP_STATUS.NOT_FOUND);
  }

  cart.items= cart.items.filter((item)=>
  item.variantId.toString() !==variantId
  )

  cart.summary= calculateCartSummary(cart.items)

  await cart.save()

  return {
    message: "Item removed from cart",
    data: cart
  };
}


//clear cart
export const clearCartService= async(userId)=>{
  const cart = await Cart.findOne({
    userId,
  })

 if (!cart) {
   throw new AppError("Cart not found", HTTP_STATUS.NOT_FOUND);
 }

cart.items = [];

 cart.summary = {
   subtotal: 0,

   discount: 0,

   shippingCharge: 0,

   total: 0,
 };

  await cart.save();

  return {
    message: "Cart cleared successfully",

    data: cart,
  };

}

