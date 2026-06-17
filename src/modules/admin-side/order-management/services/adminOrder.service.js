import { ITEM_STATUSES, ORDER_STATUSES } from "../../../../common/constants/order/orderStatus.js";
import { ITEM_STATUS_TRANSITIONS, ORDER_STATUS_TRANSITIONS } from "../../../../common/constants/order/orderStatusTransistion.js";
import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { Order } from "../../../user-side/order/models/order.model.js"
import { creditWallet } from "../../../user-side/wallet/services/wallet.service.js";
import { Variant } from "../../product-management/models/variant.model.js";


// Get all Orders
export const getOrdersService = async({
	page= 1,
	limit=5,
	search="",
	status,
	_sort,
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
export const updateOrderStatusService = async ({ orderId, orderStatus }) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
  }

  const currentStatus = order.orderStatus;

  const allowedStatuses = ORDER_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowedStatuses.includes(orderStatus)) {
    throw new AppError(
      `Cannot change order status from ${currentStatus} to ${orderStatus}`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

 
  if (orderStatus === ORDER_STATUSES.CANCELLED) {
  
    if (order.paymentStatus === "FULLY_REFUNDED") {
      throw new AppError("Order already refunded", HTTP_STATUS.BAD_REQUEST);
    }

    const refundableItems = order.items.filter(
      (item) =>
        ![ITEM_STATUSES.DELIVERED, ITEM_STATUSES.CANCELLED].includes(
          item.itemStatus,
        ),
    );

    const refundAmount = refundableItems.reduce(
      (sum, item) => sum + (item.salePrice || item.price) * item.quantity,
      0,
    );

    
    for (const item of refundableItems) {
      item.itemStatus = ITEM_STATUSES.CANCELLED;

      item.itemStatusHistory.push({
        status: ITEM_STATUSES.CANCELLED,
        updatedBy: "ADMIN",
      });

      item.cancellation = {
        cancelledAt: new Date(),
        cancelledBy: "ADMIN",
      };

      item.refundAmount = (item.salePrice || item.price) * item.quantity;

      item.refundStatus = "COMPLETED";
    }

  
    await Promise.all(
      refundableItems.map((item) =>
        Variant.updateOne(
          { _id: item.variantId },
          {
            $inc: {
              stock: item.quantity,
            },
          },
        ),
      ),
    );


    if (
      order.paymentMethod === "RAZORPAY" &&
      order.paymentStatus === "PAID" &&
      refundAmount > 0
    ) {
      await creditWallet({
        userId: order.user,

        amount: refundAmount,

        reason: "ORDER_CANCELLED",

        description: `Refund for cancelled order ${order.orderNumber}`,

        referenceId: order._id,
      });

      order.paymentStatus = "FULLY_REFUNDED";
    }

    order.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: "ADMIN",
    };
  }


  else {
    for (const item of order.items) {
      if (item.itemStatus === currentStatus) {
        item.itemStatus = orderStatus;

        item.itemStatusHistory.push({
          status: orderStatus,
          updatedBy: "ADMIN",
        });
      }
    }
  }

  order.orderStatus = orderStatus;

  order.statusHistory.push({
    status: orderStatus,
    updatedBy: "ADMIN",
  });

  if (
    orderStatus === ORDER_STATUSES.DELIVERED &&
    order.paymentMethod === "COD" &&
    order.paymentStatus !== "PAID"
  ) {
    order.paymentStatus = "PAID";
  }

  await order.save();

  return {
    message: "Order status updated successfully",
    data: order,
  };
};


//Update orderitem status
export const updateOrderItemStatusService = async ({
  orderId,
  itemId,
  status,
}) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
  }

  const item = order.items.id(itemId);

  if (!item) {
    throw new AppError("Item not found", HTTP_STATUS.NOT_FOUND);
  }

  const allowedStatuses = ITEM_STATUS_TRANSITIONS[item.itemStatus] || [];

  if (!allowedStatuses.includes(status)) {
    throw new AppError("Invalid status transition", HTTP_STATUS.BAD_REQUEST);
  }

  item.itemStatus = status;

  item.itemStatusHistory.push({
    status,
    updatedBy: "ADMIN",
  });


  if (status === ITEM_STATUSES.CANCELLED) {
    if (item.refundStatus === "COMPLETED") {
      throw new AppError("Item already refunded", HTTP_STATUS.BAD_REQUEST);
    }

    const refundAmount = (item.salePrice || item.price) * item.quantity;

    item.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: "ADMIN",
    };


    await Variant.updateOne(
      { _id: item.variantId },
      {
        $inc: {
          stock: item.quantity,
        },
      },
    );


    if (order.paymentMethod === "RAZORPAY" && order.paymentStatus === "PAID") {
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
  }



  if (
    order.items.every((item) => item.itemStatus === ITEM_STATUSES.DELIVERED) &&
    order.orderStatus !== ORDER_STATUSES.DELIVERED
  ) {
    order.orderStatus = ORDER_STATUSES.DELIVERED;

    order.statusHistory.push({
      status: ORDER_STATUSES.DELIVERED,
      updatedBy: "ADMIN",
    });

    if (order.paymentMethod === "COD") {
      order.paymentStatus = "PAID";

      order.paymentDetails = {
        ...order.paymentDetails,
        paidAt: new Date(),
      };
    }
  }

if (
  order.items.every((item) => item.itemStatus === ITEM_STATUSES.CANCELLED) &&
  order.orderStatus !== ORDER_STATUSES.CANCELLED
) {
  order.orderStatus = ORDER_STATUSES.CANCELLED;

  order.statusHistory.push({
    status: ORDER_STATUSES.CANCELLED,
    updatedBy: "ADMIN",
  });

  order.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: "ADMIN",
  };

  if (order.paymentMethod === "RAZORPAY" && order.paymentStatus === "PAID") {
    order.paymentStatus = "FULLY_REFUNDED";
  }
}

  await order.save();

  return {
    message: "Item status updated successfully",
  };
}; 
