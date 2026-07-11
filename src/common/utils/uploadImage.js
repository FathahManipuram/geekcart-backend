import { AppError } from "./AppError.js";
import { uploadFile } from "./uploadFile.js";

export const uploadImage = async (file, folder = "images") => {
  if (!file.mimetype.startsWith("image/")) {
    throw new AppError("Invalid image file");
  }

  return uploadFile(file, {
    folder,
    resourceType: "image",
  });
};
