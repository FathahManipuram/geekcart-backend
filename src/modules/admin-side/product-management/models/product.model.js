import { model, Schema, Types } from "mongoose"

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, required: true, trim: true },
    category: {
      type: Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    subcategory: {
      type: Types.ObjectId,
      ref: "Subcategory",
      required: true,
      index: true,
    },
    manufacturer: {
      name: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
      phone: { type: String, trim: true, default: "" },
    },
    coverImage: { type: String, default: "", trim: true },
    isReturnable: { type: Boolean, default: true },
    returnWindowDays: {
      type: Number,
      default: 7,
      min: 1,
    },
    sleeve: { type: String, trim: true, maxlength: 50, default: "" },
    fabric: { type: String, trim: true, maxlength: 50, default: "" },
    isFeatured: { type: Boolean, default: false, index: true },
    isLimited: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

productSchema.index({
  category: 1,
  subcategory: 1,
  sleeve: 1,
  fabric: 1,
  isActive: 1,
  isDeleted: 1,
});

productSchema.index({
	name: "text",
	description: "text",
})

export const Product = model("Product", productSchema)