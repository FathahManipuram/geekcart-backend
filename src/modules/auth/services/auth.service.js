import { createOtp, verifyOtp } from '../../../common/services/otp.service.js'
import User from '../../user/models/user.model.js'
import { generateAccessToken, generateRefreshToken } from "../../../common/utils/jwt.js"
import { comparePassword, hashPassword } from "../../../common/utils/encryption.js"
import { OTP_TYPES } from "../../../common/constants/otpTypes.js"


//user register
export const registerUser= async(data)=>{
	const {email, password}= data

	const existingUser= await User.findOne({email})
	if(existingUser) throw new Error("User already exists")

	const hashedPassword= await hashPassword(password)

	const user= await User.create({...data,
		password: hashedPassword,
	})

	const otp= await createOtp({
		userId: user._id,
		email:user.email,
		type: OTP_TYPES.EMAIL_VERIFY,	
		})
	console.log("OTP: ", otp)
	return {message: "User registered successfully"}
}


//Verify email
export const verifyEmail= async({email, otp})=>{
	await verifyOtp({
		email,
		otp,
		type: OTP_TYPES.EMAIL_VERIFY
	})
	await User.updateOne({email}, {isVerified: true})

	return {message: "Email verified Successfully"}
}


//login user
export const loginUser= async({email, password})=>{
	const user= await User.findOne({email})

	if(!user) throw new Error("User not found")
	if(!user.isVerified) throw new Error("Verify email first")
	if(user.isBlocked) throw new Error("User is blocked")

	const isMatch= await comparePassword(password, user.password)
	if(!isMatch) throw new Error("Invalid credentials")


	const accessToken= generateAccessToken(user)
	const refreshToken= generateRefreshToken(user)

	user.lastLoginAt= new Date();
	await user.save()
	return {user, accessToken, refreshToken}
}


//Forgot password
export const forgotPassword= async({email})=>{

const user= await User.findOne({email})
if(!user) throw new Error("OTP sent if account exists")
if(user.isBlocked) throw new Error("User is blocked")

await createOtp({
	userId: user._id,
	email: user.email,
	type:  OTP_TYPES.PASSWORD_RESET,
})
return {message: "OTP sent to your email"}

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

//Verify-OTP
export const verifyOtpService= async({email, otp, type})=>{
	await verifyOtp({email, otp, type})

if(type===OTP_TYPES.EMAIL_VERIFY){
	await User.updateOne({email}, {isVerified: true})
}
return {message: "Otp verified successfully"}
}