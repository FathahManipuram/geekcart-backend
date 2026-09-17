import { Router } from "express";

import authMiddleware from "../../../../common/middleware/auth.middleware.js";

import {
  getNotificationsController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  getUnreadNotificationCountController,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/", authMiddleware, getNotificationsController);

router.get(
  "/unread-count",
  authMiddleware,
  getUnreadNotificationCountController,
);

router.patch("/:id/read", authMiddleware, markNotificationAsReadController);

router.patch("/read-all", authMiddleware, markAllNotificationsAsReadController);

export default router;
