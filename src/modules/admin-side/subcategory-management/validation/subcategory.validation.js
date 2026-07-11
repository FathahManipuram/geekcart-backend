import Joi from "joi";
import { categoryName } from "../../../../common/validation/base.validation.js";

export const createSubcategorySchema = Joi.object({
  name: categoryName.required().messages({
    "string.empty": "Category is required",
    "any.required": "Category is required",
  }),
  category: categoryName.required(),
});

export const updateSubcategorySchema = Joi.object({
  name: categoryName.optional(),
  category: categoryName.optional(),
  isActive: Joi.boolean().optional(),
});
