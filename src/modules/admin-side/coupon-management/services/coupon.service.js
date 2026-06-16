import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { Coupon } from "../models/coupon.model.js";

// Create coupon
export const createCouponService = async (payload) => {
  const existingCoupon = await Coupon.findOne({
    code: payload.code.toUpperCase(),
  });

  if (existingCoupon) {
    throw new AppError("Coupon already exists", HTTP_STATUS.CONFLICT);
  }

  const coupon = await Coupon.create({
    ...payload,
    code: payload.code.toUpperCase(),
  });

  return {
    message: "Coupon created successfully",
    data: coupon,
  };
};

//Get all coupon
export const getCouponService = async ({
  page = 1,
  limit = 5,
  search = "",
  status,
}) => {
  const query = {
    isDeleted: false,
  };

  if (search && search.trim().length) {
    query.$or = [
      {
        code: { $regex: search, $options: "i" },
      },
      {
        description: { $regex: search, $options: "i" },
      },
    ];
  }

  if (status === "ACTIVE") {
    query.isActive = true;
  }

  if (status === "INACTIVE") {
    query.isActive = false;
  }

  const skip = (page - 1) * limit;

  const [coupons, totalCoupons] = await Promise.all([
    Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),

    Coupon.countDocuments(query),
  ]);

  return {
    message: "Coupons fetched successfully",
    data: {
      coupons,

      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCoupons / limit),
        totalItems: totalCoupons,
      },
    },
  };
};

// Update coupon
export const updateCouponService = async (couponId, payload) => {
  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new AppError("Coupon not found", HTTP_STATUS.NOT_FOUND);
  }

  Object.assign(coupon, payload);

  await coupon.save();

  return {
    message: "Coupon updated successfully",
    data: coupon,
  };
};

// Toggle status
export const toggleCouponStatusService = async (couponId) => {
  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new AppError("Coupon not found", HTTP_STATUS.NOT_FOUND);
  }

  coupon.isActive = !coupon.isActive;

  await coupon.save();

  return {
    message: "Coupon status updated",
    data: coupon,
  };
};


//  Delete coupon
export const deleteCouponService = async (couponId) => {
  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new AppError("Coupon not found", HTTP_STATUS.NOT_FOUND);
  }

  coupon.isDeleted = true;

  await coupon.save();

  return {
    message: "Coupon deleted successfully",
  };
};

// Get coupon details
export const getCouponDetailsService= async(couponId)=>{
	const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new AppError("Coupon not found", HTTP_STATUS.NOT_FOUND);
  }

  return{
	message: "Coupon details fetched successsfully",
	data: coupon,
  }
}