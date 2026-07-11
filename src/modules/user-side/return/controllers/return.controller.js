import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import { requestReturnOrderService } from "../services/return.service.js";

export const requestReturnOrderController = async (req, res, next) => {
  try {
    const result = await requestReturnOrderService({
      userId: req.user.id,
      ...req.body,
    });

    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (err) {
    next(err);
  }
};
