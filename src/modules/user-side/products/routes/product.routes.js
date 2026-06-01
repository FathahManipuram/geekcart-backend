import { Router } from "express"
import { getProductDetailsController, getSimilarProductsController } from "../controllers/product.controllers.js"


const router= Router()


router.get("/:slug", getProductDetailsController)
router.get("/:slug/similar", getSimilarProductsController)

export default router