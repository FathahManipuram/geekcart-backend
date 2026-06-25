import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import {
  cancelAllOrderService,
  cancelOrderitemService,
  createOrderService,
  downloadinvoiceService,
  getAllOrdersService,
  getOrderByIdService,
} from "../services/order.service.js";

export const createOrderController = async (req, res, next) => {
  try {
    const result = await createOrderService({
      userId: req.user.id,
      ...req.body,
    });

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

// Get order by id
export const getOrderByIdController = async (req, res, next) => {
  try {
    const result = await getOrderByIdService({
      userId: req.user.id,
      orderId: req.params.orderId,
    });

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (error) {
    next(error);
  }
};

//Get all orders || get order history
export const getAllOrdersController = async (req, res, next) => {
  try {
    const result = await getAllOrdersService({userId: req.user.id, ...req.query});

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (error) {
    next(error);
  }
};



// Cancel order item
export const cancelOrderItemController= async(req, res, next)=>{
  try{
console.log(req.params, req.user.id)
    const result = await cancelOrderitemService({
      userId: req.user.id,
      orderId: req.params.orderId,
      itemId: req.params.itemId,
      reason: req.body.reason,
    });

    return successResponse(res, HTTP_STATUS.OK, result.message)
  }catch(err){
    next(err)
  }
}


// Cancel All orders
export const cancelAllOrderController = async (req, res, next) => {
  try {
    const result = await cancelAllOrderService({
      userId: req.user.id,
      orderId: req.params.orderId,
      reason: req.body.reason,
    });

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (error) {
    next(error);
  }
};


// Download invoice
export const downloadinvoiceController= async(req, res, next)=>{
  try{
    
    await downloadinvoiceService({
      orderId: req.params.orderId,
      userId: req.user.id,
      res,
    });

  } catch(err){
    next(err)
  }
}