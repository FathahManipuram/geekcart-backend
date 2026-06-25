import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { Variant } from "../../../admin-side/product-management/models/variant.model.js";
import { Address } from "../../address/models/address.model.js";
import { Cart } from "../../cart/models/cart.model.js";
import { validateCartItems } from "../helpers/validateCartItems.helper.js";
import { Order } from "../models/order.model.js";
import { ITEM_STATUSES, ORDER_STATUSES } from "../../../../common/constants/order/orderStatus.js";
import { recalculateOrderStatus } from "../helpers/recalculateOrderStatus.js";
import { generateInvoicePdf } from "../../../../common/utils/pdf/invoicePdf.js";
import { creditWallet, debitWallet } from "../../wallet/services/wallet.service.js";
import { processReferralReward } from "../../referral/services/referral.service.js";
import { Coupon } from "../../../admin-side/coupon-management/models/coupon.model.js";
import { calculateCheckoutSummary } from "../helpers/calculateCheckoutSummary.js";
import { Wallet } from "../../wallet/models/wallet.model.js";
import { calculateCartSummary } from "../../cart/helpers/cart.helper.js";
import { calculateItemRefund } from "../helpers/calculateItemRefund.js";



// Create order
export const createOrderService = async ({
  userId,
  addressId,
  deliveryMethod,
  paymentMethod,
  paymentDetails,
  couponId,
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    
    if (paymentMethod === "RAZORPAY" && !paymentDetails?.razorpayPaymentId) {
      throw new AppError(
        "Payment details are required",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const address = await Address.findOne({ _id: addressId, userId }, null, {
      session,
    });

    if (!address) {
      throw new AppError("Address not found", HTTP_STATUS.NOT_FOUND);
    }


 const cart = await Cart.findOne({ userId }, null, { session }).populate({
   path: "items.productId",
   select: "name slug category subcategory isActive isDeleted",
 });

    if (!cart || !cart.items.length) {
      throw new AppError("Cart is empty", HTTP_STATUS.BAD_REQUEST);
    }


    const validationResult = await validateCartItems(cart.items);
    if (!validationResult.valid) {
      throw new AppError(
        "Checkout validation failed",
        HTTP_STATUS.BAD_REQUEST,
        validationResult.issues, 
      );
    }


    const {
      subtotal,
      discount,
      shippingCharge,
      deliveryCharge,
      speedCharge,
      couponSnapshot,
      finalTotal,
    recalculatedItems,
    } = await calculateCheckoutSummary({
      userId,
      cart,
      deliveryMethod,
      couponId,
      session,
    });


    if (paymentMethod === "WALLET") {
      const wallet = await Wallet.findOne(
        { user: userId, isActive: true },
        null,
        { session },
      );
      if (!wallet) {
        throw new AppError(
          "Wallet not found",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      if (wallet.balance < finalTotal) {
        throw new AppError(
          "Insufficient wallet balance",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
    }


    for (const item of cart.items) {
      const result = await Variant.updateOne(
        {
          _id: item.variantId,
          stock: { $gte: item.quantity },
        },
        {
          $inc: { stock: -item.quantity },
        },
        { session },
      );

      if (!result.modifiedCount) {
        throw new AppError(
          `${item.name} is out of stock`,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
    }
const orderItemsSnapshot = recalculatedItems.map((item) => ({
  product: item.productId._id || item.productId,
  variantId: item.variantId,
  name: item.name,
  image: item.image,
  size: item.size,
  color: item.color,
  quantity: item.quantity,
  price: item.price,
  salePrice: item.salePrice,
  appliedOffer: item.appliedOffer
    ? {
        offerId: item.appliedOffer._id,
        name: item.appliedOffer.name,
        offerType: item.appliedOffer.offerType,
        discountType: item.appliedOffer.discountType,
        discountValue: item.appliedOffer.discountValue,
        maxDiscountAmount: item.appliedOffer.maxDiscountAmount,
        discountAmount: item.discountAmount,
      }
    : null,
}));

    const [order] = await Order.create(
      [
        {
          user: userId,
          items: orderItemsSnapshot,
          shippingAddress: {
            fullName: address.fullName,
            phoneNumber: address.phoneNumber,
            addressLine: address.addressLine,
            landmark: address.landmark,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            country: address.country,
            addressLabel: address.addressLabel,
          },
          deliveryMethod,
          paymentMethod,
          paymentStatus: paymentMethod === "COD" ? "PENDING" : "PAID",
          paymentDetails:
            paymentMethod === "RAZORPAY"
              ? {
                  razorpayOrderId: paymentDetails?.razorpayOrderId,
                  razorpayPaymentId: paymentDetails?.razorpayPaymentId,
                  razorpaySignature: paymentDetails?.razorpaySignature,
                  paidAt: new Date(),
                }
              : null,
          subtotal,
          discount,
          speedCharge,
          shippingCharge,
          deliveryCharge,
          coupon: couponSnapshot,
          totalAmount: finalTotal,
        },
      ],
      { session },
    );


    if (paymentMethod === "WALLET") {
      const walletResult = await debitWallet({
        userId,
        amount: finalTotal,
        reason: "ORDER_PAYMENT",
        description: `Payment for order ${order.orderNumber}`,
        referenceId: order._id,
        session,
      });

      const walletTxId = walletResult?.transaction?._id || walletResult?._id;


      order.paymentDetails = {
        ...order.paymentDetails,
        walletTransactionId: walletTxId,
        paidAt: new Date(),
      };


      await order.save({ session });
    }

  
    if (couponSnapshot) {
      await Coupon.updateOne(
        { _id: couponSnapshot.couponId },
        { $inc: { usedCount: 1 } },
        { session },
      );
    }

    
    cart.items = [];
    cart.summary = { subtotal: 0, discount: 0, deliveryCharge: 0, total: 0 };
    await cart.save({ session });


    await session.commitTransaction();


    if (order.paymentStatus === "PAID") {
      processReferralReward(userId).catch((error) => {
        console.error("Referral reward background tracking failure:", error);
      });
    }

    return {
      message: "Order placed successfully",
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
      },
    };
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw err;
  } finally {
    session.endSession();
  }
};





// get order by id
export const getOrderByIdService = async ({ userId, orderId }) => {
	if(!orderId){
		throw new AppError("OrderId not found", HTTP_STATUS.BAD_REQUEST)
	}
	
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
  });

  if (!order) {
    throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
  }

  return {
    message: "Order fetched successfully",
    data: order,
  };
};



// Get all orders  || get History
export const getAllOrdersService = async ({userId, page=1, limit=10, search}) => {

const query={user: userId}

if(search && search.trim()){
  query.$or=[
    {
      orderNumber: {$regex: search, $options: "i"}
    },

    {
      "items.name":{$regex : search, $options: "i"}
    }
  ]
}

const skip= (page-1) * limit

  const orders = await Order.find(query)
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)

  const totalItems= await Order.countDocuments(query)

  return {
    message: "Orders fetched successfully",
    data: {
    orders,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems/limit),
      totalItems,
    }
    }
  };
};


//Cancel order item
export const cancelOrderitemService= async({
  userId, orderId, itemId,reason
})=>{

  console.log("1:", userId, orderId, reason)
  const order= await Order.findOne({_id: orderId, user: userId})
console.log(order)
  if(!order){
    throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
  }

  const item= order.items.id(itemId)

  if(!item){
    throw new AppError("Item not found", HTTP_STATUS.NOT_FOUND);
  }
const cancellableStatuses = [ITEM_STATUSES.PLACED, ITEM_STATUSES.PROCESSING];


item.itemStatus = ITEM_STATUSES.CANCELLED;

item.itemStatusHistory.push({
  status: ITEM_STATUSES.CANCELLED,
  updatedBy: "USER",
});

item.cancellation = {
  reason,
  cancelledAt: new Date(),
  cancelledBy: "USER",
};

const refundablePayments = ["RAZORPAY", "WALLET"];

if (
  refundablePayments.includes(order.paymentMethod) &&
  order.paymentStatus === "PAID"
) {
  const refundAmount = calculateItemRefund({
    order,
    item,
    operation: "CANCELLATION",
  });

  if (item.refundStatus === "COMPLETED") {
    throw new AppError("Refund already processed", HTTP_STATUS.BAD_REQUEST);
  }

  await creditWallet({
    userId: order.user,
    amount: refundAmount,
    reason: "ITEM_CANCELLED",
    description: `Refund for cancelled item ${item.name}`,
    referenceId: order._id,
  });

  item.refundAmount = refundAmount;
  item.refundStatus = "COMPLETED";
}

  const newOrderStatus= recalculateOrderStatus(order.items)

  if(newOrderStatus){
    order.orderStatus= newOrderStatus

    order.statusHistory.push({
      status: newOrderStatus,
      updatedBy: "USER"
    })
  }

  await order.save()

  await Variant.updateOne(
    { _id: item.variantId },
    {
      $inc: {
        stock: item.quantity,
      },
    },
  );

  return {
    message: "Item cancelled successfully",
  };
}


//Cancel All order
export const cancelAllOrderService = async ({ userId, orderId, reason }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid order id", HTTP_STATUS.BAD_REQUEST);
  }

  const order = await Order.findOne({
    _id: orderId,
    user: userId,
  });

  if (!order) {
    throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
  }

  const blockedStatuses = [
    ITEM_STATUSES.SHIPPED,
    ITEM_STATUSES.OUT_FOR_DELIVERY,
    ITEM_STATUSES.DELIVERED,
  ];

  const hasBlockedItems = order.items.some((item) =>
    blockedStatuses.includes(item.itemStatus),
  );

  if (hasBlockedItems) {
    throw new AppError(
      "Order can no longer be cancelled",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const cancellableStatuses = [ITEM_STATUSES.PLACED, ITEM_STATUSES.PROCESSING];

  let totalRefund = 0;

  for (const item of order.items) {
    if (!cancellableStatuses.includes(item.itemStatus)) {
      continue;
    }

    item.itemStatus = ITEM_STATUSES.CANCELLED;

    item.itemStatusHistory.push({
      status: ITEM_STATUSES.CANCELLED,
      updatedBy: "USER",
    });

    item.cancellation = {
      reason,
      cancelledAt: new Date(),
      cancelledBy: "USER",
    };

    await Variant.updateOne(
      { _id: item.variantId },
      {
        $inc: {
          stock: item.quantity,
        },
      },
    );

    if (
      ["RAZORPAY", "WALLET"].includes(order.paymentMethod) &&
      order.paymentStatus === "PAID" &&
      item.refundStatus !== "COMPLETED"
    ) {
      const refund = calculateItemRefund({
        order,
        item,
        operation: "CANCELLATION",
      });

      totalRefund += refund;

      item.refundAmount = refund;
      item.refundStatus = "COMPLETED";
    }
  }

  if (
    ["RAZORPAY", "WALLET"].includes(order.paymentMethod) &&
    order.paymentStatus === "PAID" &&
    totalRefund > 0
  ) {
    await creditWallet({
      userId: order.user,
      amount: totalRefund,
      reason: "ORDER_CANCELLED",
      description: `Refund for cancelled order ${order.orderNumber}`,
      referenceId: order._id,
    });

    order.paymentStatus = "FULLY_REFUNDED";
  }

  order.orderStatus = ORDER_STATUSES.CANCELLED;

  order.statusHistory.push({
    status: ORDER_STATUSES.CANCELLED,
    updatedBy: "USER",
  });

  order.cancellation = {
    reason,
    cancelledAt: new Date(),
    cancelledBy: "USER",
  };

  await order.save();

  return {
    message: "Order cancelled successfully",
    data: {
      orderId: order._id,
      orderStatus: order.orderStatus,
      refundedAmount: totalRefund,
    },
  };
};

// Download invoice
export const downloadinvoiceService = async ({ orderId, userId, res }) => {
 const order = await Order.findOne({
   _id: orderId,
   user: userId,
 })
   .populate("user", "fullName email")
   .lean();

  if (!order) {
    throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
  }

  generateInvoicePdf({
    order,
    res,
  });
};


