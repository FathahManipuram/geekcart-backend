import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import {
  applyCouponService,
  getAvailableCouponsService,
} from "../services/userCoupon.service.js";

export const getAvailableCouponsController = async (req, res, next) => {
  try {
    const result = await getAvailableCouponsService();

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (error) {
    next(error);
  }
};

//Apply coupon
export const applyCouponController = async (req, res, next) => {
  try {
    const result = await applyCouponService({
      userId: req.user.id,
      couponCode: req.body.couponCode,
    });

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (error) {
    next(error);
  }
};
