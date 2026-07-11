import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import {
  addToWishlistService,
  getWishlistService,
  removeWishlistService,
} from "../services/wishlist.service.js";

// Add to wishlist
export const addToWishlistController = async (req, res, next) => {
  try {
    const { productId, variantId } = req.body;

    const result = await addToWishlistService(
      req.user.id,
      productId,
      variantId,
    );

    return successResponse(res, HTTP_STATUS.CREATED, result.message);
  } catch (err) {
    next(err);
  }
};

// Get wishlist
export const getWishlistController = async (req, res, next) => {
  try {
    const result = await getWishlistService(req.user.id);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

//Remove wishlist
export const removeWishlistController = async (req, res, next) => {
  try {
    const { variantId } = req.params;

    const result = await removeWishlistService(req.user.id, variantId);

    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (err) {
    next(err);
  }
};
