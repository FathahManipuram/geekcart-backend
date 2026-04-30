import cloudinary from "../../infrastructure/services/cloudinary.js"
export const uploadImage= async(file, folderName="general")=>{
	return new Promise((resolve, reject)=>{
		cloudinary.uploader.upload_stream(
			{folder: `geekcart/${folderName}`},

			(error, result)=>{
				if(error) return reject(error)
				resolve(result)
			}
		).end(file.buffer)
	})
}