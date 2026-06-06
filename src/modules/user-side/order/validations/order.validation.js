import Joi from "joi";

export const cancelOrderSchema = Joi.object({
  reason: Joi.string().trim().min(5).max(50).required().messages({
    "string.empty": "Cancellation reason is required",
    "string.min": "Reason must be at least 5 characters",
    "string.max": "Reason must not exceed 50 characters",
    "any.required": "Cancellation reason is required",
  }),
});