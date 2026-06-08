import { CHECKOUT_ISSUES } from "../../../../common/constants/checkout/checkoutIssues.js";
import { PAYMENT_ISSUES } from "../../../../common/constants/checkout/paymentIssues.js";
import { SHIPPING_ISSUES } from "../../../../common/constants/checkout/shippingIssues.js";
import { Product } from "../../../admin-side/product-management/models/product.model.js";
import { Variant } from "../../../admin-side/product-management/models/variant.model.js";
import { Address } from "../../address/models/address.model.js";
import { Cart } from "../../cart/models/cart.model.js";

// Validate Before Checkout page
export const validateCheckoutService = async (userId) => {
  const cart = await Cart.findOne({ userId });
  const issues = [];

  if (!cart || cart.items.length === 0) {
    issues.push({
      type: CHECKOUT_ISSUES.EMPTY_CART.code,
      message: CHECKOUT_ISSUES.EMPTY_CART.message,
    });

    return {
      message: "Checkout validation failed",
      data: {
        valid: false,
        issues,
      },
    };
  }

  for (const item of cart.items) {
    const product = await Product.findOne({
      _id: item.productId,
      isDeleted: false,
    });

    if (!product) {
      issues.push({
        type: CHECKOUT_ISSUES.PRODUCT_NOT_FOUND.code,
        message: CHECKOUT_ISSUES.PRODUCT_NOT_FOUND.message,
        productId: item.productId,
        productName: item.name,
      });

      continue;
    }

    if (!product.isActive) {
      issues.push({
        type: CHECKOUT_ISSUES.PRODUCT_UNLISTED.code,
        message: CHECKOUT_ISSUES.PRODUCT_UNLISTED.message,
        productId: item.productId,
        productName: item.name,
      });

      continue;
    }

    const variant = await Variant.findOne({
      _id: item.variantId,
      isDeleted: false,
    });

    if (!variant) {
      issues.push({
        type: CHECKOUT_ISSUES.VARIANT_NOT_FOUND.code,
        message: CHECKOUT_ISSUES.VARIANT_NOT_FOUND.message,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.name,
        size: item.size,
        color: item.color,
        image: item.image,
      });

      continue;
    }

    if (!variant.isActive) {
      issues.push({
        type: CHECKOUT_ISSUES.VARIANT_NOT_FOUND.code,
        message: CHECKOUT_ISSUES.VARIANT_NOT_FOUND.message,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.name,
        size: item.size,
        color: item.color,
        image: item.image,
      });

      continue;
    }

    if (variant.stock === 0) {
      issues.push({
        type: CHECKOUT_ISSUES.OUT_OF_STOCK.code,
        message: CHECKOUT_ISSUES.OUT_OF_STOCK.message,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.name,
        size: item.size,
        color: item.color,
        image: item.image,
      });

      continue;
    }

    if (item.quantity > variant.stock) {
      issues.push({
        type: CHECKOUT_ISSUES.INSUFFICIENT_STOCK.code,
        message: CHECKOUT_ISSUES.INSUFFICIENT_STOCK.message,

        productId: item.productId,
        variantId: item.variantId,

        productName: item.name,
        size: item.size,
        color: item.color,
        image: item.image,

        availableStock: variant.stock,
        requestedQuantity: item.quantity,
      });
    }

    const currentPrice = variant.salePrice ?? variant.price;

    const cartPrice = item.salePrice ?? item.price;

    if (currentPrice !== cartPrice) {
      issues.push({
        type: CHECKOUT_ISSUES.PRICE_CHANGED.code,
        message: CHECKOUT_ISSUES.PRICE_CHANGED.message,

        productId: item.productId,
        variantId: item.variantId,

        productName: item.name,
        size: item.size,
        color: item.color,
        image: item.image,

        oldPrice: cartPrice,
        newPrice: currentPrice,
      });
    }
  }

  return {
    message:
      issues.length > 0
        ? "Checkout validation failed"
        : "Checkout validation successful",

    data: {
      valid: issues.length === 0,
      issues,
    },
  };
};




//Validate shipping
export const validateShippingService = async ({
  userId,
  addressId,
  deliveryMethod,
}) => {
  const issues = [];

  const address = await Address.findOne({
    _id: addressId,
    userId,
  });
console.log("deliveryMethod: ", deliveryMethod)
  if (!address) {
    issues.push({
      type: SHIPPING_ISSUES.ADDRESS_NOT_FOUND.code,
      message: SHIPPING_ISSUES.ADDRESS_NOT_FOUND.message,
    });
  }

  return {
    message:
      issues.length > 0
        ? "Shipping validation failed"
        : "Shipping validation successful",

    data: {
      valid: issues.length === 0,
      issues,
    },
  };
};




// Validate payment
export const validatePaymentService= async(paymentMethod)=>{
 const issues=[]

 if(!paymentMethod){
  issues.push({
    type: PAYMENT_ISSUES.INVALID_PAYMENT_METHOD.code,
    message: PAYMENT_ISSUES.INVALID_PAYMENT_METHOD.message
  })
 }

 return {
   mesaage:
     issues.length > 0
       ? "Payment validation failed"
       : "Payment validation successful",

       data: {
        valid : issues.length === 0,
        issues,
       }
 };

}