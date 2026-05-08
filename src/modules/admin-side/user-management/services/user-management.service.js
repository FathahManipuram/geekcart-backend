import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { getUserById } from "../../../../common/services/user.services.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { User } from "../../../user-side/user-profile/models/user.model.js";

export const getUserManagementService = async({
	page, limit, search,
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

	const users= await User.find(query).sort({createdAt: -1})
	.skip(skip)
	.limit(limit);

	const totalUsers= await User.countDocuments(query)

	return {
		message: "Users fetched successfully",
		data: {
			users,
			totalUsers,
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
	console.log("userid: ", userId)
	const user= await User.findByIdAndDelete(userId)
	console.log("DeletServiceUSer: ", user)

	if(!user){
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND)
	}

	return {
    message: "User deleted successfully",
  };
}

