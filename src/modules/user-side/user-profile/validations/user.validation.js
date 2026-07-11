import Joi from "joi";
import {
  confirmPassword,
  dateOfBirth,
  email,
  fullName,
  gender,
  otp,
  password,
  phoneNumber,
} from "../../../../common/validation/base.validation.js";

//Change Email
export const changeEmailSchema = Joi.object({
  email: email.required(),
});

//Verify email
export const verifyEmailChangeSchema = Joi.object({
  email: email.required(),
  otp: otp.required(),
});

// Change password
export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().optional(),
  newPassword: password.required(),
  confirmPassword: confirmPassword("newPassword").required(),
});

export const updateProfileSchema = Joi.object({
  fullName: fullName.optional(),
  phoneNumber: phoneNumber.optional(),
  gender: gender.optional(),
  dateOfBirth: dateOfBirth.optional(),
}).min(1);
