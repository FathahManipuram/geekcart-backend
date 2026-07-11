import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: { type: String, required: true },
    otp: { type: String, required: true },
    type: {
      type: String,
      enum: ["email-verify", "password-reset", "email-change"],
      required: true,
    },
    payload: { type: Object, default: {} },
    meta: {
      type: Object,
      default: {},
    },
    attemptCount: { type: Number, default: 0 },
    maxAttempt: { type: Number, default: 5 },

    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("Otp", otpSchema);
