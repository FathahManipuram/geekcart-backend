import { Order } from "../../order/models/order.model.js"

export const getCouponUsageByUser= async({
	userId, couponId
})=>{
	return await Order.countDocuments({
		user: userId,
		"coupon.couponId": couponId,
		orderStatus:{
			$ne: "CANCELLED"
		}

	})
}