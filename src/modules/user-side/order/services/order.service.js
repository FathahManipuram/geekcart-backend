import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { Variant } from "../../../admin-side/product-management/models/variant.model.js";
import { Address } from "../../address/models/address.model.js";
import { calculateCartSummary } from "../../cart/helpers/cart.helper.js";
import { Cart } from "../../cart/models/cart.model.js";
import { validateCartItems } from "../helpers/validateCartItems.helper.js";
import { Order } from "../models/order.model.js";
import { ITEM_STATUSES, ORDER_STATUSES } from "../../../../common/constants/order/orderStatus.js";
import { recalculateOrderStatus } from "../helpers/recalculateOrderStatus.js";
import { generateInvoicePdf } from "../../../../common/utils/pdf/invoicePdf.js";


// Create order
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


await Promise.all(
  cart.items.map(async (item) => {
    const result = await Variant.updateOne(
      {
        _id: item.variantId,
        stock: { $gte: item.quantity }, 
      },
      {
        $inc: { stock: -item.quantity },
      },
    //   { session }, 
    );

   
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

if (!cancellableStatuses.includes(item.itemStatus)) {
  throw new AppError("Item cannot be cancelled", HTTP_STATUS.BAD_REQUEST);
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
export const cancelAllOrderService= async({userId, orderId, reason})=>{

  if(!mongoose.Types.ObjectId.isValid(orderId)){
    throw new AppError("Invalid order id", HTTP_STATUS.BAD_REQUEST);
  }

  const order= await Order.findOne({_id: orderId, user: userId})

  if(!order){
    throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
  }

const blockedStatuses = ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

const hasBlockedItems= order.items.some((item)=> blockedStatuses.includes(item.itemStatus))

if(hasBlockedItems){
   throw new AppError(
     "Order can no longer be cancelled",
     HTTP_STATUS.BAD_REQUEST,
   );
}

const cancellableStatuses = [ITEM_STATUSES.PLACED, ITEM_STATUSES.PROCESSING];

 order.items.forEach((item)=>{
  if(cancellableStatuses.includes(item.itemStatus)){
    item.itemStatus= ITEM_STATUSES.CANCELLED

    item.itemStatusHistory.push({
      status: ITEM_STATUSES.CANCELLED,
      updatedBy: "USER",
    })

    item.cancellation= {
      reason,
      cancelledAt: new Date(),
      cancelledBy: "USER",
    }
  }
 })

 order.orderStatus= ORDER_STATUSES.CANCELLED

 order.statusHistory.push({
  status: ORDER_STATUSES.CANCELLED,
  updatedBy: "USER",
 })

 await order.save()

  

    await Promise.all(order.items.map((item)=>
    Variant.updateOne({_id: item.variantId}, {$inc: {stock: item.quantity}})
    ))


    return {
      message: "Order cancelled successfully",
      data: {
        orderId: order._id,
        orderStatus: order.orderStatus,
      },
    };
}

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
