import { AppError } from "./AppError"
import { uploadFile } from "./uploadFile"


export const uploadVideo= async(file, folder="videos")=>{
	if(!file.mimetype.startsWith("video/")){
		throw new AppError("Invalid video file")
	}
	return uploadFile(file, {
		folder,
		resourceType: "video",
	})
}