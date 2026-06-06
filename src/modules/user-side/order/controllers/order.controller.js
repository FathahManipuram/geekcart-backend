import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import {
  cancelOrderService,
  createOrderService,
  getOrderByIdService,
  getOrdersService,
} from "../services/order.service.js";

export const createOrderController = async (req, res, next) => {
  try {
    const result = await createOrderService({
      userId: req.user.id,
      ...req.body,
    });

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

// Get order by id
export const getOrderByIdController = async (req, res, next) => {
  try {
    const result = await getOrderByIdService({
      userId: req.user.id,
      orderId: req.params.orderId,
    });

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (error) {
    next(error);
  }
};

//Get all orders
export const getOrdersController = async (req, res, next) => {
  try {
    const result = await getOrdersService(req.user.id);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (error) {
    next(error);
  }
};

// Cancel order
export const cancelOrderController = async (req, res, next) => {
  try {
    const result = await cancelOrderService({
      userId: req.user.id,
      orderId: req.params.orderId,
      reason: req.body.reason,
    });

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (error) {
    next(error);
  }
};