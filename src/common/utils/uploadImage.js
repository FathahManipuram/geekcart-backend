import { HTTP_STATUS } from "../constants/statusCode"
import { AppError } from "./AppError"
import { uploadFile } from "./uploadFile"

export const uploadImage= async (file, folder= "images")=>{
	
	if(!file.mimetype.startsWith("image/")){
		throw new AppError("Invalid image file")
	}

	return uploadFile(file, {
		folder,
		resourceType: "image",
	})
}