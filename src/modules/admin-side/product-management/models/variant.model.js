import { model, Schema, Types } from "mongoose";

const variantSchema = new Schema(
  {
    product: {
      type: Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 3;
        },
        message: "At least 3 images are required for this color variant.",
      },
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    color: { type: String, required: true, trim: true, maxlength: 50 },
    size: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 15,
    },
    price: { type: Number, required: true, min: 0 },
    salePrice: {
      type: Number,
      min: 0,
      default: null,
      validate: {
        validator(value) {
          if (value === null || value === undefined) return true;
          const currentPrice =
            this.price !== undefined ? this.price : this.get?.("price");
          if (currentPrice === undefined || currentPrice === null) return true;
          return value <= currentPrice;
        },
        message: "Sale price cannot exceed the regular retail price.",
      },
    },
    costPrice: {
      type: Number,
      min: 0,
      required: true,
      // select: false,
    },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, min: 0, default: 5 },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

variantSchema.index(
  { sku: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  },
);

variantSchema.index(
  { product: 1, color: 1, size: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

variantSchema.index({
  product: 1,
  stock: 1,
  isActive: 1,
  isDeleted: 1,
});

export const Variant = model("Variant", variantSchema);
