import { validationResult } from "express-validator";
import ApiError from "../utils/apiError.js";

const validate = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const details = result.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  return next(new ApiError(400, "Validation failed", "VALIDATION_ERROR", details));
};

export default validate;
