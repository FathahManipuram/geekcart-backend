import { User } from "../../modules/user-side/user-profile/models/user.model.js";
import { HTTP_STATUS } from "../constants/statusCode.js";
import { AppError } from "../utils/AppError.js";

export const getUserById = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }
  return user;
};

export const getUserByEmail = async (email) => {
  return await User.findOne({ email });
};
