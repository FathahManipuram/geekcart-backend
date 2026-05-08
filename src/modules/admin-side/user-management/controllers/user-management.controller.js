// get UserManagement

import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import { deleteUserService, getUserByIdService, getUserManagementService } from "../services/user-management.service.js";

export const getUserManagementController= async(req, res, next)=>{

try{
	const page= Number(req.query.page) || 1;
const limit= Number(req.query.limit) || 5
const search= req.query.search || ""

const result = await getUserManagementService({
	page, limit, search,
})

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


// Get user by Id
export const getUserByIdController = async(req, res, next)=>{
	try{
			const {userId} = req.params;
		console.log("details params:", req.params)
		console.log("userId", userId)

		const result= await getUserByIdService(userId)
		console.log("result",result)
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

//Delete user
export const deleteUserController= async(req, res, next)=>{
	try{
		const{userId}= req.params
		const result= await deleteUserService(userId)

		return successResponse(
			res,
			HTTP_STATUS.OK,
			result.message
		)
	}catch(err){
		next(err)
	}
}