import mongoose from "mongoose";
import { RETURN_REQUEST_STATUSES } from "../../../../common/constants/adminReturn/returnStatusList.js";

const formatCurrency = (val) => Number(val.toFixed(2));
const returnRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    orderItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    itemSnapshot: {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      image: { type: String, required: true },
      size: String,
      color: String,
      priceAtPurchase: { type: Number, required: true, set: formatCurrency },
    },

    reason: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(RETURN_REQUEST_STATUSES),
      default: "RETURN_PENDING",
      index: true,
    },

    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(RETURN_REQUEST_STATUSES),
          required: true,
        },
        updatedAt: { type: Date, default: Date.now },
        updatedBy: {
          type: String,
          enum: ["USER", "ADMIN", "SYSTEM"],
          default: "SYSTEM",
        },
        // adminNote: String,
      },
    ],

    refundAmount: {
      type: Number,
      default: 0,
    },
    refundStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED"],
      default: "PENDING",
    },

    adminNote: String,

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    resolvedAt: Date,
  },
  {
    timestamps: true,
  },
);


returnRequestSchema.index({
  status: 1,
  requestedAt: -1,
});
export const ReturnRequest = mongoose.model(
  "ReturnRequest",
  returnRequestSchema,
);