import mongoose from "mongoose"

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  image: {type: String},
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
},
{timestamps: true}
);

export const Subcategory= mongoose.model("Subcategory", subcategorySchema)