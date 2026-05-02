import { compareOtp, generateOtp, hashOtp } from "../utils/otp.js"
import Otp from '../../modules/auth/models/otp.model.js'
import { sendEmail } from "../../infrastructure/services/email.service.js"
import { otpTemplate } from "../utils/emailTemplates.js"
import User from "../../modules/user/models/user.model.js"


//Create OTP
export const createOtp= async({userId, email, type})=>{

const otp= generateOtp()
	const hashedOtp= await hashOtp(otp)
console.log("Otp generated")
	await Otp.create({
		userId,
		email,
		otp: hashedOtp,
		type,
		expiresAt: new Date(Date.now() + 10 * 60 *1000),
	})

	
return otp	
}


//Verify OTP
export const verifyOtp= async({email, otp, type})=>{
	console.log(email, type)
	const record= await Otp.findOne({email, type})
	console.log("Record: ", record)
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
console.log("resend otp", email, type)
	const user= await User.findOne({email})
	console.log("resend otp User", user)
	if(!user) throw new Error("User not found")
	if(user.isBlocked) throw new Error("User is blocked")
	if(user.isVerified) throw new Error("User already verified")
		await Otp.deleteMany({email, type})

	const otp= await createOtp({
		userId: user._id,
		email,
		type,
	})
	return otp
}