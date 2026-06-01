import {
  createOtp,
  resendOtp,
  verifyOtp,
} from "../../../common/services/otp.service.js";
import {
  generateAccessToken,
  generateRefreshToken,
  jwtVerify,
} from "../../../common/utils/jwt.js";
import {
  comparePassword,
  hashPassword,
} from "../../../common/utils/encryption.js";
import { OTP_TYPES } from "../../../common/constants/otpTypes.js";
import { sendEmail } from "../../../infrastructure/services/email.service.js";
import { otpTemplate } from "../../../common/utils/emailTemplates.js";
import { AppError } from "../../../common/utils/AppError.js";
import { HTTP_STATUS } from "../../../common/constants/statusCode.js";
import { OAuth2Client } from "google-auth-library";
import { User } from "../../user-side/user-profile/models/user.model.js";
import { getUserById } from "../../../common/services/user.services.js";

//user register
export const registerUser = async (data) => {
  const { email, password } = data;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("User already exists", HTTP_STATUS.CONFLICT);
  }

  const hashedPassword = await hashPassword(password);

  const { confirmPassword, ...userData } = data;

  const otp = await createOtp({
    email,
    type: OTP_TYPES.EMAIL_VERIFY,
    payload: {
      ...userData,
      password: hashedPassword,
      isVerified: false,
    },
  });

  await sendEmail({
    to: email,
    subject: "Verify your email",
    html: otpTemplate(otp),
  });

  return { message: "User registered successfully. Verify your email." };
};

//Verify OTP
export const verifyOtpService = async ({ email, otp, type }) => {
  const otpDoc = await verifyOtp({
    email,
    otp,
    type,
  });

  if (type === OTP_TYPES.EMAIL_VERIFY) {
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      await User.create({ ...otpDoc.payload, isVerified: true });
    }
  }

  return { message: "OTP verified successfully" };
};

// Resend OTP
export const resendOtpService = async ({ email, type }) => {
  const user = await User.findOne({ email });

  if (type === OTP_TYPES.PASSWORD_RESET && !user) {
    return { message: "OTP sent if account exists" };
  }

  if (type === OTP_TYPES.EMAIL_VERIFY && user?.isVerified) {
    throw new AppError("User is already verified", HTTP_STATUS.BAD_REQUEST);
  }

  if (user?.isBlocked) {
    throw new AppError("User is blocked", HTTP_STATUS.FORBIDDEN);
  }

  const userId = user ? user._id : null;
  const otp = await resendOtp({ userId, email, type });

  if (!otp) {
    throw new AppError(
      "Failed to generate OTP",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  const subject =
    type === OTP_TYPES.EMAIL_VERIFY
      ? "Verify email OTP"
      : type === OTP_TYPES.PASSWORD_RESET
        ? "Reset password OTP"
        : "Email change OTP";

  await sendEmail({
    to: email,
    subject,
    html: otpTemplate(otp),
  });

  return { message: "OTP resent successfully" };
};

//login user
export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user)
    throw new AppError("Invalid credentials", HTTP_STATUS.UNAUTHORIZED);
  if (!user.isVerified)
    throw new AppError("Verify email first", HTTP_STATUS.BAD_REQUEST);
  if (user.isBlocked)
    throw new AppError("User is blocked", HTTP_STATUS.FORBIDDEN);

  if (user.provider === "google") {
    throw new AppError("Use google login");
  }
  const isMatch = await comparePassword(password, user.password);

  if (!isMatch)
    throw new AppError("Invalid credentials", HTTP_STATUS.UNAUTHORIZED);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await User.updateOne(
    { _id: user._id },
    { $set: { lastLoginAt: new Date() } },
  );
  const safeUser = {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };

  return {
    message: "Login successful",
    data: {
      user: safeUser,
      accessToken,
      refreshToken,
    },
  };
};

//Forgot password
export const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email });

  if (user && !user.isBlocked) {
    const otp = await createOtp({
      userId: user._id,
      email: user.email,
      type: OTP_TYPES.PASSWORD_RESET,
    });

    await sendEmail({
      to: email,
      subject: "Reset Password OTP",
      html: otpTemplate(otp),
    });
  }
  return { message: "OTP sent if account exists" };
};

//Reset password
export const resetPassword = async ({ email, newPassword }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("Invalid request", HTTP_STATUS.BAD_REQUEST);
  }

  const hashedPassword = await hashPassword(newPassword);
  await User.updateOne({ email }, { password: hashedPassword });

  return { message: "Password reset successfully" };
};

//Logoutuser
export const logoutUserService = async () => {
  return { message: "Logged out successfully" };
};

// Logout admin
export const logoutAdminService = () => {
  return { message: "Admin logout successfully" };
};

export const refreshTokenService = async ({ refreshToken }) => {
  if (!refreshToken)
    throw new AppError("Refresh token required", HTTP_STATUS.BAD_REQUEST);

  const decoded = jwtVerify(refreshToken, process.env.JWT_REFRESH_SECRET);

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  if (user.isBlocked) {
    throw new AppError("User is blocked", HTTP_STATUS.FORBIDDEN);
  }

  const newAccessToken = generateAccessToken(user);
  return {
    message: "Token refreshed",
    data: {
      accessToken: newAccessToken,
    },
  };
};

// Admin refreshToken
export const adminRefreshTokenService = async ({ refreshToken }) => {
  alert("refresh token called")
  if (!refreshToken) {
    throw new AppError("Refresh token required", HTTP_STATUS.BAD_REQUEST);
  }
  const result = await refreshTokenService({ refreshToken });
  const decoded = jwtVerify(refreshToken, process.env.JWT_REFRESH_SECRET).id;

  const user = await getUserById(decoded);

  if (user.role !== "admin") {
    throw new AppError("Access denied. Admins only", HTTP_STATUS.FORBIDDEN);
  }

  const newAccessToken = result.data.accessToken;
  return {
    message: "Token refreshed",
    data: {
      accessToken: newAccessToken,
    },
  };
};
//Google login

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLoginService = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  const { email, name, picture, email_verified, sub } = payload;

  if (!email_verified) {
    throw new AppError("Google email not verified", HTTP_STATUS.BAD_REQUEST);
  }

  let user = await User.findOne({ email });

  if (user) {
    if (!user.googleId) {
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            googleId: sub,
            provider: "google",
            isVerified: true,
          },
        },
      );
    }
  } else {
    user = await User.create({
      email,
      fullName: name,
      isVerified: true,
      avatar: picture,
      provider: "google",
      googleId: sub,
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const safeUser = {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };

  return {
    message: "Google login successful",
    data: {
      user: safeUser,
      accessToken,
      refreshToken,
    },
  };
};

//Admin login
export const adminLoginService = async ({ email, password }) => {
  const result = await loginUser({ email, password });

  const user = result.data.user;

  if (user.role !== "admin") {
    throw new AppError("Access denied. Admins only", HTTP_STATUS.FORBIDDEN);
  }

  return {
    message: "Admin login successful",
    data: result.data,
  };
};
