import { compareOtp, generateOtp, hashOtp } from "../utils/otp.js";
import Otp from "../../modules/auth/models/otp.model.js";
import { sendEmail } from "../../infrastructure/services/email.service.js";
import { otpTemplate } from "../utils/emailTemplates.js";
import { AppError } from "../utils/AppError.js";
import { OTP_TYPES } from "../constants/otpTypes.js";
import { getUserByEmail, getUserById } from "./user.services.js";
import { HTTP_STATUS } from "../constants/statusCode.js";

//Create OTP
export const createOtp = async ({
  userId,
  email,
  type,
  payload = {},
  meta = {},
}) => {
  await Otp.deleteMany({ email, type, ...(userId && { userId }) });
  const otp = generateOtp();
  const hashedOtp= await hashOtp(otp)
  console.log("Otp generated: ", otp);
  await Otp.create({
    userId,
    email,
    otp: hashedOtp,
    type,
    payload,
    meta,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  return otp;
};

//Verify OTP
export const verifyOtp = async ({ userId, email, otp, type }) => {

  const query = { email, type };

  if (userId) {
    query.userId = userId;
  }

  const record = await Otp.findOne(query).sort({ createdAt: -1 });
  
  if (!record) throw new AppError("OTP expired or Invalid", HTTP_STATUS.BAD_REQUEST);
  if (record.attemptCount >= record.maxAttempt) throw new AppError(
      "Too many attempts, Try later",
      HTTP_STATUS.TOO_MANY_REQUESTS,
    );
  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: record._id });
    throw new AppError("OTP expired", HTTP_STATUS.BAD_REQUEST);
  }

  const isMatch = await compareOtp(otp, record.otp);

  if (!isMatch) {
    await record.updateOne({
      $inc: { attemptCount: 1 },
    });

    throw new AppError("Invalid OTP", HTTP_STATUS.BAD_REQUEST);
  }

  await Otp.deleteOne({ _id: record._id });

  return record;
}

//Resend OTP
export const resendOtp = async ({
  userId,
  email,
  type,
  meta = {},
}) => {
  let user = null;
  if (userId) {
    user = await getUserById(userId);

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    if (user?.isBlocked) {
      throw new AppError("User is blocked", HTTP_STATUS.FORBIDDEN);
    }
  }

  if (type === OTP_TYPES.EMAIL_VERIFY && user?.isVerified) {
    throw new AppError("User already verified", HTTP_STATUS.BAD_REQUEST);
  }

const existingOtp= await Otp.findOne({email, type}).sort({createdAt: -1})
const preservedPayload= existingOtp ? existingOtp.payload : {}

  await Otp.deleteMany({ email, type });

  return await createOtp({
    userId,
    email,
    type,
    payload: preservedPayload,
    meta,
  });
};
