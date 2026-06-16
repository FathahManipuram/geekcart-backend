import mongoose from "mongoose"

const addressSchema= new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
		index: true,
	},

	fullName: {
    type: String,
    required: true,
    trim: true,
  },

  phoneNumber: {
    type: String,
    required: true,
  },

  addressLine: {
    type: String,
    required: true,
  },

  landmark: {
    type: String,
  },

  city: {
    type: String,
    required: true,
  },

  state: {
    type: String,
    required: true,
  },

  country: {
    type: String,
    required: true,
    default: "India",
  },

  pincode: {
    type: String,
    required: true,
  },

  addressLabel: {
    type: String,
    enum: ["Home", "Work", "Other"],
    default: "Home",
  },

  isDefault: {
    type: Boolean,
    default: false,
  },

},
{timestamps: true}
)

export const Address= mongoose.model("Address", addressSchema)