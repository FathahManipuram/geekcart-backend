import cloudinary from "../../infrastructure/services/cloudinary.js";
import { HTTP_STATUS } from "../constants/statusCode.js";
import { AppError } from "./AppError.js";

export const uploadFile = async (
  file,
  { folder = "general", resourceType = "auto" },
) => {
  if (!file) {
    throw new AppError("No file provided", HTTP_STATUS.BAD_REQUEST);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `geekcart/${folder}`,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    stream.end(file.buffer);
  });
};
