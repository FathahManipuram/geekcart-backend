import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import {
  getProductDetailsService,
  getSimilarProductsService,
} from "../services/product.service.js";

//Get product details
export const getProductDetailsController = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const result = await getProductDetailsService(slug);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

// Get similar product
export const getSimilarProductsController = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const result = await getSimilarProductsService(slug);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};
