import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import {
  createCouponService,
  deleteCouponService,
  getCouponDetailsService,
  getCouponService,
  toggleCouponStatusService,
  updateCouponService,
} from "../services/coupon.service.js";

// Create coupon
export const createCouponController = async (req, res, next) => {
  try {
    const result = await createCouponService(req.body);

    return successResponse(
      res,
      HTTP_STATUS.CREATED,
      result.message,
      result.data,
    );
  } catch (err) {
    next(err);
  }
};

//get coupon
export const getCouponController = async (req, res, next) => {
  try {
    const result = await getCouponService(req.query);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

// update coupon
export const updateCouponController = async (req, res, next) => {
  try {
    const { couponId } = req.params;
    const result = await updateCouponService(couponId, req.body);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

//Toggle status
export const toggleCouponStatusController = async (req, res, next) => {
  try {
    const { couponId } = req.params;
    const result = await toggleCouponStatusService(couponId);
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

// Delete coupon
export const DeleteCouponController = async (req, res, next) => {
  try {
    const { couponId } = req.params;
    const result = await deleteCouponService(couponId);
    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (err) {
    next(err);
  }
};

// Get coupon deatails
export const getCouponDetailsController = async (req, res, next) => {
  try {
    const { couponId } = req.params;
    const result = await getCouponDetailsService(couponId);
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};
