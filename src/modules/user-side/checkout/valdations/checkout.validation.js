import Joi from "joi";

export const validateShippingSchema = Joi.object({
  addressId: Joi.string().required(),

  deliveryMethod: Joi.string().valid("STANDARD", "EXPRESS").required(),
});

export const validatePaymentSchema = Joi.object({
  paymentMethod: Joi.string().valid("COD", "RAZORPAY").required(),
});