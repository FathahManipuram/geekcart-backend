import mongoose from "mongoose";
import { ORDER_STATUSES } from "../../../../common/constants/order/orderStatus.js";
import { MODEL_ITEM_STATUSES, MODEL_ORDER_STATUSES } from "../../../../common/constants/order/model.constants.js";



const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    size: String,
    color: String,
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity cannot be less than 1"],
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    salePrice: {
      type: Number,
      default: null,
    },

    itemStatus: {
      type: String,
      enum: MODEL_ITEM_STATUSES,
      default: "PLACED",
    },

    itemStatusHistory: [
      {
        status: {
          type: String,
          enum: MODEL_ITEM_STATUSES,
          required: true,
        },

        updatedAt: {
          type: Date,
          default: Date.now,
        },

        updatedBy: {
          type: String,
          enum: ["USER", "ADMIN", "SYSTEM"],
          default: "SYSTEM",
        },
      },
    ],

    cancellation: {
      reason: String,
      cancelledAt: Date,
      cancelledBy: { type: String, enum: ["USER", "ADMIN", "SYSTEM"] },
    },

    returnRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReturnRequest",
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
  },
  { _id: true },
);



const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `GC-ODR-${Date.now().toString(36)}-${Math.floor(1000 + Math.random() * 9000)}`.toUpperCase(),
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: [orderItemSchema],

    shippingAddress: {
      fullName: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      addressLine: { type: String, required: true },
      landmark: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, required: true },
      addressLabel: { type: String, required: true },
    },

    deliveryMethod: {
      type: String,
      enum: ["STANDARD", "EXPRESS"],
      default: "STANDARD",
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "RAZORPAY"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "PENDING",
        "PAID",
        "FAILED",
        "PARTIALLY_REFUNDED",
        "FULLY_REFUNDED",
      ],
      default: "PENDING",
      index: true,
    },

    paymentDetails: {
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      razorpaySignature: { type: String },
      paidAt: { type: Date },
    },

    orderStatus: {
      type: String,
      enum: MODEL_ORDER_STATUSES,

      default: "PLACED",
      index: true,
    },

    expectedDeliveryDate: Date,

    statusHistory: [
      {
        status: {
          type: String,
          enum: MODEL_ORDER_STATUSES,
          required: true,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: String,
          enum: ["USER", "ADMIN", "SYSTEM"],
          default: "SYSTEM",
        },
      },
    ],


    

    subtotal: { type: Number, required: true, min: 0 },
    speedCharge: { type: Number, default: 0 },
    shippingCharge: { type: Number, required: true, default: 0, min: 0 },
    deliveryCharge: { type: Number, default: 0 },
    tax: { type: Number, required: true, default: 0, min: 0 },
    discount: { type: Number, required: true, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  {
    timestamps: true,
  },
);


orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);
