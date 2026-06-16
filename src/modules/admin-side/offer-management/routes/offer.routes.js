import { Router } from "express";
import { createOfferController, deleteOfferController, getOfferDetailsController, getOffersController, toggleOfferStatusController, updateOfferController } from "../controllers/offer.controller.js";

const router= Router()

router.post("/", createOfferController)
router.get("/", getOffersController)
router.get("/:offerId", getOfferDetailsController)
router.patch("/:offerId", updateOfferController)
router.patch(`/:offerId/status`, toggleOfferStatusController)
router.delete("/:offerId", deleteOfferController)

export default router
