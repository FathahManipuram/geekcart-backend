import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import { getDashboardService } from "../services/dashboard.service.js";

export const getDashboardController = async (req, res, next) => {
  try {
    const { type = "monthly" } = req.query;
    const result = await getDashboardService({ type });
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};
