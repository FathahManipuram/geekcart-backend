import { Router } from "express";
import {
  adminLoginController,
  adminRefreshTokenController,
  forgotPasswordController,
  googleLoginController,
  loginController,
  logoutAdminController,
  logoutController,
  refreshTokenController,
  registerController,
  resendOtpController,
  resetPasswordController,
  verifyOtpController,
} from "../controllers/auth.controller.js";
import { validate } from "../../../common/middleware/validate.middleware.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validations/auth.validation.js";
const router = Router();

router.post("/register", validate(registerSchema), registerController);
router.post("/verify-otp", verifyOtpController);
router.post("/resend-otp", resendOtpController);
router.post("/login", validate(loginSchema), loginController);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPasswordController,
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPasswordController,
);
router.post("/logout", logoutController);
router.post("/refresh-token", refreshTokenController);
router.post("/google-login", googleLoginController);

router.post("/admin/login", validate(loginSchema), adminLoginController);
router.post("/admin/refresh-token", adminRefreshTokenController);
router.post("/admin/logout", logoutAdminController);

export default router;
