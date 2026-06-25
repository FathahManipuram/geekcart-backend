import Joi from "joi";
import { categoryName, color, costPrice, description, fabric, price, productName, size, sku, sleeve, stock } from "../../../../common/validation/base.validation.js";


const variantGroupValidationSchema = Joi.object({
  color: color.required(),
  sizes: Joi.array().items(size).min(1).required(),
  images: Joi.array().items(Joi.string()).optional(),
});


const variantSchema = Joi.object({
  size: size.required(),
  color: color.required(),
  sku: sku.required(),
  stock: stock.required(),
  costPrice: costPrice.required(),
  price: price.required(),
  images: Joi.array().items(Joi.string()).optional(),
  isDefault: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
});

export const createProductSchema = Joi.object({
  name: productName.required().messages({
    "string.empty": "Product name is required",
  }),
  description: description.required().messages({
    "string.empty": "Description is required",
  }),
  // coverImage: Joi.any().optional(),
  coverImage: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
  category: categoryName.required(),
  subcategory: categoryName.required(),

  manufacturer: Joi.object({
    name: Joi.string().allow("").optional(),
    address: Joi.string().allow("").optional(),
    email: Joi.string().email().allow("").optional(),
    phone: Joi.string().allow("").optional(),
  }).optional(),

  sleeve: sleeve.optional().allow(""),
  fabric: fabric.optional().allow(""),
  isReturnable: Joi.boolean().optional(),
  returnWindowDays: Joi.number().integer().min(1).optional(),

  isFeatured: Joi.boolean().optional(),
  isLimited: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),

  variantGroups: Joi.array()
    .items(variantGroupValidationSchema)
    .min(1)
    .required(),

  variants: Joi.array()
    .items(variantSchema)
    .min(1)
    .required()
    .messages({ "array.min": "At least one variant is required" }),
}).options({
  abortEarly: false,
});

export const updateProductSchema = Joi.object({
  name: productName.optional(),
  description: description.optional(),
  coverImage: Joi.any().optional(),
  category: categoryName.optional(),
  subcategory: categoryName.optional(),

  manufacturer: Joi.object({
    name: Joi.string().allow("").optional(),
    address: Joi.string().allow("").optional(),
    email: Joi.string().email().allow("").optional(),
    phone: Joi.string().allow("").optional(),
  }).optional(),

  sleeve: sleeve.optional().allow(""),
  fabric: fabric.optional().allow(""),
  isReturnable: Joi.boolean().optional(),
  returnWindowDays: Joi.number().integer().min(1).optional(),

  isFeatured: Joi.boolean().optional(),
  isLimited: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),

  variants: Joi.array().items(variantSchema).min(1).optional(),

  variantGroups: Joi.array().items(variantGroupValidationSchema).optional(),
});