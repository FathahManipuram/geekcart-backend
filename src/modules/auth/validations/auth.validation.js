import Joi from "joi";
import {
  confirmPassword,
  email,
  fullName,
  password,
} from "../../../common/validation/base.validation.js";

//Register
export const registerSchema = Joi.object({
  fullName: fullName.required(),
  email: email.required(),
  password: password.required(),
  confirmPassword: confirmPassword("password").required(),
  referralCode: Joi.string()
    .trim()
    .uppercase()
    .min(10)
    .max(22)
    .allow("")
    .optional()
    .messages({
      "string.min": "Code is too short",
      "string.max": "Code is too long",
    }),
});

//Login
export const loginSchema = Joi.object({
  email: email.required(),
  password: Joi.string().required(),
});

//Forget password
export const forgotPasswordSchema = Joi.object({
  email: email.required(),
});

//Reset password
export const resetPasswordSchema = Joi.object({
  newPassword: password.required(),
  email: email.required(),
});
