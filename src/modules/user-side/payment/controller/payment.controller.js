import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import { createRazorpayOrderService, verifyPaymentService } from "../services/payment.service.js";

export const createRazorpayOrderController= async(req, res, next)=>{
	 try {
     const result = await createRazorpayOrderService(req.body);

     return successResponse(res, HTTP_STATUS.OK, result.message, result.data)
    
   } catch (err) {
     next(err);
   }
}

export const verifyPaymentController= async(req, res, next)=>{
  try{
    const result= await verifyPaymentService(req.body)
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data)
  }catch(err){
    next(err)
  }
}