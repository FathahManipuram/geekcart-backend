import { Router } from "express";
import authMiddleware from "../../../../common/middleware/auth.middleware.js";
import {
  createWalletTopupOrderController,
  getWalletController,
  getWalletTransactionsController,
  verifyWalletTopupController,
} from "../controllers/wallet.controller.js";

const router = Router();

router.post(
  "/topup/create-order",
  authMiddleware,
  createWalletTopupOrderController,
);
router.post("/topup/verify", authMiddleware, verifyWalletTopupController);
router.get("/", authMiddleware, getWalletController);
router.get("/transactions", authMiddleware, getWalletTransactionsController);

export default router;
