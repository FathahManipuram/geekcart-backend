import { Router } from "express";
import { upload } from "../../../../common/middleware/upload.middleware.js";
import { validate } from "../../../../common/middleware/validate.middleware.js";
import { createProductSchema, updateProductSchema } from "../validations/product.validation.js";
import { createProductController, deleteProductController, getProductDetailsController, getProductsController, toggleProductStatusController, updateProductController } from "../controllers/product.controller.js";
import { parseProductFormData } from "../middleware/parseProductFormData.middleware.js";

const router= Router()

router.get("/", getProductsController )
router.post("/", upload.any(), parseProductFormData,validate(createProductSchema), createProductController)
router.get("/:slug", getProductDetailsController)
router.patch("/:productId", upload.any(), parseProductFormData, validate(updateProductSchema), updateProductController)
router.patch("/:productId/status", toggleProductStatusController);
router.delete("/:productId", deleteProductController);

export default router
