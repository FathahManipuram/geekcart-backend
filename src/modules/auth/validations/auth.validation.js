import Joi from "joi";
import { confirmPassword, email, fullName, password } from "../../../common/validation/base.validation.js";



//Register
export const registerSchema = Joi.object({
	fullName,
	email,
	password,
	confirmPassword: confirmPassword("password"),
});

//Login
export const loginSchema= Joi.object({
	email,
	password: Joi.string().required()
})

//Forget password
export const forgotPasswordSchema = Joi.object({
  email,
});

//Reset password
export const resetPasswordSchema = Joi.object({
  password,
  confirmPassword: confirmPassword("password"),
});