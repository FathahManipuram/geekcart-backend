import { HTTP_STATUS } from "../../../../common/constants/statusCode.js"
import { successResponse } from "../../../../common/helpers/response.js"
import { createAddressService, getAddressesService, removeAddressService, updateAddressService } from "../services/address.service.js"


export const getAddressesController= async(req, res, next)=>{
	try{
		const userId= req.user.id
		console.log("getAddressControl: ", userId)
		const result= await getAddressesService(userId)
		console.log("result getAddressControl: ",result)
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

export const craeteAddressController= async (req, res, next)=>{
	try{
	const userId= req.user.id
console.log("addcreatControlle: ", userId, req.body)
	const result= await createAddressService(userId, req.body)
console.log("ResControl: ", result)
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


//Update address
export const updateAddressController= async(req, res, next)=>{
	try{
		const userId= req.user.id
		const addressId= req.params.addressId
		console.log("updateAddreContro: ", userId, addressId)
		const result= await updateAddressService(userId, addressId, req.body)
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

//Remove

export const removeAddressController= async(req, res, next)=>{
try{
	const userId= req.user.id
	const addressId= req.params.addressId
console.log(userId, addressId)
	const result= await removeAddressService(userId, addressId)
	return successResponse(
		res, HTTP_STATUS.OK,
		result.message
	)
}catch(err){
	next(err)
}
}