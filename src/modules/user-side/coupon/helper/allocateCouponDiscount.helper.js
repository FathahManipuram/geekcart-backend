
export const allocateCouponDiscount = ({
  items = [],
  totalCouponDiscount = 0,
}) => {
  if (!items.length || totalCouponDiscount <= 0) {
    return items.map((item) => ({
      ...item,
      couponDiscount: 0,
    }));
  }

  const effectiveSubtotal = items.reduce((sum, item) => {
    return sum + (item.salePrice ?? item.price) * item.quantity;
  }, 0);

  if (effectiveSubtotal === 0) {
    return items.map((item) => ({
      ...item,
      couponDiscount: 0,
    }));
  }

  let allocated = 0;

  return items.map((item, index) => {
    let couponDiscount = 0;

    if (index === items.length - 1) {
      couponDiscount = Number((totalCouponDiscount - allocated).toFixed(2));
    } else {
      couponDiscount = Number(
        (
          (((item.salePrice ?? item.price) * item.quantity) /
            effectiveSubtotal) *
          totalCouponDiscount
        ).toFixed(2),
      );

      allocated += couponDiscount;
    }

    return {
      ...item,
      couponDiscount,
    };
  });
};
