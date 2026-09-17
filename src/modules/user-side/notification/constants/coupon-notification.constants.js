export const COUPON_NOTIFICATION_MESSAGES = {
  APPLIED: {
    title: "Coupon Applied",
    message: (couponCode) =>
      `Coupon ${couponCode} has been applied successfully.`,
  },

  REMOVED: {
    title: "Coupon Removed",
    message: (couponCode) =>
      `Coupon ${couponCode} has been removed from your order.`,
  },

  NEW_COUPON: {
    title: "New Coupon Available",
    message: (couponCode) => `New coupon ${couponCode} is now available.`,
  },

  EXPIRED: {
    title: "Coupon Expired",
    message: (couponCode) => `Coupon ${couponCode} has expired.`,
  },
};
