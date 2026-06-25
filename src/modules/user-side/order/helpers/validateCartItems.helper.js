import { CHECKOUT_ISSUES } from "../../../../common/constants/checkout/checkoutIssues.js";
import { Product } from "../../../admin-side/product-management/models/product.model.js"
import { Variant } from "../../../admin-side/product-management/models/variant.model.js";

export const validateCartItems=async(cartItems)=>{
	const issues=[]

for(const item of cartItems){
const product = await Product.findOne({
  _id: item.productId,
  isActive: true,
  isDeleted: false,
});

if(!product){
	issues.push({
		type: CHECKOUT_ISSUES.PRODUCT_NOT_FOUND.code,
		productId: item.productId,
		productName: item.name,
		message: CHECKOUT_ISSUES.PRODUCT_NOT_FOUND.message,
	})
	continue
}

const variant= await Variant.findOne({
	_id: item.variantId,
	isActive: true,
	isDeleted:false,
})

if(!variant){
	issues.push({
		type: CHECKOUT_ISSUES.VARIANT_NOT_FOUND.code,
		productId: item.ProductId,
		variantId: item.variantId,
		productName: item.name,
		image: item.image,
		color: item.color,
		size: item.size,
		message: CHECKOUT_ISSUES.VARIANT_NOT_FOUND.message,
	})
	continue
}

if(variant.stock <= 0){
	issues.push({
    type: CHECKOUT_ISSUES.OUT_OF_STOCK.code,
    productId: item.productId,
    variantId: item.variantId,
    productName: item.name,
    image: item.image,
    color: item.color,
    size: item.size,
	message: CHECKOUT_ISSUES.OUT_OF_STOCK.message,
  });

continue
}


if(variant.stock < item.quantity){
	issues.push({
    type: CHECKOUT_ISSUES.INSUFFICIENT_STOCK.code,
    productId: item.productId,
    variantId: item.variantId,
    productName: item.name,
    image: item.image,
    color: item.color,
    size: item.size,
    availableStock: variant.stock,
	message: CHECKOUT_ISSUES.INSUFFICIENT_STOCK.message,
  });
  continue
}

  // const currentPrice = variant.salePrice ?? variant.price;

  // const cartPrice = item.salePrice ?? item.price;

  // if (currentPrice !== cartPrice) {
  //   issues.push({
  //     type: CHECKOUT_ISSUES.PRICE_CHANGED.code,

  //     productId: item.productId,
  //     variantId: item.variantId,

  //     productName: item.name,
  //     size: item.size,
  //     color: item.color,
  //     image: item.image,

  //     oldPrice: cartPrice,
  //     newPrice: currentPrice,
  //     message: CHECKOUT_ISSUES.PRICE_CHANGED.message,
  //   });
  // }

}

	return{
		valid: issues.length === 0,
		issues,
	}
}