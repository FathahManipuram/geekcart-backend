import { compareOtp, generateOtp, hashOtp } from "../utils/otp.js"
import Otp from '../../modules/auth/models/otp.model.js'
import { sendEmail } from "../../infrastructure/services/email.service.js"
import { otpTemplate } from "../utils/emailTemplates.js"



//Create OTP
export const createOtp= async({userId, email, type})=>{

const otp= generateOtp()
	const hashedOtp= await hashOtp(otp)

	await Otp.create({
		userId,
		email,
		otp: hashedOtp,
		type,
		expiresAt: new Date(Date.now() + 10 * 60 *1000),
	})

	await sendEmail({
		to: email,
		subject: "Your OTP Code",
		html: otpTemplate(otp)
	})
	return otp
}


//Verify OTP
export const verifyOtp= async({email, type, otp})=>{
	const record= await Otp.findOne({email, type})
	
	if(!record) throw new Error("OTP expired or not found")
	if(record.attemptCount>=record.maxAttempts) throw new Error("Too many attempts")

	const isMatch= await compareOtp(otp, record.otp)

	if(!isMatch){
		record.attemptCount++;
		await record.save();
		throw new Error("Invalid OTP")
	}

	await Otp.deleteMany({email, type})

return true
}


//Resend OTP
export const resendOtp= async({email, type})=>{
	await Otp.deleteMany({email, type})

	const user= await User.findOne({email})
	if(!user) throw new Error("USer not found")
	if(user.isBlocked) throw new Error("User is blocked")

	await createOtp({
		userId: user._id,
		email,
		type,
	})
	return {message: "OTP resend successfully"}
}