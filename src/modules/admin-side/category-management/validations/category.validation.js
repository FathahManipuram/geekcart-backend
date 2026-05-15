import Joi from "joi";
import { categoryName } from "../../../../common/validation/base.validation.js";


export const createCategorySchema= Joi.object({
	name: categoryName.required(),
})

export const updateCategorySchema= Joi.object({
	name: categoryName.optional(),
	isActive: Joi.boolean().optional()
})