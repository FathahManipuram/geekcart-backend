import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { getUserById } from "../../../../common/services/user.services.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { hashPassword } from "../../../../common/utils/encryption.js";
import { User } from "../../../user-side/user-profile/models/user.model.js";

export const getUserManagementService = async({
	page, limit, search, status,
})=>{
	const skip = (page-1)* limit;
	const query= search ?{
		$or :[{
			fullName:{
				$regex: search,
				$options: "i",
			},

		},
		{
			email: {
			$regex: search,
			$options: "i",
		},
		},
		],
	} :{}

	if(status==="active"){
		query.isBlocked= false
	}

	if(status==="blocked"){
		query.isBlocked= true
	}

	const users= await User.find(query).sort({createdAt: -1})
	.skip(skip)
	.limit(limit);

	const totalUsers= await User.countDocuments(query)
	const activeUsers= await User.countDocuments({...query, isBlocked: false})
	const blockedUsers= await User.countDocuments({...query, isBlocked: true})
	const totalAdmins= await User.countDocuments({...query, role:"admin"})

	return {
		message: "Users fetched successfully",
		data: {
			users,
			totalUsers,
			activeUsers,
			blockedUsers,
			totalAdmins,
			totalPages: Math.ceil(totalUsers/limit),
			currentPage: page,

		}
	}
}



//Get user by id
export const getUserByIdService= async(userId)=>{
	const user= await getUserById(userId)

	if(!user){
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND)
	}
	return {
		message: "User fetched successfully",
		data: user
	}
}

//Delete User
export const deleteUserService= async(userId)=>{
	const user= await getUserById(userId)

	if(!user){
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND)
	}

	if(user.role==="admin"){
		throw new AppError("Admin users cannot be deleted", HTTP_STATUS.FORBIDDEN)
	}
	
	await User.findByIdAndDelete(userId)
	

	return {
    message: "User deleted successfully",
  };
}


//Block User
export const blockUserService= async(userId)=>{
	const user= await getUserById(userId)

	if(!user){
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND)
	}

	if(user.role==="admin"){
		throw new AppError("Admin cannot be blocked", HTTP_STATUS.BAD_REQUEST)
	}

	user.isBlocked = !user.isBlocked
	await user.save()

	return{
		message: user.isBlocked
		? "User is blocked"
		: "User is unblocked",
		data: user
	}
}


//Create user
export const createUserService= async(data)=>{
	const {fullName, email, password, role}= data
	const isExistingUser = await User.findOne({email}) 

	if(isExistingUser){
		throw new AppError("Email already exists", HTTP_STATUS.CONFLICT)
	}

	const hashedPassword= await hashPassword(password)

	const user= await User.create({
		fullName,
		email,
		password: hashedPassword,
		role: role || "user",
		isVerified: true,
		provider: "local"	,
	})

	return {
		message: "User created successfully",
		data: user,
	}
	
}


//Update user
export const updateUserService= async(userId, data)=>{
	const {fullName, email, role}= data;
	const user= await getUserById(userId)
console.log(user)
	if(!user){
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND)
	}

	if(email!==user.email){
		const isExistingEmail= await User.findOne({email})

		if(isExistingEmail){
			throw new AppError("Email already exists", HTTP_STATUS.CONFLICT)
		}
	}

	const updatedUser= await User.findByIdAndUpdate(userId, data, {new: true})

return {
	message: "User updated successfully",
	data: updatedUser,
}
}
