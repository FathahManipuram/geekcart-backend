import { OTP_TYPES } from "../../../common/constants/otpTypes.js"
import { HTTP_STATUS } from "../../../common/constants/statusCode.js"
import { createOtp, verifyOtp } from "../../../common/services/otp.service.js"
import { AppError } from "../../../common/utils/AppError.js"
import { otpTemplate } from "../../../common/utils/emailTemplates.js"
import { comparePassword, hashPassword } from "../../../common/utils/encryption.js"
import { uploadImage } from "../../../common/utils/uploadImage.js"
import { sendEmail } from "../../../infrastructure/services/email.service.js"
import User from "../models/user.model.js"

//Get profile
export const getProfileService= async(userId)=>{
	const user= await User.findById(userId)

	if(!user){
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND)
	}

	return {
		message: "Profile fetched successfully",
		data: user
	}
}


//Update profile

export const updateProfileService= async(userId, data)=>{
console.log("upadeprofileService: ",userId, data)
	
	const user= await User.findByIdAndUpdate(
		userId,
		data,
		{new: true}
	)

	if(!user){
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND)
	} 
console.log("updateprofileUSer:", user)
	return {message: "Profile updated successfully",
		data: user
	}
}

//Change email
export const changeEmailService= async(userId, newEmail)=>{
	console.log("EmilChange Service: ",userId, newEmail )
	const user= await User.findById(userId)
	if(!user){
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND)
	}

	const isExisting= await User.findOne({email: newEmail})
	if(isExisting){
		throw new AppError("Email already in use", HTTP_STATUS.CONFLICT)
	}

	const otp= await createOtp({
		userId,
		email: newEmail,
		type: OTP_TYPES.EMAIL_CHANGE,
		meta: {newEmail},
	})


	await sendEmail({
		to: newEmail,
		subject: "Verify new email",
		html: otpTemplate(otp),
	})

	return {message: "OTP sent to new email"}
}

//Verify email change
export const verifyEmailChangeService= async({userId, email, otp})=>{
	console.log("verifyEmailchange: ", userId, email)
	const record= await verifyOtp({
		userId,
		email,
		otp,
		type: OTP_TYPES.EMAIL_CHANGE,
	})
	const newEmail= record.meta.newEmail
	console.log("metaNewEmail: ", newEmail)
	await User.findByIdAndUpdate(userId, {email: newEmail})

	return {message: "Email updated successfully"}
}


//Change passsword
export const changePasswordService= async(userId, data)=>{
	console.log("changepass:", userId, data)
	const {oldPassword, newPassword}= data;
	const user = await User.findById(userId).select("+password")
	console.log("chapassUser: ", user)
	if(!user){
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND)
	}

	if(user.isBlocked){
		throw new AppError("User is blocked", HTTP_STATUS.FORBIDDEN)
	}

		if(!newPassword){
			throw new AppError("New password required", HTTP_STATUS.BAD_REQUEST)
		}

	if(user.provider==="google"){
	
		const hashedPassword= await hashPassword(newPassword)

		await User.updateOne(
			{_id: userId},
			{
				$set: {password: hashedPassword,
					provider: "local"
				}
				}
		)
		return {message: "Password set successfully"}
	}

if(!oldPassword){
	throw new AppError("Old password required", HTTP_STATUS.BAD_REQUEST)
}

const isMatch= await comparePassword(oldPassword, user.password)

	if(!isMatch){
		throw new AppError("Incorrect old password", HTTP_STATUS.BAD_REQUEST)
	}
const isSame= await comparePassword(newPassword, user.password)

if(isSame){
	 throw new AppError("New password must be different", HTTP_STATUS.BAD_REQUEST)
}
	
console.log("is amtch", isMatch)
	const hashedPassword = await hashPassword(newPassword)
	await User.updateOne(
		{_id: userId},
		{$set: {password: hashedPassword}}
	)
	
	return {message: "Password changed successfully"}
}

//Upload profile image
export const uploadProfileImageService= async (userId, file)=>{
	
	const userExist= await User.exists({_id: userId})
if(!userExist){
	throw new AppError("User not found", HTTP_STATUS.NOT_FOUND)
}

	const imageUrl= await uploadImage(file, "profile")
	console.log("imgURL: ",imageUrl)

	const user= await User.findByIdAndUpdate(userId,
		{avatar: imageUrl.secure_url},
		{new: true}
	)
console.log("imageUpUser: ",user)
	return {
		message: "Profile image updated",
		data: user,
	}
}