import mongoose from "mongoose";


const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity cannot be less than 1"],
      default: 1,
    },
    priceSnapshot: {
      type: Number,
      required: true,
      min: [0, "Price snapshot cannot be negative"],
    },
  },
  {
    _id: true,
  },
);


const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, 
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    summary: {
      subtotal: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      discount: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);


cartSchema.index({ userId: 1 });

export const Cart = mongoose.model("Cart", cartSchema);
