import { Router } from "express";
import { addToCartSchema } from "../validations/cart.validation.js";
import { addToCartController, clearCartController, getCartController, removeCartItemController, updateCartQuantityController } from "../controllers/cart.controller.js";
import { validate } from "../../../../common/middleware/validate.middleware.js";
import authMiddleware from "../../../../common/middleware/auth.middleware.js";

const router= Router()

router.post("/",authMiddleware, validate(addToCartSchema), addToCartController)
router.get("/", authMiddleware, getCartController)
router.patch("/:variantId", authMiddleware, updateCartQuantityController)
router.delete("/:variantId", authMiddleware, removeCartItemController);
router.delete("/clear/all", authMiddleware, clearCartController);

export default router