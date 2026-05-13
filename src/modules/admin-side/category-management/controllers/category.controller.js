import { HTTP_STATUS } from "../../../../common/constants/statusCode.js"
import { successResponse } from "../../../../common/helpers/response.js"
import * as categoryService from "../services/category.service.js"

export const createCategoryController= async(req, res, next)=>{
	try{
		const result= await categoryService.createCategoryService(req.body)
		return successResponse(
			res,
			HTTP_STATUS.OK,
			result.message,
			result.data
		)
	}catch (err){
		next(err)
	}
}