import Joi from "joi";
import {
  email,
  fullName,
} from "../../../../common/validation/base.validation.js";

export const updateUserSchema = Joi.object({
  fullName,
  email,
  role: Joi.string().valid("user", "admin").default("user"),
});
