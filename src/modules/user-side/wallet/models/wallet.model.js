import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, "Wallet balance cannot be negative"],
      set: (val) => Math.round(val * 100) / 100,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export const Wallet = mongoose.model("Wallet", walletSchema);
