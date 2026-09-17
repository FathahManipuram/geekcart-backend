import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";

import {
  getNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  getUnreadNotificationCountService,
} from "../services/notification.service.js";

export const getNotificationsController = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await getNotificationsService(req.user.id, page, limit);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsReadController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await markNotificationAsReadService(id, req.user.id);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsReadController = async (req, res, next) => {
  try {
    const result = await markAllNotificationsAsReadService(req.user.id);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (error) {
    next(error);
  }
};

export const getUnreadNotificationCountController = async (req, res, next) => {
  try {
    const result = await getUnreadNotificationCountService(req.user.id);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (error) {
    next(error);
  }
};
