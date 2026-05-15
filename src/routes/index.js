import { Router } from "express";
import authRoutes from "../modules/auth/routes/auth.routes.js"
import userRoutes from "../modules/user-side/user-profile/routes/user.routes.js"
import addressRoutes from "../modules/user-side/address/routes/address.routes.js"


//Admin
import userManagementRoutes from "../modules/admin-side/user-management/routes/user-management.routes.js"
import categoryManagementRoutes from "../modules/admin-side/category-management/routes/category.routes.js"


const router= Router()
router.use("/auth", authRoutes)
router.use("/user", userRoutes)
router.use("/account", addressRoutes)



//Admin Routes
router.use("/admin", userManagementRoutes)
router.use("/admin/categories", categoryManagementRoutes)
export default router