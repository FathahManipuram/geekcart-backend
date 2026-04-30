import { HTTP_STATUS } from "../constants/statusCode"
import { AppError } from "../utils/AppError"
import { jwtVerify } from "../utils/jwt"

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
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND)
	}

	if(!user.isBlocked){
		throw new AppError("User is blocked", HTTP_STATUS.FORBIDDEN)
	}
	req.user= user
	next()
	} catch(err){
		console.log("error NAme:", err.name)
		next(err)
	}
}

export default authMiddleware