import { Router } from "express";
import { addToCartSchema } from "../validations/cart.validation";
import { addToCartController, getCartController } from "../controllers/cart.controller";

const router= Router()

router.post("/", validate(addToCartSchema), addToCartController)
router.get("/", getCartController)

export default router