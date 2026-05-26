import { Router } from "express";
import authRoutes from "../modules/auth/routes/auth.routes.js"
import userRoutes from "../modules/user-side/user-profile/routes/user.routes.js"
import addressRoutes from "../modules/user-side/address/routes/address.routes.js"
import homeRoutes from '../modules/user-side/home/routes/home.routes.js'

//Admin
import userManagementRoutes from "../modules/admin-side/user-management/routes/user-management.routes.js"
import categoryManagementRoutes from "../modules/admin-side/category-management/routes/category.routes.js"
import subcategoryManagementRoutes from "../modules/admin-side/subcategory-management/routes/subcategory.routes.js"
import productManagementRoutes from '../modules/admin-side/product-management/routes/product.routes.js'

const router= Router()
router.use("/auth", authRoutes)
router.use("/user", userRoutes)
router.use("/account", addressRoutes)
router.use("/user/home", homeRoutes);


//Admin Routes
router.use("/admin", userManagementRoutes)
router.use("/admin/categories", categoryManagementRoutes)
router.use("/admin/subcategories", subcategoryManagementRoutes)
router.use("/admin/products", productManagementRoutes)


export default router