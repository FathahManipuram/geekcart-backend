import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import { getDashboardService } from "../services/dashboard.service.js";

export const getDashboardController = async (req, res, next) => {
  try {
    const result = await getDashboardService();
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};