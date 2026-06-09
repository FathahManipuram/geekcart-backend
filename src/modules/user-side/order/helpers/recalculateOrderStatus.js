
export const recalculateOrderStatus = (items) => {
  const statuses = items.map((item) => item.itemStatus);

  if (statuses.every((status) => status === "CANCELLED")) {
    return "FULLY_CANCELLED";
  }

  if (statuses.some((status) => status === "CANCELLED")) {
    return "PARTIALLY_CANCELLED";
  }

  if (statuses.every((status) => status === "DELIVERED")) {
    return "DELIVERED";
  }

  if (statuses.some((status) => status === "OUT_FOR_DELIVERY")) {
    return "OUT_FOR_DELIVERY";
  }

  if (statuses.some((status) => status === "SHIPPED")) {
    return statuses.every((status) => status === "SHIPPED")
      ? "SHIPPED"
      : "PARTIALLY_SHIPPED";
  }

  if (statuses.some((status) => status === "PROCESSING")) {
    return "PROCESSING";
  }

  return "PLACED";
};
