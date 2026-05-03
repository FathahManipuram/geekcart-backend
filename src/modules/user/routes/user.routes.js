import {Router} from 'express'
import { changeEmailController, changePasswordController, getProfileController, updateProfileController, uploadProfileImageController, verifyEmailChangeController } from '../controllers/user.controller.js'
import authMiddleware from '../../../common/middleware/auth.middleware.js'
import { upload } from '../../../common/middleware/upload.middleware.js'
const router= Router()

router.get("/profile", authMiddleware, getProfileController)
router.put("/profile", authMiddleware, updateProfileController)
router.post("/change-email", authMiddleware, changeEmailController)
router.post("/verify-email-change", authMiddleware, verifyEmailChangeController)
router.post("/profile-image", authMiddleware,upload.single("image"), uploadProfileImageController)
router.put("/change-password", authMiddleware, changePasswordController)

export default router