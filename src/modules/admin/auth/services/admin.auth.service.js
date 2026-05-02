import { HTTP_STATUS } from "../../../../common/constants/statusCode"
import { AppError } from "../../../../common/utils/AppError"

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
