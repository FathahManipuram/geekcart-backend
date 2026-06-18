import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      select: false,
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    phoneNumber: { type: String, trim: true },
    avatar: {
      type: String,
      default: function () {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.fullName)}&background=random`;
      },
    },
    isBlocked: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    gender: { type: String, enum: ["male", "female"], default: null },
    dateOfBirth: { type: Date },
    googleId: { type: String, unique: true, sparse: true },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    lastLoginAt: { type: Date },

    referralCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    referralBonusProcessed: {
      type: Boolean,
      default: false,
    },
    referralCount: {
      type: Number,
      default: 0,
    },
	
    totalReferralEarnings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export const User= mongoose.model("User", userSchema)