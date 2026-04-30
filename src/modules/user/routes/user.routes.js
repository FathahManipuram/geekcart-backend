import {Router} from 'express'
import { changeEmailController, changePasswordController, getProfileController, updateProfileController, verifyEmailChangeController } from '../controllers/user.controller'
import authMiddleware from '../../../common/middleware/auth.middleware'
const router= Router()

router.get("/profile", authMiddleware, getProfileController)
router.put("/profile", authMiddleware, updateProfileController)

router.post("/change-email", authMiddleware, changeEmailController)
router.post("/verify-email-change", authMiddleware, verifyEmailChangeController)

router.put("/change-password", authMiddleware, changePasswordController)

export default router