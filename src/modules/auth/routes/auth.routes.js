import { Router } from "express";
import { forgotPasswordController, googleLoginController, loginController, logoutController, refreshTokenController, registerController, resendOtpController, resetPasswordController, verifyOtpController, } from "../controllers/auth.controller.js";
import { validate } from "../../../common/middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../validations/auth.validation.js";
const router= Router()


router.post("/register", validate(registerSchema), registerController)
router.post("/verify-otp", verifyOtpController)
router.post("/resend-otp",resendOtpController)
router.post("/login", validate(loginSchema),loginController)
router.post("/forgot-password", forgotPasswordController)
router.post("/reset-password", resetPasswordController)
router.post("/logout", logoutController)
router.post("/refresh-token", refreshTokenController)
router.post("/google-login", googleLoginController)

export default router