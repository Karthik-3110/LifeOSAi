import ApiError from "../utils/apiError.js";

const getMongoDuplicateMessage = (error) => {
  const field = Object.keys(error.keyPattern || {})[0] || "field";
  return `${field} already exists`;
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = error.statusCode || 500;
  let message = error.message || "Something went wrong";
  let code = error.code || "INTERNAL_SERVER_ERROR";
  let details = error.details || undefined;

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    code = "VALIDATION_ERROR";
    details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource id";
    code = "INVALID_ID";
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = getMongoDuplicateMessage(error);
    code = "DUPLICATE_RESOURCE";
  }

  if (!(error instanceof ApiError) && statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === "production" && statusCode >= 500 ? "Internal server error" : message,
    code,
    ...(details ? { details } : {}),
  });
};

export default errorHandler;
