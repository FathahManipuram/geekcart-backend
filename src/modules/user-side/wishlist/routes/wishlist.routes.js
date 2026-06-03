import { Router } from "express";
import authMiddleware from "../../../../common/middleware/auth.middleware.js";
import { addToWishlistController, getWishlistController, removeWishlistController } from "../controllers/wishlist.controller.js";

const router = Router();

router.post("/", authMiddleware, addToWishlistController);

router.get("/", authMiddleware, getWishlistController);

router.delete("/:variantId", authMiddleware, removeWishlistController);

export default router