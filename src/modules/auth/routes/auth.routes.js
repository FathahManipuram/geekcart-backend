import { Router } from "express";
import { forgotPasswordController, googleLoginController, loginController, logoutController, refreshTokenController, registerController, resendOtpController, resetPasswordController, verifyEmailController } from "../controllers/auth.controller.js";
const router= Router()


router.post("/register", registerController)
router.post("/verify-email", verifyEmailController)
router.post("/resend-otp",resendOtpController)
router.post("/login", loginController)
router.post("/forgot-password", forgotPasswordController)
router.put("/reset-password", resetPasswordController)
router.post("/logout", logoutController)
router.post("/refresh-token", refreshTokenController)
router.post("/google-login", googleLoginController)

export default router