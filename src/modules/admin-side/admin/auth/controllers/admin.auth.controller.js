import { HTTP_STATUS } from "../../../../common/constants/statusCode"
import { successResponse } from "../../../../common/helpers/response"
import { adminLoginService, getUsers, toggleBlockUser } from "../services/admin.auth.service"

export const adminLoginController= async(req, res, next)=>{
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


export const getUserController=async(req, res, next)=>{
	try{
		const result= await getUsers(req.querry)
		return successResponse(
			res,
			HTTP_STATUS.OK,
			result.message,
			result.data
		)
	}catch(err){
		next(err)
	}
}

export const toggleBlockUserController= async(req, res, next)=>{
	try{
		const userId= req.user.id
		const result= await toggleBlockUser(userId)

		return successResponse(
			res,
			HTTP_STATUS.OK,
			result.message
		)
	}catch(err){
		next(err)
	}
}
