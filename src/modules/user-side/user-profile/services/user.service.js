import { getUserById } from "../../../../common/services/user.services.js"
import { AppError } from "../../../../common/utils/AppError.js"
import { comparePassword, hashPassword } from "../../../../common/utils/encryption.js"
import { uploadImage } from "../../../../common/utils/uploadImage.js"
import { sendEmail } from "../../../../infrastructure/services/email.service.js"
import { User } from "../models/user.model.js"


//Get profile
export const getProfileService= async(userId)=>{
	const user= await getUserById(userId)

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

	const user= await User.findByIdAndUpdate(
		userId,
		data,
		{new: true}
	)

	if(!user){
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND)
	} 

	return {message: "Profile updated successfully",
		data: user
	}
}

//Change email
export const changeEmailService= async(userId, newEmail)=>{
	
	const user= await getUserById(userId)
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
	const record= await verifyOtp({
		userId,
		email,
		otp,
		type: OTP_TYPES.EMAIL_CHANGE,
	})

	const newEmail= record.meta.newEmail

	await User.findByIdAndUpdate(userId, {email: newEmail})

	return {message: "Email updated successfully"}
}


//Change passsword
export const changePasswordService= async(userId, data)=>{
	const {oldPassword, newPassword}= data;
	const user = await User.findById(userId).select("+password")

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

	const user= await User.findByIdAndUpdate(userId,
		{avatar: imageUrl.secure_url},
		{new: true}
	)

	return {
		message: "Profile image updated",
		data: user,
	}
}