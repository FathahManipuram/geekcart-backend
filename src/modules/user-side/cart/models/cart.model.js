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
    name: { type: String, required: true },
    image: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    price: { type: Number, required: true },
    salePrice: { type: Number, default: null },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity cannot be less than 1"],
      default: 1,
    },
    //stock: { type: Number, default: 0 },
  },
  {
    _id: false,
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
    items: [cartItemSchema],
    summary: {
      subtotal: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      deliveryCharge: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
);


// cartSchema.pre("save", function (next) {
//   if (!this.isModified("items")) return next();

//   let subtotal = 0;
//   let totalDiscount = 0;

//   this.items.forEach((item) => {
//     const itemPrice = item.price * item.quantity;
//     const itemActualPrice = (item.salePrice ?? item.price) * item.quantity;

//     subtotal += itemPrice;
//     totalDiscount += itemPrice - itemActualPrice;
//   });

//   // Example shipping logic: Free shipping over ₹500, otherwise ₹40
//   const shippingCharge =
//     subtotal - totalDiscount > 500 || this.items.length === 0 ? 0 : 40;

//   this.summary.subtotal = subtotal;
//   this.summary.discount = totalDiscount;
//   this.summary.shippingCharge = shippingCharge;
//   this.summary.total = subtotal - totalDiscount + shippingCharge;

//   next();
// });


export const Cart = mongoose.model("Cart", cartSchema);
