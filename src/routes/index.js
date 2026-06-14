import { Router } from "express";
import authRoutes from "../modules/auth/routes/auth.routes.js"
import userRoutes from "../modules/user-side/user-profile/routes/user.routes.js"
import addressRoutes from "../modules/user-side/address/routes/address.routes.js"
import homeRoutes from '../modules/user-side/home/routes/home.routes.js'
import cartRoutes from '../modules/user-side/cart/routes/cart.routes.js'
import collectionsRoutes from "../modules/user-side/collections/routes/collections.routes.js"
import productsRoutes from "../modules/user-side/products/routes/product.routes.js"
import wishlistRoutes from "../modules/user-side/wishlist/routes/wishlist.routes.js"
import checkoutRoutes from "../modules/user-side/checkout/routes/checkout.routes.js"
import orderRoutes from "../modules/user-side/order/routes/order.routes.js"
import returnRoutes from "../modules/user-side/return/routes/return.routes.js"
import paymentRoutes from "../modules/user-side/payment/routes/payment.routes.js"

//Admin
import userManagementRoutes from "../modules/admin-side/user-management/routes/user-management.routes.js"
import categoryManagementRoutes from "../modules/admin-side/category-management/routes/category.routes.js"
import subcategoryManagementRoutes from "../modules/admin-side/subcategory-management/routes/subcategory.routes.js"
import productManagementRoutes from '../modules/admin-side/product-management/routes/product.routes.js'
import dashboardRoutes from "../modules/admin-side/dashboard/routes/dashboard.routes.js"
import orderManagementRoutes from "../modules/admin-side/order-management/routes/adminOrder.routes.js"
import returnManagementRoutes from "../modules/admin-side/return-management/routes/adminReturn.routes.js"

const router= Router()
router.use("/auth", authRoutes)
router.use("/user", userRoutes)
router.use("/account", addressRoutes)
router.use("/user/home", homeRoutes)
router.use("/cart", cartRoutes)
router.use("/collections", collectionsRoutes)
router.use("/products", productsRoutes)
router.use("/wishlist", wishlistRoutes)
router.use("/checkout", checkoutRoutes)
router.use("/orders", orderRoutes)
router.use("/return", returnRoutes)
router.use("/payments", paymentRoutes)


//Admin Routes
router.use("/admin", userManagementRoutes)
router.use("/admin/categories", categoryManagementRoutes)
router.use("/admin/subcategories", subcategoryManagementRoutes)
router.use("/admin/products", productManagementRoutes)
router.use("/admin/dashboard", dashboardRoutes)
router.use("/admin/orders", orderManagementRoutes)
router.use("/admin/returns", returnManagementRoutes)


export default router