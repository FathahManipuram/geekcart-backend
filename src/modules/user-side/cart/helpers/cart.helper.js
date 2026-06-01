export const calculateCartSummury= (items=[])=>{
	let subtotal= 0;
	let discount= 0;

	items.forEach((item)=>{
		const OriginalPrice= item.price* item.quantity
		const finalPrice = (item.salePrice || item.price)* item.quantity

		subtotal += OriginalPrice
		discount += OriginalPrice - finalPrice
	})


	const shippingCharge = subtotal - discount > 500 || items.length === 0 ? 0 : 40

	const total = subtotal + shippingCharge

	return {
		subtotal,
		discount,
		shippingCharge,
		total,
	}
}