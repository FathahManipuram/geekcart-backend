import { OTP_TYPES } from "../../../common/constants/otpTypes.js";
import { HTTP_STATUS } from "../../../common/constants/statusCode.js";
import { successResponse } from "../../../common/helpers/response.js";
import { resendOtp } from "../../../common/services/otp.service.js";
import { AppError } from "../../../common/utils/AppError.js";
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from "../../../common/utils/cookie.js";
import { generateAccessToken } from "../../../common/utils/jwt.js";
import * as authService from "../services/auth.service.js";

//Register
export const registerController = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    return successResponse(res, HTTP_STATUS.CREATED, result.message);
  } catch (err) {
    next(err);
  }
};

//Verify-OTP
export const verifyOtpController = async (req, res, next) => {
  try {
    const result = await authService.verifyOtpService(req.body);
    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (err) {
    next(err);
  }
};

//Resend OTP
export const resendOtpController = async (req, res, next) => {
  try {
    const result = await authService.resendOtpService(req.body);
    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (err) {
    next(err);
  }
};

//Login
export const loginController = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    setRefreshTokenCookie(res, result.data.refreshToken, "user");
    console.log(result);
    delete result.data.refreshToken;
    console.log(result);
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

//Forgot-Password
export const forgotPasswordController = async (req, res, next) => {
  try {
    console.log("forgotController: ", req.body);
    const result = await authService.forgotPassword(req.body);
    console.log("controlerresultforgot:", result);
    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (err) {
    next(err);
  }
};

//Reset-Password
export const resetPasswordController = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (err) {
    next(err);
  }
};

//Logout
export const logoutController = async (req, res, next) => {
  try {
    const result = await authService.logoutUserService();
    clearRefreshTokenCookie(res, "user");
    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (err) {
    next(err);
  }
};

//Logout admin
export const logoutAdminController = async (req, res, next) => {
  try {
    const result = await authService.logoutAdminService();
    clearRefreshTokenCookie(res, "admin");

    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (err) {
    next(err);
  }
};

//Refresh token
export const refreshTokenController = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.user_refreshToken;

    const result = await authService.refreshTokenService({ refreshToken });
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

//Admin refreshToken
export const adminRefreshTokenController = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.admin_refreshToken;
    const result = await authService.adminRefreshTokenService({ refreshToken });

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

// Google login

export const googleLoginController = async (req, res, next) => {
  try {
    console.log("GoogleCOntro: ", req.body);
    const { token } = req.body;
    const result = await authService.googleLoginService(token);
    console.log("ResultControGool", result);
    setRefreshTokenCookie(res, result.data.refreshToken, "user");
    delete result.data.refreshToken;

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

// Admin login
export const adminLoginController = async (req, res, next) => {
  try {
    const result = await authService.adminLoginService(req.body);

    setRefreshTokenCookie(res, result.data.refreshToken, "admin");
    delete result.data.refreshToken;
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};
