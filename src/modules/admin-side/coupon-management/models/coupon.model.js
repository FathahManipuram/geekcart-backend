import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: [0, "Discount value cannot be negative"],
    },

    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxDiscountAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    usageLimit: {
      type: Number,
      default: null,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    perUserLimit: {
      type: Number,
      default: 1,
    },

    startDate: {
      type: Date,
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },
  },
);

couponSchema.virtual("status").get(function () {
  const now = new Date();

  if (this.isDeleted) {
    return "DELETED";
  }

  if (!this.isActive) {
    return "INACTIVE";
  }

  if (this.startDate > now) {
    return "SCHEDULED";
  }

  if (this.expiryDate < now) {
    return "EXPIRED";
  }

  return "ACTIVE";
});

couponSchema.index({
  isActive: 1,
  startDate: 1,
  expiryDate: 1,
});

export const Coupon = mongoose.model("Coupon", couponSchema);
