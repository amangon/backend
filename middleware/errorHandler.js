import ErrorResponse from "../utils/ErrorResponse.js";

const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message, statusCode: err.statusCode };
  error.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === "development") {
    console.error(err.stack || err);
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    error = new ErrorResponse(`Resource not found`, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    error = new ErrorResponse(
      `Duplicate value for field '${field}'. Please use another value.`,
      400
    );
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new ErrorResponse(messages.join(", "), 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new ErrorResponse("Invalid token, please log in again", 401);
  }
  if (err.name === "TokenExpiredError") {
    error = new ErrorResponse("Session expired, please log in again", 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
  });
};

export const notFound = (req, res, next) => {
  const error = new ErrorResponse(`Route not found - ${req.originalUrl}`, 404);
  next(error);
};

export default errorHandler;
