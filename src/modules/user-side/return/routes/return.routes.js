import { Router } from "express";
import authMiddleware from "../../../../common/middleware/auth.middleware.js";
import { validate } from "../../../../common/middleware/validate.middleware.js";
import { createReturnRequestSchema,} from "../validations/return.validations.js";
import { requestReturnOrderController } from "../controllers/return.controller.js";

const router= Router()

router.post("/orders/return-request", authMiddleware, validate(createReturnRequestSchema), requestReturnOrderController)

export default router