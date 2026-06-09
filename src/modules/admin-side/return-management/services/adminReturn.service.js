import { AppError } from "../../../../common/utils/AppError.js"
import { ReturnRequest } from "../models/return.model.js"

export const getAllReturnRequestsService= async({
	page=1,
	limit=10,
	status,
	search,

})=>{
	const query={}

	if(status && status !=="ALL"){
		query.status= status
	}

	const skip= (page-1)* limit

	const returns = await ReturnRequest.find(query)
	.populate("user", "fullName email")
	.populate("order", "orderNumber image")
	.sort({createdAt: -1})
	.skip(skip)
	.limit(limit)

	const totalItems = await ReturnRequest.countDocuments(query)

	return {
		message: "Return data fetched successfully",
		data: 
			returns,
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(totalItems/limit),
				totalItems,
			}
			
	}
}


export const updateReturnRequestStatusService= async({returnId, status})=>{
	const returnRequest= await ReturnRequest.findById(returnId)

	if(!returnRequest){
		throw new AppError("Return request not found", HTTP_STATUS.NOT_FOUND);
	}

	returnRequest.status= status
	if(status==="RETURN_COMPLETED"){
		returnRequest.resolvedAt = new Date();
	}


	await returnRequest.save()

	 return {
     message: "Return status updated successfully",
     data: returnRequest,
   };
}