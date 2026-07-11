import { RETURN_REQUEST_STATUSES } from "../../../../common/constants/adminReturn/returnStatusList.js";
import { RETURN_STATUS_TRANSITIONS } from "../../../../common/constants/adminReturn/returnStatusTransition.js";
import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { handleCouponRestoration } from "../../../user-side/coupon/helper/handleCouponRestoration.helper.js";
import { calculateItemRefund } from "../../../user-side/order/helpers/calculateItemRefund.js";
import { recalculateOrderStatus } from "../../../user-side/order/helpers/recalculateOrderStatus.js";
import { Order } from "../../../user-side/order/models/order.model.js";
import { User } from "../../../user-side/user-profile/models/user.model.js";
import { creditWallet } from "../../../user-side/wallet/services/wallet.service.js";
import { Variant } from "../../product-management/models/variant.model.js";
import { ReturnRequest } from "../models/return.model.js";

export const getAllReturnRequestsService = async ({
  page = 1,
  limit = 5,
  status,
  search,
}) => {
  const query = {};

  if (status && status !== "ALL") {
    query.status = status;
  }

  if (search && search.trim().length) {
    const users = await User.find({
      $or: [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    query.$or = [
      {
        user: {
          $in: users.map((u) => u._id),
        },
      },
      {
        "itemSnapshot.name": {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }
  const skip = (page - 1) * limit;

  const returns = await ReturnRequest.find(query)
    .populate("user", "fullName email")
    .populate("order", "orderNumber")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalItems = await ReturnRequest.countDocuments(query);

  return {
    message: "Return data fetched successfully",
    data: {
      returns,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
      },
    },
  };
};

// Update request status
export const updateReturnRequestStatusService = async ({
  returnId,
  status,
  adminNote,
}) => {
  if (
    status === RETURN_REQUEST_STATUSES.RETURN_REJECTED &&
    !adminNote?.trim()
  ) {
    throw new AppError("Rejection reason is required", HTTP_STATUS.BAD_REQUEST);
  }
  const returnRequest = await ReturnRequest.findById(returnId);

  if (!returnRequest) {
    throw new AppError("Return request not found", HTTP_STATUS.NOT_FOUND);
  }

  const allowedStatuses = RETURN_STATUS_TRANSITIONS[returnRequest.status] || [];

  if (!allowedStatuses.includes(status)) {
    throw new AppError(
      "Invalid return status transition",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const order = await Order.findById(returnRequest.order);

  if (!order) {
    throw new AppError("Order not found", HTTP_STATUS.NOT_FOUND);
  }

  const item = order.items.id(returnRequest.orderItemId);

  if (!item) {
    throw new AppError("Order item not found", HTTP_STATUS.NOT_FOUND);
  }

  returnRequest.status = status;
  returnRequest.statusHistory.push({
    status,
    updatedBy: "ADMIN",
  });
  returnRequest.adminNote = adminNote;

  item.itemStatus = status;
  item.itemStatusHistory.push({
    status,
    updatedBy: "ADMIN",
  });

  if (status === RETURN_REQUEST_STATUSES.RETURN_APPROVED) {
    const refundAmount = calculateItemRefund({
      order,
      item,
      operation: "RETURN",
    });

    returnRequest.refundAmount = refundAmount;
  }

  if (status === RETURN_REQUEST_STATUSES.RETURN_COMPLETED) {
    if (returnRequest.refundStatus === "COMPLETED") {
      throw new AppError("Refund already processed", HTTP_STATUS.BAD_REQUEST);
    }

    await creditWallet({
      userId: returnRequest.user,
      amount: returnRequest.refundAmount,
      reason: "RETURN_REFUND",
      description: `Refund for returned item ${returnRequest.itemSnapshot.name}`,
      referenceId: returnRequest._id,
    });

    returnRequest.refundStatus = "COMPLETED";
    returnRequest.resolvedAt = new Date();

    item.refundAmount = returnRequest.refundAmount;
    item.refundStatus = "COMPLETED";

    await Variant.updateOne(
      { _id: item.variantId },
      {
        $inc: {
          stock: item.quantity,
        },
      },
    );

    const remainingActiveItems = order.items.filter(
      (i) =>
        i._id.toString() !== item._id.toString() &&
        !["CANCELLED", "RETURN_COMPLETED"].includes(i.itemStatus),
    );

    if (remainingActiveItems.length === 0) {
      await handleCouponRestoration(order);
    }
  }

  // Recalculate order status
  const newOrderStatus = recalculateOrderStatus(order.items);
  if (newOrderStatus) {
    order.orderStatus = newOrderStatus;
    order.statusHistory.push({
      status: newOrderStatus,
      updatedBy: "ADMIN",
    });
  }

  await order.save();
  await returnRequest.save();

  return {
    message: "Return status updated successfully",
    data: returnRequest,
  };
};

// Get Return details
export const getReturnRequestDetailsService = async (returnId) => {
  const returnRequest = await ReturnRequest.findById(returnId)
    .populate("user", "fullName email")
    .populate(
      "order",
      "orderNumber createdAt paymentMethod paymentStatus items",
    )
    .lean();

  if (!returnRequest) {
    throw new AppError("Return request not found", HTTP_STATUS.NOT_FOUND);
  }
  const specificItem = returnRequest.order?.items?.find(
    (item) => item._id.toString() === returnRequest.orderItemId?.toString(),
  );

  const salePrice = specificItem?.salePrice || 0;
  const couponDiscount = specificItem?.couponDiscount || 0;

  return {
    message: "Return request details fetched successfully",
    data: {
      ...returnRequest,
      itemSnapshot: {
        ...returnRequest.itemSnapshot,
        salePrice,
        couponDiscount,
      },
    },
  };
};
