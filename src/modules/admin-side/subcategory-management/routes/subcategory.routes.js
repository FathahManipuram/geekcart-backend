import { Router } from "express";
import { validate } from "../../../../common/middleware/validate.middleware.js";
import { createSubcategorySchema, updateSubcategorySchema } from "../validation/subcategory.validation.js";
import { createSubcategoryController, deleteSubcategoryController, fetchSubcategoriesController, updateSubcategoryController } from "../controllers/subcategory.controller.js";
import { upload } from "../../../../common/middleware/upload.middleware.js";

const router= Router()

router.post("/", upload.single("image"), validate(createSubcategorySchema), createSubcategoryController)
router.get("/", fetchSubcategoriesController)
router.patch("/:subcategoryId", upload.single("image"), validate(updateSubcategorySchema), updateSubcategoryController)
router.delete("/:subcategoryId", deleteSubcategoryController)

export default router