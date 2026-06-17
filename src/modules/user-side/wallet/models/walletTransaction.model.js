import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Transaction amount must be greater than zero"],
      set: (val) => Math.round(val * 100) / 100, 
    },
    reason: {
      type: String,
      enum: [
        "ADD_MONEY",
        "RETURN_REFUND",
        "ORDER_CANCELLED",
        "ITEM_CANCELLED",
        "REFERRAL_BONUS",
        "CASHBACK",
        "ORDER_PAYMENT",
        "ADMIN_CREDIT",
        "ADMIN_DEBIT",
      ],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    balanceAfterTransaction: {
      type: Number,
      required: true,
      min: [0, "Historical balance snapshot cannot be negative"],
      set: (val) => Math.round(val * 100) / 100,
    },
    
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);


walletTransactionSchema.index({
  user: 1,
  createdAt: -1,
});

walletTransactionSchema.index({
  wallet: 1,
  createdAt: -1,
});

walletTransactionSchema.index({
  reason: 1,
});

walletTransactionSchema.index({
  referenceId: 1,
});

export const WalletTransaction = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema,
);
