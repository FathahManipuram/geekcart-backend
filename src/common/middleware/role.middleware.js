import { HTTP_STATUS } from "../constants/statusCode.js";
import { AppError } from "../utils/AppError.js";

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
      }

      if (!allowedRoles.includes(user.role)) {
        throw new AppError("Forbidden", HTTP_STATUS.FORBIDDEN);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default roleMiddleware;
