import { HTTP_STATUS } from "../constants/statusCode.js"
import { AppError } from "../utils/AppError.js"
import { jwtVerify } from "../utils/jwt.js"
import User from "../../modules/user/models/user.model.js"
const authMiddleware= async(req, res, next)=>{
	try{
		const authHeader= req.headers.authorization

	if(!authHeader || !authHeader.startsWith("Bearer ") ){
		throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED)
	}
	const token= authHeader.split(" ")[1]
	const decoded= jwtVerify(token, process.env.JWT_SECRET)

	console.log("decodedToken: ",decoded)

	const user= await User.findById(decoded.id)

	if(!user){
		throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED)
	}

	if(user.isBlocked){
		throw new AppError("User is blocked", HTTP_STATUS.FORBIDDEN)
	}
	req.user= user
	return next()
	} catch(err){

		if(err.name==="TokenExpiredError"){
			return next(
				new AppError("Token expired, plese login again", HTTP_STATUS.UNAUTHORIZED)
			)
		}
		return next(err)
	}
}

export default authMiddleware