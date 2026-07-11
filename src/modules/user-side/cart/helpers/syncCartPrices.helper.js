import { calculateBestOffer } from "../../offer/helpers/calculateBestOffer.helper.js";

export const syncCartPricesAndOffers = async (cart, offers) => {
  if (!cart?.items?.length) return { changes: [] };

  let hasChanges = false;
  const changes = [];

  for (const item of cart.items) {
    const variant = item.variantId;
    if (!variant || variant.isDeleted) continue;

    const oldSalePrice = item.salePrice ?? item.price;

    // Calculate latest offer
    const offer = calculateBestOffer({
      product: item.productId,
      offers,
      price: variant.price,
    });

    const isPriceDifferent = Number(item.price) !== Number(variant.price);
    const isSalePriceDifferent =
      Number(item.salePrice).toFixed(2) !== Number(offer.salePrice).toFixed(2);
    const isDiscountDifferent =
      Number(item.discountAmount).toFixed(2) !==
      Number(offer.discount).toFixed(2);

    if (isPriceDifferent || isSalePriceDifferent || isDiscountDifferent) {
      hasChanges = true;

      changes.push({
        type: "PRICE_CHANGED",
        productId: item.productId._id,
        variantId: variant._id,
        productName: item.productId.name, // Make sure name is pulled correctly
        oldPrice: oldSalePrice,
        newPrice: offer.salePrice,
      });
    }

    item.price = variant.price;
    item.salePrice = offer.salePrice;
    item.discountAmount = offer.discount;
    item.appliedOffer = offer.appliedOffer;
  }

  if (hasChanges) {
    cart.markModified("items");
    await cart.save();
  }

  return { changes };
};
