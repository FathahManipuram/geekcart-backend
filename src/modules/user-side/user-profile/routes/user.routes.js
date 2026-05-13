import {Router} from 'express'
import { changeEmailController, changePasswordController, getProfileController, updateProfileController, uploadProfileImageController, verifyEmailChangeController } from '../controllers/user.controller.js'
import { upload } from '../../../../common/middleware/upload.middleware.js'
import authMiddleware from '../../../../common/middleware/auth.middleware.js'
import { changeEmailSchema, changePasswordSchema, updateProfileSchema, verifyEmailChangeSchema } from '../validations/user.validation.js'
import { validate } from '../../../../common/middleware/validate.middleware.js'

const router= Router()

router.get("/profile", authMiddleware, getProfileController)
router.patch("/profile", authMiddleware, validate(updateProfileSchema), updateProfileController)
router.patch("/change-email", authMiddleware, validate(changeEmailSchema), changeEmailController)
router.post("/verify-email-change", authMiddleware, validate(verifyEmailChangeSchema), verifyEmailChangeController)
router.post("/profile-image", authMiddleware, upload.single("image"), uploadProfileImageController)
router.put("/change-password", authMiddleware, validate(changePasswordSchema), changePasswordController)

export default router