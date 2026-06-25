import Joi from "joi";

export const fullName= Joi.string().min(3).max(30).pattern(/^[a-zA-Z\s'-]+$/).messages({
    'string.pattern.base': 'Full name can only contain letters, spaces, hyphens, or apostrophes.',
  })
export const phoneNumber= Joi.string().pattern(/^[0-9]{10}$/)


export const addressLine = Joi.string().min(5).max(50).messages({
  "string.min": "Address line must be at least 5 characters long.",
});
export const landmark = Joi.string()
  .max(30)
export const city = Joi.string().min(2).max(30);
export const state = Joi.string().min(2).max(30);
export const country = Joi.string().min(2).max(30);
export const pincode = Joi.string().pattern(/^[0-9]{6}$/);

export const addressLabel = Joi.string().valid("Home", "Work", "Other");