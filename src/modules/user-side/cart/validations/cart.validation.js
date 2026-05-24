import Joi from "joi";

export const addToCartSchema = Joi.object({
  productId: Joi.string().required(),

  variantId: Joi.string().required(),

  quantity: Joi.number().integer().min(1).required(),
});
