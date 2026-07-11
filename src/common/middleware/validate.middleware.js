import { HTTP_STATUS } from "../constants/statusCode.js";
import { AppError } from "../utils/AppError.js";

export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMesage = error.details.map((e) => e.message).join(", ");
    return next(new AppError(errorMesage, HTTP_STATUS.BAD_REQUEST));
  }

  req.body = value;
  next();
};
