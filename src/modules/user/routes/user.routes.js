import {Router} from 'express'
import { changeEmailController, changePasswordController, getProfileController, updateProfileController, verifyEmailChangeController } from '../controllers/user.controller'
const router= Router()

router.get("/profile", getProfileController)
router.put("/profile", updateProfileController)

router.post("/change-email", changeEmailController)
router.post("/verify-email-change", verifyEmailChangeController)

router.put("/change-password", changePasswordController)

export default router