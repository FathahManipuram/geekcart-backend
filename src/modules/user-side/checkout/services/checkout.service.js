import { CHECKOUT_ISSUES } from "../../../../common/constants/checkout/checkoutIssues.js";
import { PAYMENT_ISSUES } from "../../../../common/constants/checkout/paymentIssues.js";
import { SHIPPING_ISSUES } from "../../../../common/constants/checkout/shippingIssues.js";
import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { Coupon } from "../../../admin-side/coupon-management/models/coupon.model.js";
import { Product } from "../../../admin-side/product-management/models/product.model.js";
import { Variant } from "../../../admin-side/product-management/models/variant.model.js";
import { Address } from "../../address/models/address.model.js";
import { Cart } from "../../cart/models/cart.model.js";
import { validateCoupon } from "../../coupon/helper/validateCoupon.helper.js";
import { applyCouponService } from "../../coupon/services/userCoupon.service.js";
import { getVariantWithOffer } from "../../offer/helpers/getVariantWithOffer.helper.js";
import { calculateCheckoutSummary } from "../../order/helpers/calculateCheckoutSummary.js";
import { validateCartItems } from "../../order/helpers/validateCartItems.helper.js";
import { Wallet } from "../../wallet/models/wallet.model.js";

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

    const productIds = cart.items.map((item) => item.productId);
    const variantIds = cart.items.map((item) => item.variantId);

   const [products, variants] = await Promise.all([
     Product.find({
       _id: { $in: productIds },
       isDeleted: false,
     }),

     Variant.find({
       _id: { $in: variantIds },
       isDeleted: false,
     }),
   ]);


     const productMap = new Map(
       products.map((product) => [product._id.toString(), product]),
     )

      const variantMap = new Map(
        variants.map((variant) => [variant._id.toString(), variant]),
      );

  for (const item of cart.items) {
    const product = productMap.get(item.productId.toString());

    if (!product) {
      issues.push({
        type: CHECKOUT_ISSUES.PRODUCT_NOT_FOUND.code,
        message: CHECKOUT_ISSUES.PRODUCT_NOT_FOUND.message,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.name,
        image: item.image,
        color: item.color,
        size: item.size,
      });

      continue;
    }

    if (!product.isActive) {
      issues.push({
        type: CHECKOUT_ISSUES.PRODUCT_UNLISTED.code,
        message: CHECKOUT_ISSUES.PRODUCT_UNLISTED.message,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.name,
        size: item.size,
        color: item.color,
        image: item.image,
      });

      continue;
    }

    const variant = variantMap.get(item.variantId.toString());

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


    if (variant.product.toString() !== item.productId.toString()) {
      issues.push({
        type: CHECKOUT_ISSUES.VARIANT_NOT_FOUND.code,
        message: CHECKOUT_ISSUES.VARIANT_NOT_FOUND.message,
        productId: item.productId,
        variantId: item.variantId,
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



//Validate payment
export const validatePaymentService = async ({
  userId,
  paymentMethod,
  deliveryMethod,
  couponId,
}) => {

  const issues = [];

  if (!paymentMethod) {
    issues.push({
      code: PAYMENT_ISSUES.INVALID_PAYMENT_METHOD.code,
      message: PAYMENT_ISSUES.INVALID_PAYMENT_METHOD.message,
    })
    
  }

const [cart, wallet] = await Promise.all([
  Cart.findOne({ userId }),
  paymentMethod === "WALLET"
    ? Wallet.findOne({ user: userId })
    : Promise.resolve(null),
]);

   if (!cart || !cart.items.length) {
     throw new AppError("Cart is empty", HTTP_STATUS.BAD_REQUEST);
   }

// let coupon = null;
// if (couponId) {
//   coupon = await Coupon.findById(couponId);

//   await validateCoupon({
//     userId,
//     coupon,
//     subtotal: cart.summary.subtotal,
//   });
// }


  const { finalTotal, subtotal } = await calculateCheckoutSummary({
    userId,
    cart,
    deliveryMethod,
    couponId,
  });


  if (couponId) {
    const coupon = await Coupon.findById(couponId);

    try {
      await validateCoupon({
        userId,
        coupon,
        subtotal: subtotal,
      });
    } catch (couponError) {
      issues.push({
        code: "INVALID_COUPON",
        message:
          couponError.message || "Coupon requirements are no longer met.",
      });
    }
  }

  //Wallet validation
  if (paymentMethod === "WALLET") {

    if (!wallet) {
      issues.push({
        code: PAYMENT_ISSUES.WALLET_NOT_FOUND.code,
        message: PAYMENT_ISSUES.WALLET_NOT_FOUND.message,
      });
    } else {
      if (!wallet.isActive) {
        issues.push({
          code: PAYMENT_ISSUES.WALLET_DISABLED.code,
          message: PAYMENT_ISSUES.WALLET_DISABLED.message,
        });
      }

      if (wallet.balance < finalTotal) {
        issues.push({
          code: PAYMENT_ISSUES.INSUFFICIENT_WALLET_BALANCE.code,
          message: PAYMENT_ISSUES.INSUFFICIENT_WALLET_BALANCE.message,
          availableBalance: wallet.balance,
          requiredAmount: finalTotal,
        });
      }
    }
  }

  // COD VALIDATION
  if (paymentMethod === "COD" && finalTotal > 2000) {
    issues.push({
      code: PAYMENT_ISSUES.COD_LIMIT_EXCEEDED.code,
      message: PAYMENT_ISSUES.COD_LIMIT_EXCEEDED.message,
    });
  }

  return {
    message:
      issues.length > 0
        ? "Payment validation failed"
        : "Payment validation successful",
    data: {
      valid: issues.length === 0,

      issues,
    },
  };
};


// final validation
export const validateFinalCheckoutService = async ({
  userId,
  addressId,
  deliveryMethod,
  paymentMethod,
  couponId,
}) => {
  const cart = await Cart.findOne({ userId });

  if (!cart || !cart.items.length) {
    throw new AppError("Cart is empty", HTTP_STATUS.BAD_REQUEST);
  }


  const cartValidation = await validateCartItems(cart.items);

//cart validation
  if (!cartValidation.valid) {
    throw new AppError(
      "Checkout validation failed",
      HTTP_STATUS.BAD_REQUEST,
      cartValidation.issues,
    )
  }

  // Shipping Validation
  const shippingValidation = await validateShippingService({
    userId,
    addressId,
    deliveryMethod
  });

  if (!shippingValidation.data.valid) {
    throw new AppError(
      "Shipping validation failed",
      HTTP_STATUS.BAD_REQUEST,
      shippingValidation.data.issues,
    );
  }

  // Payment Validation
  const paymentValidation = await validatePaymentService({
    userId,
    paymentMethod,
    deliveryMethod,
    couponId,
  });

  if (!paymentValidation.data.valid) {
    throw new AppError(
      "Payment validation failed",
      HTTP_STATUS.BAD_REQUEST,
      paymentValidation.data.issues,
    );
  }

  // // Final recalculation
  // const summary = await calculateCheckoutSummary({
  //   userId,
  //   cart,
  //   deliveryMethod,
  //   couponId,
  // });

  return {
    message: "Checkout validated successfully",

    data: {
      valid: true,

     // summary,
    },
  };
};
