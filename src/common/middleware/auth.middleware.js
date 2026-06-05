
import { User } from "../../modules/user-side/user-profile/models/user.model.js";
import { HTTP_STATUS } from "../constants/statusCode.js";
import { AppError } from "../utils/AppError.js";
import { jwtVerify } from "../utils/jwt.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        "Unauthorized: No token provided",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    
    try {
      decoded = jwtVerify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        throw new AppError(
          "Token expired, please login again",
          HTTP_STATUS.UNAUTHORIZED,
        );
      }
      throw new AppError(
        "Invalid token, authorization denied",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }


    if (!decoded || !decoded.id) {
      throw new AppError("Malformed token payload", HTTP_STATUS.UNAUTHORIZED);
    }

    
    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      throw new AppError(
        "Authentication required: User no longer exists",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

   
    if (user.isBlocked) {
      throw new AppError(
        "Access denied: User is blocked",
        HTTP_STATUS.FORBIDDEN,
      );
    }


    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

export default authMiddleware;