import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { isActive } from "../../../../common/validation/base.validation.js";
import { Order } from "../../../user-side/order/models/order.model.js";
import { Coupon } from "../models/coupon.model.js";

// Create coupon
export const createCouponService = async (payload) => {
  const existingCoupon = await Coupon.findOne({
    code: payload.code.toUpperCase(),
  });

  if (existingCoupon) {
    throw new AppError("Coupon already exists", HTTP_STATUS.CONFLICT);
  }
const startDate = new Date(payload.startDate);
startDate.setHours(0, 0, 0, 0);

const expiryDate = new Date(payload.expiryDate);
expiryDate.setHours(23, 59, 59, 999);

if (startDate > expiryDate) {
  throw new AppError(
    "Expiry date must be after start date",
    HTTP_STATUS.BAD_REQUEST,
  );
}
  const coupon = await Coupon.create({
    ...payload,
    code: payload.code.toUpperCase(),
    startDate,
    expiryDate,
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
  type,
}) => {
  const query = {
    isDeleted: false,
  };

  if (search && search.trim().length) {
    const searchRegex= {$regex: search.trim(), $options: "i"}
    query.$or = [
      {
        code: searchRegex,
      },
      {
        description: searchRegex,
      },
    ];
  }

const now = new Date();

  if (status === "ACTIVE") {
    query.isActive = true;
    query.expiryDate= {$gt: now}
  }

  if(status=== "SCHEDULED"){
    query.isActive= true
    query.startDate={$gt: now}
  }

  if(status==="EXPIRED"){
    query.isActive = true
    query.expiryDate= {$lt:now}
  }

  if (status === "INACTIVE") {
    query.isActive = false;
  }

  if(type && type!=="ALL"){
    query.discountType= type
  }

  const skip = (page - 1) * limit;


  const [coupons, totalCoupons, activeCoupon, expiredCoupon, mostUsedCoupon, givenDiscount] = await Promise.all([
    Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
      // .lean({virtuals : true}),

    Coupon.countDocuments(query),

    //active coupon
    Coupon.countDocuments({
      isActive: true,
      expiryDate:{$gt: now}
    }),

    //expired coupon
    Coupon.countDocuments({
      isActive: true,
      expiryDate: {$lt: now}
    }),

    //most usedCoupon
    Coupon.findOne({
      isDeleted: false
    }).sort({usedCount: -1}).select("code -_id"),

    //Dscount given

    Order.aggregate([
      {
        $match: {
          paymentStatus: "PAID",
          "coupon.couponId": {$ne: null}
        }
      },

      {
        $group:{
          _id: null,
          total: {
            $sum: "$coupon.discountAmount"
          }
        }
      }
    ])
  ]);

const discountGiven= givenDiscount[0].total || 0
  return {
    message: "Coupons fetched successfully",
    data: {
      coupons,
     stats:{
       totalCoupons,
      activeCoupon,
      expiredCoupon,
      mostUsedCoupon,
      discountGiven,
     },

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
  console.log("coupon data: ", payload)
  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new AppError("Coupon not found", HTTP_STATUS.NOT_FOUND);
  }

  if (payload.startDate) {
    payload.startDate = new Date(payload.startDate);

    payload.startDate.setHours(0, 0, 0, 0);
  }

  if (payload.expiryDate) {
    payload.expiryDate = new Date(payload.expiryDate);

    payload.expiryDate.setHours(23, 59, 59, 999);
  }

  const startDate = payload.startDate || coupon.startDate;

  const expiryDate = payload.expiryDate || coupon.expiryDate;

  if (startDate > expiryDate) {
    throw new AppError(
      "Expiry date must be after start date",
      HTTP_STATUS.BAD_REQUEST,
    );
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