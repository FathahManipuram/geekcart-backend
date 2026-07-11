import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    products: [
      {
        variantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Variant",
          required: true,
        },

        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

wishlistSchema.index({ userId: 1, "products.variantId": 1 });

export const Wishlist = mongoose.model("Wishlist", wishlistSchema);
