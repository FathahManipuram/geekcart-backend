
import { HTTP_STATUS } from "../../../../common/constants/statusCode.js"
import { successResponse } from "../../../../common/helpers/response.js"
import * as userService from "../services/user.service.js"

//Get profile
export const getProfileController= async(req, res, next)=>{
	try{
		const userId= req.user.id
		const result= await userService.getProfileService(userId)
		return successResponse(res, 
		HTTP_STATUS.OK,
		result.message,
		result.data
		)
	}catch(err){
		next(err)
	}
}


//Update profile
export const updateProfileController= async (req, res, next)=>{
	try{
		console.log("updateimaController:", req.body)
		const userId= req.user.id
		const result= await userService.updateProfileService(userId, req.body)
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


//Change email
export const changeEmailController= async(req, res, next)=>{
	try{
		const userId= req.user.id
		const {email}= req.body
		const result= await userService.changeEmailService(userId, email)
		return successResponse(
			res,
			HTTP_STATUS.OK,
			result.message
		)
	}catch(err){
		next(err)
	}
}


//Verify email change
export const verifyEmailChangeController= async(req, res, next)=>{
	try{
		const userId= req.user.id
		const {email, otp}= req.body
		console.log("req", req.body)

		const result= await userService.verifyEmailChangeService({userId, email, otp})
		return successResponse(
			res,
			HTTP_STATUS.OK,
			result.message,
			result.data,
		)
	}catch(err){
		next(err)
	}
}

//Uplode profile image
export const uploadProfileImageController= async(req, res, next)=>{
	try{
		const userId= req.user.id
		const result= await userService.uploadProfileImageService(userId, req.file)
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


//Change password
export const changePasswordController = async (req, res, next)=>{
	try{
		const userId= req.user.id
		const result= await userService.changePasswordService(userId, req.body)
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