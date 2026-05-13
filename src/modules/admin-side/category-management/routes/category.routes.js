import { Router } from "express";
import { validate } from "../../../../common/middleware/validate.middleware";
import { createCategorySchema } from "../validations/category.validation";
import { createCategoryController } from "../controllers/category.controller";


const router= Router()

router.post("/category/create", validate(createCategorySchema), createCategoryController)