import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import {
  validateCheckoutService,
  validateFinalCheckoutService,
  validatePaymentService,
  validateShippingService,
} from "../services/checkout.service.js";

// Validate before checkout
export const validateCheckoutController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await validateCheckoutService(userId);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

// Validate shipping
export const validateShippingController = async (req, res, next) => {
  try {
    const result = await validateShippingService({
      userId: req.user.id,
      ...req.body,
    });

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (error) {
    next(error);
  }
};

export const validatePaymentController = async (req, res, next) => {
  try {
    const result = await validatePaymentService({
      userId: req.user.id,
      ...req.body,
    });
    return successResponse(res, HTTP_STATUS.OK, result.mesaage, result.data);
  } catch (err) {
    next(err);
  }
};

export const validateFinalCheckoutController = async (req, res, next) => {
  try {
    const result = await validateFinalCheckoutService({
      userId: req.user.id,
      ...req.body,
    });

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};
