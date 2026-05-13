import { HTTP_STATUS } from "../constants/statusCode.js"
import { errorResponse } from "../helpers/response.js"

export const errorMiddleware= (err, req, res, next)=>{
	console.error("ERROR: ",err)
	const statusCode= err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR

	return errorResponse(
    res,
    statusCode,
    err.message || "Internal server Error",
    process.env.NODE_ENV === "development" ? err.stack : undefined,
  );
}