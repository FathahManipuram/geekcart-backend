export const WALLET_NOTIFICATION_MESSAGES = {
  TOPUP_SUCCESS: {
    title: "Wallet Top-up Successful",
    message: (amount) => `₹${amount} has been added to your wallet.`,
  },

  REFUND_CREDITED: {
    title: "Refund Credited",
    message: (amount) => `₹${amount} has been credited to your wallet.`,
  },

  REFERRAL_REWARD: {
    title: "Referral Reward",
    message: (amount) => `You've earned ₹${amount} as a referral reward.`,
  },

  ADMIN_CREDIT: {
    title: "Wallet Credited",
    message: (amount) => `₹${amount} has been credited to your wallet.`,
  },

  ADMIN_DEBIT: {
    title: "Wallet Debited",
    message: (amount) => `₹${amount} has been deducted from your wallet.`,
  },
};
