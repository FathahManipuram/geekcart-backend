import Joi from "joi";

export const fullName= Joi.string().min(3).max(30);
export const phoneNumber= Joi.string().pattern(/^[0-9]{10}$/)


export const addressLine = Joi.string().min(5);
export const city = Joi.string();
export const state = Joi.string();
export const country= Joi.string()
export const pincode = Joi.string().pattern(/^[0-9]{6}$/);

export const addressLabel = Joi.string().valid("home", "work", "other");