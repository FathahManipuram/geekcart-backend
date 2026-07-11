import Joi from "joi";
import {
  confirmPassword,
  email,
  fullName,
  password,
} from "../../../../common/validation/base.validation.js";

export const createUserSchema = Joi.object({
  fullName,
  email,
  password,
  confirmPassword: confirmPassword("password"),
  role: Joi.string().valid("user", "admin").default("user"),
});
