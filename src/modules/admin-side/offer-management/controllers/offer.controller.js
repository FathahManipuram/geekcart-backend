import { HTTP_STATUS } from "../../../../common/constants/statusCode.js"
import { successResponse } from "../../../../common/helpers/response.js"
import { createOfferService, deleteOfferService, getOfferDetailsService, getOffersService, toggleOfferStatusService, updateOfferService } from "../services/offer.service.js"


//Create offer
export const createOfferController= async(req, res, next)=>{
	console.log("reqedstBody: ", req.body)
	try{
		const result= await createOfferService(req.body)
		return successResponse(res, HTTP_STATUS.CREATED, result.message, result.data)
	}catch(err){
		next(err)
	}
}


//Get offers
export const getOffersController= async(req, res, next)=>{
	try{
		const result= await getOffersService(req.query)
		return successResponse(res, HTTP_STATUS.OK, result.message, result.data)
	}catch(err){
		next(err)
	}
}

// Get offer details
export const getOfferDetailsController= async(req, res, next)=>{
	const {offerId}= req.params
	try{
		const result= await getOfferDetailsService(offerId)
		return successResponse(res, HTTP_STATUS.OK, result.message, result.data)
	}catch(err){
		next(err)
	}
}

// Update offer
export const updateOfferController= async(req, res, next)=>{
	try{
		const {offerId}= req.params
		const result= await updateOfferService(offerId, req.body)

		return successResponse(res, HTTP_STATUS.OK, result.message, result.data)
	}catch(err){
		next(err)
	}
}

//Toggle Status
export const toggleOfferStatusController = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const result = await toggleOfferStatusService(offerId);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

//Delete offer
export const deleteOfferController = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const result = await deleteOfferService(offerId);

    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (err) {
    next(err);
  }
};


