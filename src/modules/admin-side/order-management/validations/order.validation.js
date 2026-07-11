import Joi from "joi";
import {
  ITEM_STATUSES,
  ORDER_STATUSES,
} from "../../../../common/constants/order/orderStatus.js";

export const updateOrderStatusSchema = Joi.object({
  orderStatus: Joi.string()
    .valid(...Object.values(ORDER_STATUSES))
    .required()
    .messages({
      "any.required": "Order status is required",
      "any.only": "Invalid order status",
      "string.empty": "Order status cannot be empty",
    }),
});

export const updateOrderItemStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(ITEM_STATUSES))
    .required(),
});
