import Joi from "joi";
import { objectId } from "../../../../common/validation/base.validation.js";

export const validateShippingSchema = Joi.object({
  addressId: Joi.string().required(),

  deliveryMethod: Joi.string().valid("STANDARD", "EXPRESS").required(),
});

export const validatePaymentSchema = Joi.object({
  deliveryMethod: Joi.string().valid("STANDARD", "EXPRESS").required(),
  paymentMethod: Joi.string().valid("COD", "RAZORPAY", "WALLET").required(),
  couponId: objectId.optional().allow(null),
});