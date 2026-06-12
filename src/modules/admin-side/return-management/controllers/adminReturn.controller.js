import { HTTP_STATUS } from "../../../../common/constants/statusCode.js"
import { successResponse } from "../../../../common/helpers/response.js"
import { getAllReturnRequestsService, getReturnRequestDetailsService, updateReturnRequestStatusService } from "../services/adminReturn.service.js"

export const getAllReturnRequestsController= async(req, res, next)=>{
	try{
		const result= await getAllReturnRequestsService(req.query)
		return successResponse(res, HTTP_STATUS.OK, result.message, result.data)
	}catch(err){
		next(err)
	}
}

export const updateReturnRequestStatusController= async(req, res, next)=>{
	try{
		const {returnId}= req.params

		const result= await updateReturnRequestStatusService({returnId, ...req.body})

		return successResponse(res, HTTP_STATUS.OK, result.message, result.data)
	}catch(err){
		next(err)
	}
}


export const getReturnRequestDetailsController= async(req, res, next)=>{
	const {returnId}= req.params
console.log("returnId", returnId)
	try{
		const result= await getReturnRequestDetailsService(returnId)

		return successResponse(res, HTTP_STATUS.OK, result.message, result.data)
	}catch(err){
		next(err)
	}
}