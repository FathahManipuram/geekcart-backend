import Joi from "joi";

export const createCouponScheama = Joi.object({
  code: Joi.string()
    .trim()
    .uppercase()
    .min(3)
    .max(15)
    .regex(/^[A-Z0-9]+$/)
    .required()
    .messages({
      "string.pattern.base":
        "Coupon code must contain only alphanumeric characters (no spaces or punctuation).",
      "string.min": "Coupon code must be at least 3 characters long.",
      "string.max": "Coupon code cannot exceed 15 characters.",
      "any.required": "Coupon code is a required field.",
    }),

  description: Joi.string().trim().min(10).required().messages({
    "string.min":
      "Provide a descriptive summary (min 10 characters) for checkout visibility.",
    "any.required": "Description is required.",
  }),

  discountType: Joi.string().valid("PERCENTAGE", "FIXED").required().messages({
    "any.only": "Discount type must be either PERCENTAGE or FIXED.",
  }),

  discountValue: Joi.number()
    .positive()
    .required()
    .when("discountType", {
      is: "PERCENTAGE",
      then: Joi.number()
        .max(100)
        .message("Percentage discount cannot exceed 100%"),
    })
    .messages({
      "number.positive": "Discount value must be greater than 0.",
    }),

  minOrderAmount: Joi.number().min(0).default(0).messages({
    "number.min": "Minimum order amount cannot be negative.",
  }),

  maxDiscountAmount: Joi.number()
    .min(0)
    .when("discountType", {
      is: "PERCENTAGE",
      then: Joi.number().greater(0).required().messages({
        "any.required":
          "Percentage coupons require a maximum discount limit to protect profit margins.",
        "number.greater":
          "Maximum discount cap must be greater than 0 for percentage offers.",
      }),
      otherwise: Joi.number().default(0),
    }),

  usageLimit: Joi.number().integer().positive().required().messages({
    "number.integer": "Global usage limit must be a whole number.",
    "number.positive": "Global usage limit must be at least 1.",
  }),

  perUserLimit: Joi.number()
    .integer()
    .positive()
    .max(Joi.ref("usageLimit"))
    .required()
    .messages({
      "number.max": "Per user limit cannot exceed the global usage limit.",
      "number.integer": "Per user limit must be a whole number.",
    })
    .default(1),

  startDate: Joi.date()
    .iso()
    .required()
    .custom((value, helpers) => {
      const bufferTime = new Date(Date.now() - 5 * 60 * 1000);
      if (value < bufferTime) {
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

      const minExpiry = new Date(startDate).getTime() + 60 * 1000;
      if (new Date(value).getTime() < minExpiry) {
        return helpers.message(
          "Expiry date must be scheduled at least 1 minute after the start date.",
        );
      }
      return value;
    })
    .messages({
      "any.required": "Expiry date is required.",
    }),

  isActive: Joi.boolean().default(true),
});



export const updateCouponoSchema = createCouponScheama
  .fork(
    [
      "code",
      "description",
      "discountType",
      "discountValue",
      "minOrderAmount",
      "maxDiscountAmount",
      "usageLimit",
      "perUserLimit",
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

        const minExpiry = new Date(startDate).getTime() + 60 * 1000;
        if (new Date(value).getTime() < minExpiry) {
          return helpers.message(
            "Updated expiry date must be at least 1 minute after the start date.",
          );
        }
        return value;
      }),
  });