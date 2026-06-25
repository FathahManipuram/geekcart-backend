import { Coupon } from "../../../admin-side/coupon-management/models/coupon.model.js";
import { applyOffersToCartItems } from "../../cart/helpers/applyOffersToCartItems.helper.js";
import { calculateCartSummary } from "../../cart/helpers/cart.helper.js";
import { calculateCouponDiscount } from "../../coupon/helper/calculateCouponDiscount.helper.js";
import { validateCoupon } from "../../coupon/helper/validateCoupon.helper.js";
import { getActiveOffers } from "../../offer/helpers/getActiveOffers.helper.js";

export const calculateCheckoutSummary = async ({
  userId,
 cart,
deliveryMethod,
  couponId,
  session
}) => {
  
    const offers = await getActiveOffers()
      const recalculatedItems = applyOffersToCartItems({
        items: cart.items,
        offers,
      });

  const speedCharge = deliveryMethod === "EXPRESS" ? 25 : 0;

  const { subtotal, discount, shippingCharge, deliveryCharge, total } =
    calculateCartSummary(recalculatedItems, speedCharge);

  let couponDiscount = 0;
  let couponSnapshot = null;

  if (couponId) {
    const coupon = await Coupon.findById(couponId, null, { session });

    // await validateCoupon({
    //   userId,
    //   coupon,
    //   subtotal: total,
    // });


     if (coupon) {
       couponDiscount = calculateCouponDiscount({
         coupon,
         subtotal: total,
       });

       couponSnapshot = {
         couponId: coupon._id,
         code: coupon.code,
         discountAmount: couponDiscount,
       };
     }
  }

  const finalTotal = Math.max(0, total - couponDiscount);

  return {
    recalculatedItems,
    subtotal,
    discount,
    shippingCharge,
    deliveryCharge,
    speedCharge,
    couponDiscount,
    couponSnapshot,
    finalTotal,
  };
};
