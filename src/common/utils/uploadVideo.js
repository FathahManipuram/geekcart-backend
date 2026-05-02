import { AppError } from "./AppError.js"
import { uploadFile } from "./uploadFile.js"


export const uploadVideo= async(file, folder="videos")=>{
	if(!file.mimetype.startsWith("video/")){
		throw new AppError("Invalid video file")
	}
	return uploadFile(file, {
		folder,
		resourceType: "video",
	})
}