import { v2 as cloudinary } from "cloudinary";
import { HTTP_STATUS } from "../constants/statusCode.js";
import { AppError } from "./AppError.js";

export const deleteImageFromCloudinary = async (imageUrl = "") => {
  if (!imageUrl) return null;

  try {
    const urlParts = imageUrl.split("/upload/");
    if (urlParts.length < 2) {
      throw new AppError("Invalid cloudinary URL", HTTP_STATUS.BAD_REQUEST);
    }
    const pathWithVersion = urlParts[1];
    const publicIdWithExtension = pathWithVersion.replace(/^v\d+\//, "");
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, "");

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (err) {
    console.error("Cloudinary deletion failed: ", err.message);
    return null;
  }
};
