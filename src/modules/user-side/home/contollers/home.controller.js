import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import { getHomeDataService } from "../services/home.service.js";



///get data
export const getHomeDataController = async (req, res, next) => {
  try {
    const result = await getHomeDataService();
	console.log("homeCont:", result)

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};


