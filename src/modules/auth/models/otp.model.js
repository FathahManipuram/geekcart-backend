import mongoose from "mongoose"
import User from "../../user/models/user.model.js"

const otpSchema= new mongoose.Schema({
	userId:{type: mongoose.Schema.Types.ObjectId, ref:"USer"},
	email: {type: String},
	otp:{type: String, required:true},
	type:{type: String, 
		enum:["email-verify", "password-reset"],
		required: true,
	},

	attemptCount: {type: Number, default:0},
	maxAttempt: {type: Number, default:5},

	expiresAt: {type: Date, require:true},
},
{Timestamp: true}
);


otpSchema.index({expiresAt: 1}, {expireAfterSeconds:0})
export default mongoose.model("Otp", otpSchema)