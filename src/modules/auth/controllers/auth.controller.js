import { OTP_TYPES } from '../../../common/constants/otpTypes.js'
import { HTTP_STATUS } from '../../../common/constants/statusCode.js'
import { successResponse } from '../../../common/helpers/response.js'
import { resendOtp } from '../../../common/services/otp.service.js'
import { AppError } from '../../../common/utils/AppError.js'
import { generateAccessToken } from '../../../common/utils/jwt.js'
import * as authService from '../services/auth.service.js'


//Register
export const registerController = async(req, res, next)=>{
	try{
		const result= await authService.registerUser(req.body)
		return successResponse(
			res,
			HTTP_STATUS.CREATED,
			result.message
		)
	}catch(err){
		next(err)
	}
}

//Verify-Email
export const verifyEmailController= async(req, res, next)=>{
	try{
		const result= await authService.verifyOtpService(req.body)
		return successResponse(
			res,
			HTTP_STATUS.OK,
			result.message
		)
	}catch(err){
		next(err)
	}
}

//Resend OTP
export const resendOtpController= async(req, res, next)=>{
	console.log("resenetroute: ", req.body)
	try{
		const result= await authService.resendOtpService(req.body)
				console.log("Otp resent Result: ", result)
		return successResponse(
			res,
			HTTP_STATUS.OK,
			result.message
		)
	}catch(err){
		next(err)
	}
}

//Login
export const loginController= async(req, res, next)=>{
	try{
		console.log("LoginUserController: ", req.body)
		const result= await authService.loginUser(req.body)
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


//Forgot-Password
export const forgotPasswordController= async(req, res, next)=>{
try{
	const result= await authService.forgotPassword(req.body)
	return successResponse(
		res,
		HTTP_STATUS.OK,
		result.message
	)
}catch(err){
next(err)
}
}


//Reset-Password
export const resetPasswordController=async(req, res, next)=>{
	try{
		const result= await authService.resetPassword(req.body)
		return successResponse(
			res,
			HTTP_STATUS.OK,
			result.message
		)
	}catch(err){
		next(err)
	}
}


//Logout 
export const logoutController= async(req, res, next)=>{
	try{
		const result= await authService.logoutUser()
		return successResponse(
			res,
			HTTP_STATUS.OK,
			result.message
		)
	}catch(err){
		next(err)
	}
}


//Refresh token
export const refreshTokenController = async(req, res, next)=>{
	try{
		const result= await authService.refreshTokenService(req.body)
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


// Google login

export const googleLoginController= async (req, res, next)=>{
	try{
		const { token }= req.body
		const result= await authService.googleLoginService(token)
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