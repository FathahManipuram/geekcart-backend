import { compareOtp, generateOtp, hashOtp } from "../utils/otp.js"
import Otp from '../../modules/auth/models/otp.model.js'
import { sendEmail } from "../../infrastructure/services/email.service.js"
import { otpTemplate } from "../utils/emailTemplates.js"
import { AppError } from "../utils/AppError.js"
import { OTP_TYPES } from "../constants/otpTypes.js"
import { getUserByEmail, getUserById } from "./user.services.js"


//Create OTP
export const createOtp= async({userId, email, type, meta={}})=>{

const otp= generateOtp()
	const hashedOtp= await hashOtp(otp)
console.log("Otp generated")
	await Otp.create({
		userId,
		email,
		otp: hashedOtp,
		type,
		meta,
		expiresAt: new Date(Date.now() + 5 * 60 *1000),
	})

	
return otp	
}


//Verify OTP
export const verifyOtp= async({userId, email, otp, type})=>{
	console.log("verifyOtpcheck:", userId, email, otp, type)
	const record= await Otp.findOne({userId, email, type})
	console.log("verifyOtpcheck:", email, otp, type)
	console.log("Record: ", record)
	
	if(!record) throw new AppError("OTP expired or Invalid")
	if(record.attemptCount>=record.maxAttempt) throw new AppError("Too many attempts, Try later")
	if(record.expiresAt < new Date()){
		await Otp.deleteOne({_id: record._id})
		throw new AppError("OTP expired")
	}
	const isMatch= await compareOtp(otp, record.otp)

	if(!isMatch){
		await record.updateOne({
			$inc: {attemptCount: 1}
		})

		throw new AppError("Invalid OTP")
	}

	await Otp.deleteOne({_id: record._id})

return record
}


//Resend OTP
export const resendOtp= async({userId, email, type, meta= {}})=>{
	if(!userId){
		throw new AppError("User ID required")
	}

	const user = await getUserById(userId)
console.log("resend otp", userId, email, type)
	if(!user) throw new AppError("User not found")
	if(user.isBlocked) throw new AppError("User is blocked")
	if(type === OTP_TYPES.EMAIL_VERIFY && user.isVerified){
		throw new AppError("User already verified")
	}
	
		await Otp.deleteMany({userId: user._id, type})

	return await createOtp({
		userId,
		email,
		type,
		meta
	})
}