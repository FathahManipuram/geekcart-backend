import Joi from "joi";

export const createReturnRequestSchema = Joi.object({
  orderId: Joi.string().required(),

  items: Joi.array().items(Joi.string()).min(1).required(),

  reason: Joi.string().trim().required(),
});
