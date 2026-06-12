import {
  ITEM_STATUSES,
  ORDER_STATUSES,
} from "../../../../common/constants/order/orderStatus.js";

export const recalculateOrderStatus = (items) => {
  const statuses = items.map((item) => item.itemStatus);

  if (statuses.every((status) => status === ITEM_STATUSES.CANCELLED)) {
    return ORDER_STATUSES.CANCELLED;
  }

  if (statuses.every((status) => status === ITEM_STATUSES.DELIVERED)) {
    return ORDER_STATUSES.DELIVERED;
  }

  if (statuses.every((status) => status === ITEM_STATUSES.OUT_FOR_DELIVERY)) {
    return ORDER_STATUSES.OUT_FOR_DELIVERY;
  }

  if (statuses.every((status) => status === ITEM_STATUSES.SHIPPED)) {
    return ORDER_STATUSES.SHIPPED;
  }

  if (statuses.every((status) => status === ITEM_STATUSES.PROCESSING)) {
    return ORDER_STATUSES.PROCESSING;
  }

  return ORDER_STATUSES.PLACED;
};
