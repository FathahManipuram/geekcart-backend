import { razorpay } from "../../../../config/razorpay.config.js"
import crypto from "crypto"

export const createRazorpayOrderService= async({amount})=>{
	const options= {
		amount: amount * 100,
		currency: "INR",
		receipt: `receipt_${Date.now()}`,
	}

	const order= await razorpay.orders.create(options)
console.log("Craete razore pay order: ", order)
	return {
		message:"sucess",
		data: order
	}
}

export const verifyPaymentService= async({
	razorpay_order_id,
	razorpay_payment_id,
	razorpay_signature,
})=> {
	const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

	const isValid= generatedSignature === razorpay_signature

	 if (!isValid) {
     throw new AppError("Payment verification failed", HTTP_STATUS.BAD_REQUEST);
   }

   return {
	message: true,
	data:{
		verified: true,
	}
   }
}
