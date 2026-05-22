import Joi from "joi";
import { categoryName, color, description, fabric, images, price, productName, salePrice, size, sku, sleeve, stock } from "../../../../common/validation/base.validation.js";
import { Variant } from "../models/variant.model.js";


const variantSchema= Joi.object({
  size: size.required(),
  color: color.required(),
  sku: sku.required(),
  stock: stock.required(),
  price: price.required(),
  salePrice: salePrice.optional().allow(null, ""),
  isDefault: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
})

export const createProductSchema = Joi.object({
  name: productName.required().messages({
    "string.empty": "Product name is required",
  }),
  description: description.required().messages({
    "string.empty": "Description is required",
  }),
  coverImage: Joi.any().optional(),
  galleryImages: images.optional(),
  category: categoryName.required(),
  subcategory: categoryName.required(),

  manufacturer: Joi.object({
    name: Joi.string().allow("").optional(),
    address: Joi.string().allow("").optional(),
    email: Joi.string().email().allow("").optional(),
    phone: Joi.string().allow("").optional(),
  }).optional(),

  // defaultAttributes: Joi.object({
  //   sleeve: sleeve.allow("").optional(),
  //   fabric: fabric.allow("").optional(),
  // }).optional(),
  sleeve: sleeve.optional().allow(""),
  fabric: fabric.optional().allow(""),
  isReturnable: Joi.boolean().optional(),
  returnWindowDays: Joi.number().integer().min(1).optional(),

  isFeatured: Joi.boolean().optional(),
  isLimited: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),

  // selectedSizes: Joi.array().items(Joi.string()).optional(),
  // selectedColor: Joi.string().allow("").optional(),

  variants: Joi.array()
    .items(variantSchema)
    .min(1)
    .required()
    .messages({ "array.min": "At least one variant is required" }),
});

export const updateProductSchema=Joi.object({
  name: productName.optional(),
  description: description.optional(),
  coverImage: Joi.any().optional(),
  galleryImages: images.optional(),
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

  variants: Joi.array()
    .items(variantSchema)
    .min(1).optional(),
    
})