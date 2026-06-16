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
      enum: ["PRODUCT", "CATEGORY", "SUBCATEGORY"],
      required: true,
    },

    applicableProducts: 
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null,
      },
    

    applicableCategories: 
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null,
      },
    

    applicableSubcategories: 
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subcategory",
        default: null,
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

    startDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },

    usageCount: {
      type: Number,
      default: 0,
    },

    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be negative"],
    },

    maxDiscountAmount: {
      type: Number,
      default: null,
      min: [0, "Maximum discount amount cannot be negative"],
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "EXPIRED"],
      default: "ACTIVE",
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
  },
);

offerSchema.index({ offerType: 1, isActive: 1, isDeleted: 1 });
offerSchema.index({ startDate: 1, expiryDate: 1 });

export const Offer= mongoose.model("Offer", offerSchema)