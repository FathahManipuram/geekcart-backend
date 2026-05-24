import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";

import { successResponse } from "../../../../common/helpers/response.js";

import { addToCartService } from "../services/cart.service.js";


// Add to cart
export const addToCartController = async (req, res, next) => {
  try {

    const userId = req.user.id

    const payload = req.body

    const result = await addToCartService(userId, payload);

    return successResponse(
      res,
      HTTP_STATUS.OK,
      result.message,
      result.data,
    )
  } catch (err) {
    next(err);
  }
};


// Get cart
export const getCartController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await getCartService(userId);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};
