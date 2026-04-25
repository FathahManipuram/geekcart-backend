import * as authService from '../services/auth.service.js'


//Register
export const registerController = async(req, res, next)=>{
	try{
		const result= await authService.registerUser(req.body)
		res.json(result)
	}catch(err){
		next(err)
	}
}

//Login
export const loginController= async(req, res, next)=>{
	try{
		const result= await authService.loginUser(req.body)
		res.json(result)
	}catch(err){
		next(err)
	}
}


//Forgot-Password
export const forgotPasswordController= async(req, res, next)=>{
try{
	const result= await authService.forgotPassword(req.body)
	res.json(result)
}catch(err){
next(err)
}
}


//Reset-Password
export const resetPasswordController=async(req, res, next)=>{
	try{
		const result= await authService.resetPassword(req.body)
		res.json(result)
	}catch(err){
		next(err)
	}
}


//Verify-Email
export const verifyEmailController= async(req, res, next)=>{
	try{
		const result= await authService.verifyEmail(req.body)
		res.json(result)
	}catch(err){
		next(err)
	}
}

//Logout 
export const logoutController= async(req, res, next)=>{
	try{
		const result= await authService.logoutUser()
		res.json(result)
	}catch(err){
		next(err)
	}
}


