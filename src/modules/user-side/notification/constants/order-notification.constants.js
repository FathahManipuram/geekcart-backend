import { ITEM_STATUSES, ORDER_STATUSES } from "../../../../common/constants/order/orderStatus.js";

export const ORDER_NOTIFICATION_MESSAGES = {
  [ORDER_STATUSES.CONFIRMED]: {
    title: "Order Confirmed",
    message: (orderNumber) => `Your order #${orderNumber} has been confirmed.`,
  },

  [ORDER_STATUSES.PROCESSING]: {
    title: "Order Processing",
    message: (orderNumber) => `Your order #${orderNumber} is being prepared.`,
  },

  [ORDER_STATUSES.SHIPPED]: {
    title: "Order Shipped",
    message: (orderNumber) => `Your order #${orderNumber} has been shipped.`,
  },

  [ORDER_STATUSES.OUT_FOR_DELIVERY]: {
    title: "Out for Delivery",
    message: (orderNumber) => `Your order #${orderNumber} is out for delivery.`,
  },

  [ORDER_STATUSES.DELIVERED]: {
    title: "Order Delivered",
    message: (orderNumber) => `Your order #${orderNumber} has been delivered.`,
  },

  [ORDER_STATUSES.CANCELLED]: {
    title: "Order Cancelled",
    message: (orderNumber) => `Your order #${orderNumber} has been cancelled.`,
  },
};



export const ORDER_ITEM_NOTIFICATION_MESSAGES = {
  [ITEM_STATUSES.CONFIRMED]: {
    title: "Item Confirmed",
    message: (itemName) => `${itemName} has been confirmed.`,
  },

  [ITEM_STATUSES.PROCESSING]: {
    title: "Item Processing",
    message: (itemName) => `${itemName} is being prepared.`,
  },

  [ITEM_STATUSES.SHIPPED]: {
    title: "Item Shipped",
    message: (itemName) => `${itemName} has been shipped.`,
  },

  [ITEM_STATUSES.OUT_FOR_DELIVERY]: {
    title: "Item Out for Delivery",
    message: (itemName) => `${itemName} is out for delivery.`,
  },

  [ITEM_STATUSES.DELIVERED]: {
    title: "Item Delivered",
    message: (itemName) => `${itemName} has been delivered.`,
  },

  [ITEM_STATUSES.CANCELLED]: {
    title: "Item Cancelled",
    message: (itemName) => `${itemName} has been cancelled.`,
  },
};
