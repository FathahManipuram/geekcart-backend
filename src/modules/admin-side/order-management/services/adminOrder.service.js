import { ITEM_STATUSES, ORDER_STATUSES } from "../../../../common/constants/order/orderStatus.js";
import { ITEM_STATUS_TRANSITIONS, ORDER_STATUS_TRANSITIONS } from "../../../../common/constants/order/orderStatusTransistion.js";
import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { recalculateOrderStatus } from "../../../user-side/order/helpers/recalculateOrderStatus.js";
import { Order } from "../../../user-side/order/models/order.model.js"


// Get all Orders
export const getOrdersService = async({
	page= 1,
	limit=5,
	search="",
	status,
	sort,
})=>{
const query={}

if (status && status.trim() !== "ALL") {
  query.orderStatus = status.trim();
}

if(search){
	query.orderNumber={
		$regex: search.trim(),
		$options: "i",
	}
}

const skip= (page-1) * limit

	const [orders, totalOrders, pendingShipments, revenueResult] =
    await Promise.all([
      Order.find(query)
        .populate("user", "fullName email")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      Order.countDocuments(query),

      Order.countDocuments({
        orderStatus: { $in: ["PLACED", "PROCESSING"] },
      }),

      Order.aggregate([
        {
          $match: { paymentStatus: "PAID" },
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: "$totalAmount",
            },
          },
        },
      ]),
    ]);

console.log("revenue", revenueResult)
	const totalRevenue= revenueResult[0]?.totalRevenue || 0

return {
  message: "Orders fetched successfully",
  data: {
	orders,

	orderStats:{
		totalOrders,
		pendingShipments,
		totalRevenue,
	},

	pagination: {
		totalPages: Math.ceil(totalOrders/limit),
		currentPage: Number(page),
		limit: Number(limit),
	}
  }
};

}

// Get order by ID
export const getOrderByIdService= async(orderId)=>{
console.log(orderId)
  const order= await Order.findById(orderId)
  .populate("user", "fullName email phoneNumber avatar")
  .lean()

  if(!order){
    throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND)
  }

  return {
    message: "Order fetched successfully",
    data: order
  }

}


// UPdate All order status
export const updateOrderStatusService= async({orderId, orderStatus})=>{
  const order= await Order.findById(orderId)

  if(!order){
    throw new AppError("Order not fount", HTTP_STATUS.NOT_FOUND)
  }

  const currentStatus= order.orderStatus

  const allowedStatuses= ORDER_STATUS_TRANSITIONS[currentStatus] ||[]

  const isValidTransition= allowedStatuses.includes(orderStatus)

  if(!isValidTransition){
    throw new AppError(
      `Cannot change order status from ${currentStatus} to ${orderStatus}`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  order.orderStatus= orderStatus;

  order.statusHistory.push({ status: orderStatus, updatedBy: "ADMIN"});


  for (const item of order.items) {
    if(item.itemStatus === currentStatus){
        item.itemStatus = orderStatus;

        item.itemStatusHistory.push({
          status: orderStatus,
          updatedBy: "ADMIN",
        });

    }
  }

  if(orderStatus==="CANCELLED"){
    order.cancellation={
      cancelledAt: new Date(),
      cancelledBy: "ADMIN",
    }
  }

  await order.save()

  return {
    message: "Order status updated successfully",
    data: order,
  };
}


//Update orderitem status
export const updateOrderItemStatusService= async({orderId, itemId, status})=>{
  const order= await Order.findById(orderId)

  if(!order){
       throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
  }

  const item= order.items.id(itemId)

  if(!item){
     throw new AppError("Item not found", HTTP_STATUS.NOT_FOUND);
  }


const allowedStatuses= ITEM_STATUS_TRANSITIONS[item.itemStatus] || []


console.log("Current Status:", item.itemStatus);
console.log("Requested Status:", status);
console.log("Allowed Statuses:", allowedStatuses);

if(!allowedStatuses.includes(status)){
  throw new AppError("Invalid status transition", HTTP_STATUS.BAD_REQUEST);
}


  item.itemStatus= status;

  item.itemStatusHistory.push({
    status,
    updatedBy: "ADMIN"
  })

  // const newOrderStatus= recalculateOrderStatus(order.items)

  // if(newOrderStatus && newOrderStatus!== order.orderStatus){
  //   order.orderStatus= newOrderStatus

  //   order.statusHistory.push({
  //     status: newOrderStatus,
  //     updatedBy: "ADMIN"
  //   })
  // }


  if (
    order.items.every((item) => item.itemStatus === ITEM_STATUSES.DELIVERED)
  ) {
    order.orderStatus = ORDER_STATUSES.DELIVERED;
  }

  if (
    order.items.every((item) => item.itemStatus === ITEM_STATUSES.CANCELLED)
  ) {
    order.orderStatus = ORDER_STATUSES.CANCELLED;
  }


await order.save()

return {
  message: "Item status updated successfully",
};

}
