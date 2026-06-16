import Joi from "joi";


const strongTextRegex = /^[a-zA-Z0-9]+[a-zA-Z0-9\s\-_.,()!%]*$/;

export const createOfferValidation = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(strongTextRegex)
    .required()
    .messages({
      "string.pattern.base":
        "Offer name must start with a letter/number and contain readable text.",
      "string.min": "Offer name must be at least 3 characters long.",
    }),

  description: Joi.string().trim().min(10).allow("", null).required(),

  offerType: Joi.string()
    .valid("PRODUCT", "CATEGORY", "SUBCATEGORY")
    .required(),


  productId: Joi.string()
    .trim()
    .when("offerType", {
      is: "PRODUCT",
      then: Joi.required(),
      otherwise: Joi.valid("", null).striped(), 
    }),

  categoryId: Joi.string()
    .trim()
    .when("offerType", {
      is: "CATEGORY",
      then: Joi.required(),
      otherwise: Joi.valid("", null).striped(),
    }),

  subcategoryId: Joi.string()
    .trim()
    .when("offerType", {
      is: "SUBCATEGORY",
      then: Joi.required(),
      otherwise: Joi.valid("", null).striped(),
    }),

  discountType: Joi.string().valid("PERCENTAGE", "FIXED").required(),

  
  discountValue: Joi.number()
    .positive()
    .required()
    .when("discountType", {
      is: "PERCENTAGE",
      then: Joi.number()
        .max(90)
        .message("Percentage discount cannot exceed 90%"),
      otherwise: Joi.number(), 
    }),

  minOrderAmount: Joi.number().min(0).allow(null, "").default(0),

  maxDiscountAmount: Joi.number().min(0).allow(null, "").default(null),


  startDate: Joi.date()
    .required()

    .min(new Date(Date.now() - 5 * 60 * 1000))
    .messages({
      "date.min": "Start date cannot be in the past.",
    }),

  expiryDate: Joi.date().greater(Joi.ref("startDate")).required().messages({
    "date.greater": "Expiry date must be scheduled after the start date.",
  }),

  isActive: Joi.boolean().default(true),
});
