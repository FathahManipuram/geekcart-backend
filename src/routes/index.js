import { Router } from "express";
import authRoutes from "../modules/auth/routes/auth.routes.js"
import userRoutes from "../modules/user-side/user-profile/routes/user.routes.js"
import addressRoutes from "../modules/user-side/address/routes/address.routes.js"
const router= Router()
router.use("/auth", authRoutes)
router.use("/user", userRoutes)
router.use("/account", addressRoutes)


export default router