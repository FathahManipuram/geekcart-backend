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
		res.json(result)
	}catch(err){
		next(err)
	}
}

//Resend OTP
export const resendOtpController= async(req, res, next)=>{
	console.log("resenetroute: ", req.body)
	try{
		const result= await authService.resendOtpService(req.body)
		res.json(result)
		console.log("Otp resent Result: ", result)
	}catch(err){
		next(err)
	}
}

//Login
export const loginController= async(req, res, next)=>{
	try{
		const result= await authService.loginUser(req.body)
		res.json(result)
	}catch(err){
		next(err)
	}
}


//Forgot-Password
export const forgotPasswordController= async(req, res, next)=>{
try{
	const result= await authService.forgotPassword(req.body)
	res.json(result)
}catch(err){
next(err)
}
}


//Reset-Password
export const resetPasswordController=async(req, res, next)=>{
	try{
		const result= await authService.resetPassword(req.body)
		res.json(result)
	}catch(err){
		next(err)
	}
}




//Logout 
export const logoutController= async(req, res, next)=>{
	try{
		const result= await authService.logoutUser()
		res.json(result)
	}catch(err){
		next(err)
	}
}

export const refreshTokenController = async(req, res, next)=>{
	try{
		const result= await authService.refreshTokenService(req.body)
		
		return successResponse(
			res,
			HTTP_STATUS.OK,
			result.message,
			{accessToken: newAccessToken}
		)

	}catch(err){
		next(err)
	}
}
