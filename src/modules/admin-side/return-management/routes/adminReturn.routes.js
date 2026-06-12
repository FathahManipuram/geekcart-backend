import { Router } from "express";
import { getAllReturnRequestsController, getReturnRequestDetailsController, updateReturnRequestStatusController } from "../controllers/adminReturn.controller.js";

const router= Router()

router.get("/", getAllReturnRequestsController)
router.patch("/:returnId/status", updateReturnRequestStatusController)
router.get("/:returnId", getReturnRequestDetailsController)
export default router