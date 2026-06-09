import { Router } from "express";
import { getAllReturnRequestsController, updateReturnRequestStatusController } from "../controllers/adminReturn.controller.js";

const router= Router()

router.get("/", getAllReturnRequestsController)
router.patch("/:returnId/status", updateReturnRequestStatusController)

export default router