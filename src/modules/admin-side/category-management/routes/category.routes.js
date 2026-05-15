import { Router } from "express";
import { validate } from "../../../../common/middleware/validate.middleware.js";
import { createCategorySchema, updateCategorySchema } from "../validations/category.validation.js";
import { createCategoryController, deleteCategoryController, fetchCategoriesController, updateCategoriesController } from "../controllers/category.controller.js";


const router= Router()

router.get("/", fetchCategoriesController)
router.post("/", validate(createCategorySchema), createCategoryController)
router.patch("/:categoryId", validate(updateCategorySchema), updateCategoriesController)
router.delete("/:categoryId", deleteCategoryController)


export default router