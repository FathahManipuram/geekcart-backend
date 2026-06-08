import { ORDER_STATUS_TRANSITIONS } from "../../../../common/constants/order/orderStatusTransistion.js";
import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { Order } from "../../../user-side/order/models/order.model.js"

export const getOrdersService = async({
	page= 1,
	limit=10,
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

      Order.countDocuments(),

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
