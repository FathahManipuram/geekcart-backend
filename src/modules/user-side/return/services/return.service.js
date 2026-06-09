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
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
  });

  if (!order) {
    throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
  }

  for (const itemId of items) {
    const item = order.items.id(itemId);
console.log("item :", item)
    if (!item) continue;
	
console.log("Current Item Status:", item.itemStatus);
    if (item.itemStatus !== "DELIVERED") {
      throw new AppError(
        "Only delivered items can be returned",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    item.itemStatus = "RETURN_PENDING";

    item.itemStatusHistory.push({
      status: "RETURN_PENDING",
      updatedBy: "USER",
    });

    await ReturnRequest.create({
      order: order._id,
      orderItem: item._id,
      user: userId,
      reason,
    });
  }

  await order.save();

  return {
    message: "Return request submitted successfully",
  };
};