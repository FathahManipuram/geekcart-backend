import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Offer name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    offerType: {
      type: String,
      enum: ["Product", "Category", "Subcategory"],
      required: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Target reference ID is required"],
      refPath: "offerType",
    },

    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [1, "Discount value must be greater than 0"],
      validate: {
        validator: function (value) {
          if (this.discountType === "PERCENTAGE" && value > 100) {
            return false;
          }
          return true;
        },
        message: "Percentage discount value cannot exceed 100%",
      },
    },

    startDate: {
      type: Date,
      required: true,
    },
    
    expiryDate: {
      type: Date,
      required: true,
    },

    maxDiscountAmount: {
      type: Number,
      default: null,
      min: [0, "Maximum discount amount cannot be negative"],
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

offerSchema.virtual("status").get(function () {
  const now = new Date();

  if (this.isDeleted) return "DELETED";

  if (!this.isActive) return "INACTIVE";

  if (this.startDate > now) return "SCHEDULED";

  if (this.expiryDate < now) return "EXPIRED";

  return "ACTIVE";
});



offerSchema.index({ targetId: 1, offerType: 1, isActive: 1, isDeleted: 1 });
offerSchema.index({ startDate: 1, expiryDate: 1 });

export const Offer= mongoose.model("Offer", offerSchema)