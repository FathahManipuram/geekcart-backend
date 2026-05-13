import { Router } from "express";
import authMiddleware from "../../../../common/middleware/auth.middleware.js";
import { validate } from "../../../../common/middleware/validate.middleware.js";
import { addressIdParamSchema, createAddressSchema, updateAddressSchema } from "../validations/address.validation.js";
import { craeteAddressController, getAddressesController, removeAddressController, updateAddressController } from "../controllers/address.controller.js";
const router= Router()


router.get("/address", authMiddleware, getAddressesController)
router.post(
  "/address",
  authMiddleware,
  validate(createAddressSchema),
  craeteAddressController,
)

router.patch("/address/:addressId",
  authMiddleware,
  validate(updateAddressSchema),
  updateAddressController
)

router.delete("/address/:addressId", validate(addressIdParamSchema), authMiddleware, removeAddressController)


export default router