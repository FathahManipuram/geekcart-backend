import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { emitNotification } from "../../../../socket/socket.service.js";
import Notification from "../model/notificationSchema.js"

export const createNotificationService = async ({
  userId,
  title,
  message,
  type = "GENERAL",
  referenceId = null,
  referenceModel = null,
  metadata = {},
}) => {
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    referenceId,
    referenceModel,
    metadata,
  });

  emitNotification(userId, notification);

  return {
    message: "Notification created successfully",

    data: notification,
  };
};

export const getNotificationsService = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({
    user: userId,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalNotifications = await Notification.countDocuments({
    user: userId,
  });

  return {
    message: "Notifications fetched successfully",

    data: {
      notifications,
      pagination: {
        totalNotifications,
        currentPage: page,
        totalPages: Math.ceil(totalNotifications / limit),
        limit,
      },
    },
  };
};

export const markNotificationAsReadService = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      user: userId,
    },
    {
      isRead: true,
    },
    {
      new: true,
    },
  );

  if (!notification) {
    throw new AppError("Notification not found", HTTP_STATUS.NOT_FOUND);
  }

  return {
    message: "Notification marked as read",

    data: notification,
  };
};

export const markAllNotificationsAsReadService = async (userId) => {
  await Notification.updateMany(
    {
      user: userId,
      isRead: false,
    },
    {
      isRead: true,
    },
  );

  return {
    message: "All notifications marked as read",

    data: null,
  };
};


export const getUnreadNotificationCountService = async (userId) => {
  const unreadCount = await Notification.countDocuments({
    user: userId,
    isRead: false,
  });

  return {
    message: "Unread notification count fetched successfully",

    data: {
      unreadCount,
    },
  };
};


