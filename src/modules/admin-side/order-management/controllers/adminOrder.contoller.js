import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import {
  getOrderByIdService,
  getOrdersService,
  updateOrderItemStatusService,
  updateOrderStatusService,
} from "../services/adminOrder.service.js";

export const getOrdersController = async (req, res, next) => {
  try {
    const result = await getOrdersService(req.query);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    console.error("Controller Error Log:", err.message || err);
    next(Error);
  }
};

//Get order by ID
export const getOrderByIdController = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const result = await getOrderByIdService(orderId);
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

//UpdateOrderStatus
export const updateOrderStatusController = async (req, res, next) => {
  try {
    const result = await updateOrderStatusService({
      orderId: req.params.orderId,
      orderStatus: req.body.orderStatus,
    });

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (error) {
    next(error);
  }
};

//Update orderitem status
export const updateOrderItemStatusController = async (req, res, next) => {
  try {
    const result = await updateOrderItemStatusService({
      orderId: req.params.orderId,
      itemId: req.params.itemId,
      ...req.body,
    });

    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (err) {
    next(err);
  }
};
