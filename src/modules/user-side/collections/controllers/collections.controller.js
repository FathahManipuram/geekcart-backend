import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import { getCollectionsService } from "../services/collections.service.js";

export const getCollectionsController = async (req, res, next) => {
  try {
    const result = await getCollectionsService(req.query);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};
