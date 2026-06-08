import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { Variant } from "../../../admin-side/product-management/models/variant.model.js";
import { Address } from "../../address/models/address.model.js";
import { calculateCartSummary } from "../../cart/helpers/cart.helper.js";
import { Cart } from "../../cart/models/cart.model.js";
import { validateCartItems } from "../helpers/validateCartItems.helper.js";
import { Order } from "../models/order.model.js";

export const createOrderService = async (
  {userId,
  addressId,
  deliveryMethod,
  paymentMethod,}
) => {
  const address = await Address.findOne({_id: addressId, userId});
 

  if(!address){
	throw new AppError("Address not found", HTTP_STATUS.NOT_FOUND)
  }

  const cart= await Cart.findOne({userId})
  
  
  if(!cart || !cart.items.length){
	throw new AppError("Cart is Empty", HTTP_STATUS.BAD_REQUEST)
  }

const validationResult= await validateCartItems(cart.items)
if(!validationResult.valid){
	throw new AppError("Checkout Validation failed", HTTP_STATUS.BAD_REQUEST)
}

const speedCharge= deliveryMethod === "EXPRESS" ? 25 : 0

const {
	subtotal,
	discount,
	shippingCharge,
  deliveryCharge,
	total,
}= calculateCartSummary(cart.items, speedCharge)



const order = await Order.create({
  user: userId,

  items: cart.items.map((item) => ({
    product: item.productId,
    variantId: item.variantId,

    name: item.name,
    image: item.image,

    size: item.size,
    color: item.color,

    quantity: item.quantity,

    price: item.price,
    salePrice: item.salePrice,
  })),

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


  subtotal,
  speedCharge,
  shippingCharge,
  deliveryCharge,
  discount,
  totalAmount: total
});



// 	await Promise.all(
//     cart.items.map((item) =>
//       Variant.updateOne(
//         {
//           _id: item.variantId,
//         },
//         {
//           $inc: { stock: -item.quantity },
//         },
//       ),
//     ),
//   );

await Promise.all(
  cart.items.map(async (item) => {
    const result = await Variant.updateOne(
      {
        _id: item.variantId,
        stock: { $gte: item.quantity }, // 🛡️ Safeguard: Only deduct if enough stock exists
      },
      {
        $inc: { stock: -item.quantity },
      },
    //   { session }, // 🔄 Transaction: Rolls back if any part of the checkout fails
    );

    // If no document matched, it means inventory ran out right at checkout
    if (result.matchedCount === 0) {
      throw new AppError(
        `Item is out of stock or does not have enough inventory available.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }),
);


  cart.items=[]
  cart.summary={
	subtotal: 0,
	discount: 0,
	shippingCharge: 0,
	total: 0,
  }

  await cart.save()
console.log("placed")

  return {
    message: "Order placed successfully",
  data: {
    orderId: order._id,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    orderStatus: order.orderStatus,
  },
  };
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

// Get all orders
export const getAllOrdersService = async (userId) => {
  const orders = await Order.find({
    user: userId,
  }).sort({ createdAt: -1 });

  return {
    message: "Orders fetched successfully",
    data: orders,
  };
};



//Cancel order
export const cancelOrderService= async({userId, orderId, reason})=>{

  if(!mongoose.Types.ObjectId.isValid(orderId)){
    throw new AppError("Invalid order id", HTTP_STATUS.BAD_REQUEST);
  }

  const order= await Order.findOne({_id: orderId, user: userId})

  if(!order){
    throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
  }

    const cancellableStatuses = ["PLACED", "PROCESSING"]

    if(!cancellableStatuses.includes(order.orderStatus)){
      throw new AppError(
        "Order can no longer be cancelled",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    await Promise.all(order.items.map((item)=>
    Variant.updateOne({_id: item.variantId}, {$inc: {stock: item.quantity}})
    ))


    order.orderStatus= "CANCELLED"

    order.cancellation= {
      reason,
      cancelledAt: new Date(),
      cancelledBy: "USER",
    }

    await order.save()

    return {
      message: "Order cancelled successfully",
      data: {
        orderId: order._id,
        orderStatus: order.orderStatus,
      },
    };
}
