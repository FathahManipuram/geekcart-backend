import Joi from "joi";


//Change Email
export const changeEmailSchema = Joi.object({
  email,
}); 

// Change password
export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: password,
  confirmPassword: confirmPassword("newPassword"),
});