import { comparePassword } from "../../../../../common/utils/encryption"
import { generateAccessToken, generateRefreshToken } from "../../../../../common/utils/jwt"
import { HTTP_STATUS } from "../../../../common/constants/statusCode"
import { AppError } from "../../../../common/utils/AppError"
import { User } from "../../../../user-side/user-profile/models/user.model"

//login user
export const adminLoginService= async({email, password})=>{
	const admin= await User.findOne({email}).select("+password")

if(!admin || admin.role !== "admin"){
	throw new AppError("Invalid credentials", HTTP_STATUS.FORBIDDEN)
}

	const isMatch= await comparePassword(password, admin.password)
	console.log("isMatch:", isMatch)
	if(!isMatch) throw new AppError("Invalid credentials", HTTP_STATUS.UNAUTHORIZED)


	const accessToken= generateAccessToken(admin)
	const refreshToken= generateRefreshToken(admin)

	
	return {
		message: "Login successful",
		data:{
		user: admin,
		accessToken, 
		refreshToken
		},
		}
}


export const getUsers= async (query)=>{
	const{
		page= 1,
		limit=10,
		search=""
	}= query;

	const filter={
		fullName: {$regex: search, $options: "i"},
	}

	const users= await User.find(filter)
	.sort({createdAt:-1})
	.skip((page-1)* limit)
	.limit(Number(limit.select("-password")))

	const total= await User.countDocuments(filter);

	return {
		message: "Users fetched",
		data:{
		users,
		total,
		page,
		pages: Math.ceil(total/limit),
		}
		
	}
}

export const toggleBlockUser= async (userId)=>{
		const user= await User.findById(userId)
		if(!user){
			throw new AppError("User not found", HTTP_STATUS.NOT_FOUND)
		}
		const isBlocked= !user.Blocked;
		await User.updateOne({_id: userId}, 
			{$set: {isBlocked: isBlocked}}
		)
		return {
			message: user.isBlocked? "User blocked": "User unblocked",
		}
	}