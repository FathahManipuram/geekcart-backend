// import { ITEM_STATUSES } from "../../../../common/constants/order/orderStatus.js";
// import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
// import { AppError } from "../../../../common/utils/AppError.js";
// import { ReturnRequest } from "../../../admin-side/return-management/models/return.model.js";
// import { Order } from "../../order/models/order.model.js";

// export const requestReturnOrderService = async ({
//   userId,
//   orderId,
//   items,
//   reason,
// }) => {
//   const order = await Order.findOne({
//     _id: orderId,
//     user: userId,
//   });

//   if (!order) {
//     throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
//   }

//   for (const itemId of items) {
//     const item = order.items.id(itemId);
// console.log("item :", item)
//     if (!item) continue;

// console.log("Current Item Status:", item.itemStatus);
//     if (item.itemStatus !== ITEM_STATUSES.DELIVERED) {
//       throw new AppError(
//         "Only delivered items can be returned",
//         HTTP_STATUS.BAD_REQUEST,
//       );
//     }

//     item.itemStatus = ITEM_STATUSES.RETURN_PENDING;

//     item.itemStatusHistory.push({
//       status: ITEM_STATUSES.RETURN_PENDING,
//       updatedBy: "USER",
//     });

//     const returnRequest= await ReturnRequest.create({
//       order: order._id,
//       orderItemId: item._id,
//       user: userId,

//       itemSnapshot: {
//         productId: item.product,
//         variantId: item.variantId,
//         name: item.name,
//         image: item.image,
//         size: item.size,
//         color: item.color,
//         priceAtPurchase: item.salePrice ?? item.price,
//       },
//       reason,
//       status: "RETURN_PENDING",

//       statusHistory: [
//         {
//           status: "RETURN_PENDING",
//           updatedBy: "USER",
//         },
//       ],
//     });

//     item.returnRequestId = returnRequest._id;
//   }

//   await order.save();

//   return {
//     message: "Return request submitted successfully",
//   };
// };

import { ITEM_STATUSES } from "../../../../common/constants/order/orderStatus.js";
import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { ReturnRequest } from "../../../admin-side/return-management/models/return.model.js";
import { Order } from "../../order/models/order.model.js";

export const requestReturnOrderService = async ({
  userId,
  orderId,
  items,
  reason,
}) => {
  // 1. Populate the coupon relationship
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
  }).populate("coupon.couponId", "minOrderAmount");

  if (!order) {
    throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
  }

  // =========================================================================
  // 👇 FIXED GUARD CLAUSE: HANDLE TOTAL VS PARTIAL RETURNS WITH COUPONS
  // =========================================================================
  if (order.coupon) {
    const minOrderRequirement = order.coupon.couponId?.minOrderAmount || 0;

    // A. Find items that are currently active in the database before this request
    const currentlyActiveItems = order.items.filter(
      (i) =>
        !["CANCELLED", "RETURN_PENDING", "RETURN_COMPLETED"].includes(
          i.itemStatus,
        ),
    );

    // B. Calculate items remaining strictly *AFTER* this return is processed
    const remainingItems = currentlyActiveItems.filter(
      (i) => !items.includes(i._id.toString()),
    );

    // ✅ CONDITION: Only enforce minOrderAmount if they are keeping some items!
    // If remainingItems.length === 0, they are returning everything left.
    if (remainingItems.length > 0) {
      const remainingSubtotal = remainingItems.reduce(
        (sum, i) => sum + (i.salePrice ?? i.price) * i.quantity,
        0,
      );

      // Block the partial return if the items they KEEEP don't meet the promo threshold
      if (remainingSubtotal < minOrderRequirement) {
        throw new AppError(
          `Return request denied. Returning these items will drop your remaining order total below the ₹${minOrderRequirement} minimum purchase requirement for coupon (${order.coupon.code}). Product returns are restricted under these promotion terms.`,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
    }
  }

  // ==========================================
  // STEP 2: MUTATE LOCAL & CREATE RETURN DOCUMENT
  // ==========================================
  for (const itemId of items) {
    const item = order.items.id(itemId);
    if (!item) continue;

    if (item.itemStatus !== ITEM_STATUSES.DELIVERED) {
      throw new AppError(
        `Only delivered items can be returned. Item ${item.name} is currently: ${item.itemStatus}`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    item.itemStatus = ITEM_STATUSES.RETURN_PENDING;
    item.itemStatusHistory.push({
      status: ITEM_STATUSES.RETURN_PENDING,
      updatedBy: "USER",
    });

    const returnRequest = await ReturnRequest.create({
      order: order._id,
      orderItemId: item._id,
      user: userId,
      itemSnapshot: {
        productId: item.product,
        variantId: item.variantId,
        name: item.name,
        image: item.image,
        size: item.size,
        color: item.color,
        priceAtPurchase: item.salePrice ?? item.price,
      },
      reason,
      status: "RETURN_PENDING",
      statusHistory: [
        {
          status: "RETURN_PENDING",
          updatedBy: "USER",
        },
      ],
    });

    item.returnRequestId = returnRequest._id;
  }

  await order.save();

  return {
    message: "Return request submitted successfully",
  };
};