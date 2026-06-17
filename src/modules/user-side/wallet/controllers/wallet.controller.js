import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import { createWalletTopupOrderService, getWalletService, getWalletTransactionsService, verifyWalletTopupService } from "../services/wallet.service.js";


// Create wallet topup
export const createWalletTopupOrderController = async (req, res, next) => {
  try {
    const { amount } = req.body;

    const result = await createWalletTopupOrderService(req.user.id, amount);

    return successResponse(
      res,
      HTTP_STATUS.CREATED,
      result.message,
      result.data,
    );
  } catch (error) {
    next(error);
  }
};

//Verify wallet topup
export const verifyWalletTopupController = async (req, res, next) => {
  try {
    const result = await verifyWalletTopupService(req.body);

    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (error) {
    next(error);
  }
};


//Get wallet
export const getWalletController = async (req, res, next) => {
  try {
    const result = await getWalletService(req.user.id);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (error) {
    next(error);
  }
};

//Get wallet transaction
export const getWalletTransactionsController = async (req, res, next) => {
  try {
    const result = await getWalletTransactionsService(req.user.id, req.query);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (error) {
    next(error);
  }
};
