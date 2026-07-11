import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";

import {
  addToCartService,
  clearCartService,
  getCartService,
  removeCartItemService,
  updateCartQuantityService,
} from "../services/cart.service.js";

// Add to cart
export const addToCartController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const variantId = req.body.variantId;
    const quantity = Number(req.body.quantity || 1);
    const result = await addToCartService(userId, variantId, quantity);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
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

export const updateCartQuantityController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { variantId } = req.params;
    const { quantity } = req.body;
    const result = await updateCartQuantityService({
      userId,
      variantId,
      quantity: Number(quantity),
    });
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

//remove cart item

export const removeCartItemController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { variantId } = req.params;

    const result = await removeCartItemService({
      userId,
      variantId,
    });

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

// Clear cart
export const clearCartController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await clearCartService(userId);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};
