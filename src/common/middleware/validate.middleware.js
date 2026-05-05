import { HTTP_STATUS } from "../constants/statusCode.js"
import { successResponse } from "../helpers/response.js"

export const validate = (schema)=>(req, res, next)=>{
 const {error, value}= schema.validate(req.body, {
	abortEarly: false,
	stripUnknown: true,
})

if(error){
	const errorMesage=  error.details.map((e)=> e.message).join(", ")
	return successResponse(
		res,
		HTTP_STATUS.BAD_REQUEST,
		errorMesage,
	)
}

req.body= value;
next()

}