import { createOtp, resendOtp, verifyOtp } from '../../../common/services/otp.service.js'
import User from '../../user/models/user.model.js'
import { generateAccessToken, generateRefreshToken } from "../../../common/utils/jwt.js"
import { comparePassword, hashPassword } from "../../../common/utils/encryption.js"
import { OTP_TYPES } from "../../../common/constants/otpTypes.js"
import { sendEmail } from '../../../infrastructure/services/email.service.js'
import { otpTemplate } from '../../../common/utils/emailTemplates.js'
import { generateOtp } from '../../../common/utils/otp.js'
import { AppError } from '../../../common/utils/AppError.js'
import { HTTP_STATUS } from '../../../common/constants/statusCode.js'


//user register
export const registerUser= async(data)=>{
	const {email, password}= data

	const existingUser= await User.findOne({email})
	if(existingUser){
		throw new AppError("User already exists", HTTP_STATUS.CONFLICT)
	} 

	const hashedPassword= await hashPassword(password)

	const user= await User.create({
		...data,
		password: hashedPassword,
		isVerified: false,
	})

	const otp= await createOtp({
		userId: user._id,
		email:user.email,
		type: OTP_TYPES.EMAIL_VERIFY,	
		})

		await sendEmail({
			to: email,
			subject: "Verify your email",
			html: otpTemplate(otp)
		})


	console.log("OTP: ", otp)
	return {message: "User registered successfully. Verify your email."}
}


//Verify email
export const verifyOtpService= async({email, otp})=>{
	await verifyOtp({
		email, 
		otp, 
		type: OTP_TYPES.EMAIL_VERIFY,
		})


const user= await User.updateOne({email}, {isVerified: true})

	console.log("verifieduser: ", user)
return {message: "Email verified successfully"}
}


// Resend OTP
export const resendOtpService= async({email, type})=>{
	console.log("resendService", email, type)
	const otp= await resendOtp({email, type})
console.log("Otp: ", otp)
	await sendEmail({
			to: email,
			subject: "Verify your email",
			html: otpTemplate(otp)
		})
		return {message: "OTP resend successfully"}
}

//login user
export const loginUser= async({email, password})=>{
	const user= await User.findOne({email})

	if(!user) throw new AppError("User not found", HTTP_STATUS.NOT_FOUND)
	if(!user.isVerified) throw new AppError("Verify email first", HTTP_STATUS.BAD_REQUEST)
	if(user.isBlocked) throw new AppError("User is blocked", HTTP_STATUS.FORBIDDEN)

	const isMatch= await comparePassword(password, user.password)
	if(!isMatch) throw new Error("Invalid credentials")


	const accessToken= generateAccessToken(user)
	const refreshToken= generateRefreshToken(user)

	user.lastLoginAt= new Date();
	await user.save()
	return {
		message: "Login successful",
		data:{
		user, 
		accessToken, 
		refreshToken
		},
		}
}


//Forgot password
export const forgotPassword= async({email})=>{
let otp;
const user= await User.findOne({email})

if (user && !user.isBlocked){
otp= await createOtp({
	userId: user._id,
	email: user.email,
	type:  OTP_TYPES.PASSWORD_RESET,
})
}

await sendEmail({
	to: email,
	subject: "Reset Password OTP",
	html: otpTemplate(otp)

})

return {message: "OTP sent if account exists"}

}



//Reset password
export const resetPassword= async({email, otp, newPassword})=>{
	await verifyOtp({
		email, 
		otp, 
		type: OTP_TYPES.PASSWORD_RESET,
	})

	const hashedPassword= await hashPassword(newPassword)
	await User.updateOne(
		{email},
		{password: hashedPassword}
	)

	return {message: "Password reset successfully"}

}


//Logout
export const logoutUser=()=>{
	return{message: "Logged out successfully"}
}


export const refreshTokenService= async ({refreshToken})=>{

		if(!refreshToken) throw new AppError("Refresh token required")

		const decoded= jwt.verify(
			refreshToken,
			process.env.JWT_REFRESH_SECRET
		)
		console.log(decoded)

		const user= await User.findById(decoded.id)

		const newAccessToken= generateAccessToken(user)
		return {message: "Token refreshed"}
}