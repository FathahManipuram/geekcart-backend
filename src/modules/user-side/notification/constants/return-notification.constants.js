export const RETURN_NOTIFICATION_MESSAGES = {
  REQUESTED: {
    title: "Return Requested",
    message: (itemName) =>
      `Your return request for ${itemName} has been submitted.`,
  },

  APPROVED: {
    title: "Return Approved",
    message: (itemName) =>
      `Your return request for ${itemName} has been approved.`,
  },

  REJECTED: {
    title: "Return Rejected",
    message: (itemName) =>
      `Your return request for ${itemName} has been rejected.`,
  },

  PICKUP_SCHEDULED: {
    title: "Pickup Scheduled",
    message: (itemName) => `Pickup has been scheduled for ${itemName}.`,
  },

  REFUND_PROCESSED: {
    title: "Refund Processed",
    message: (amount) => `Your refund of ₹${amount} has been processed.`,
  },
};
