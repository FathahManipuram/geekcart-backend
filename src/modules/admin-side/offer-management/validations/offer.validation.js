import Joi from "joi";

const strongTextRegex = /^[a-zA-Z0-9]+[a-zA-Z0-9\s\-_.,()!%]*$/;

export const createOfferSchema = Joi.object({
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
    .valid("Product", "Category", "Subcategory")
    .required(),

  targetId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid target id",
    "string.length": "Invalid target id",
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

  maxDiscountAmount: Joi.when("discountType", {
    is: "PERCENTAGE",
    then: Joi.number().greater(0).required().messages({
      "any.required": "Maximum discount is required for percentage offers",
    }),

    otherwise: Joi.any().strip(),
  }),

 startDate: Joi.date()
     .iso()
     .required()
     .custom((value, helpers) => {
       const startDate = new Date(value);
       startDate.setHours(0, 0, 0, 0);
 
       const today = new Date();
       today.setHours(0, 0, 0, 0);
 
       if (startDate < today) {
         return helpers.message("Start date cannot be set in the past.");
       }
 
       return value;
     })
     .messages({
       "any.required": "Start date is required.",
     }),
 
   expiryDate: Joi.date()
     .iso()
     .required()
     .custom((value, helpers) => {
       const { startDate } = helpers.state.ancestors[0];
 
       if (!startDate) return value;
 
       const start = new Date(startDate);
       start.setHours(0, 0, 0, 0);
 
       const expiry = new Date(value);
       expiry.setHours(0, 0, 0, 0);
 
       if (expiry < start) {
         return helpers.message(
           "Expiry date must be on or after the start date.",
         );
       }
 
       return value;
     })
     .messages({
       "any.required": "Expiry date is required.",
     }),

  isActive: Joi.boolean().default(true),
});

export const updateOfferSchema = createOfferSchema.fork(
  [
    "name",
    "description",
    "offerType",
    "targetId",
    "discountType",
    "discountValue",
    "maxDiscountAmount",
    "startDate",
    "expiryDate",
    "isActive",
  ],
   (schema) => schema.optional(),
    )
    .keys({
      expiryDate: Joi.date()
        .iso()
        .optional()
        .custom((value, helpers) => {
          const { startDate } = helpers.state.ancestors[0];
  
          if (!startDate) return value;
  
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
  
          const expiry = new Date(value);
          expiry.setHours(0, 0, 0, 0);
  
          if (expiry < start) {
            return helpers.message(
              "Expiry date must be on or after the start date.",
            );
          }
  
          return value;
        }),
    });