export const PAYMENT_ISSUES = {
  INVALID_PAYMENT_METHOD: {
    code: "INVALID_PAYMENT_METHOD",
    message: "Invalid payment method selected",
  },

  WALLET_NOT_FOUND: {
    code: "WALLET_NOT_FOUND",
    message: "Wallet not found",
  },

  WALLET_DISABLED: {
    code: "WALLET_DISABLED",
    message: "Wallet is currently disabled",
  },

  INSUFFICIENT_WALLET_BALANCE: {
    code: "INSUFFICIENT_WALLET_BALANCE",
    message: "Insufficient wallet balance",
  },

  COD_LIMIT_EXCEEDED: {
    code: "COD_LIMIT_EXCEEDED",
    message: "Cash on Delivery is not available for this order amount",
  },

  PAYMENT_REQUIRED: {
    code: "PAYMENT_REQUIRED",
    message: "Payment is required to place this order",
  },

  PAYMENT_VERIFICATION_FAILED: {
    code: "PAYMENT_VERIFICATION_FAILED",
    message: "Payment verification failed",
  },

  PAYMENT_ALREADY_COMPLETED: {
    code: "PAYMENT_ALREADY_COMPLETED",
    message: "Payment has already been completed",
  },

  RAZORPAY_ORDER_NOT_FOUND: {
    code: "RAZORPAY_ORDER_NOT_FOUND",
    message: "Payment order not found",
  },

  INVALID_PAYMENT_SIGNATURE: {
    code: "INVALID_PAYMENT_SIGNATURE",
    message: "Invalid payment signature",
  },
};
