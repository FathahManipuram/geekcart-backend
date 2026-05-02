import { HTTP_STATUS } from "../../../../common/constants/statusCode"
import { successResponse } from "../../../../common/helpers/response"
import { adminLoginService } from "../services/admin.auth.service"

const adminLoginController= async(req, res, next)=>{
	try{
		const result= await adminLoginService(req.body)
		return successResponse(
			res,
			HTTP_STATUS.OK,
			result.message,
			result.data
		)
	} catch(err){
		next(err)
	}
}