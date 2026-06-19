const ApiError = require('../utils/ApiError');

/**
 * Global Error Handler
 * 
 * In Express, any middleware with 4 parameters (err, req, res, next)
 * is automatically treated as an error handler.
 * 
 * When you call next(error) anywhere — or when asyncHandler catches
 * a thrown error — it ends up HERE.
 * 
 * This ensures ALL errors return the same JSON format:
 * {
 *   "success": false,
 *   "message": "Error description",
 *   "errors": []          ← field-level errors from validation
 * }
 * 
 * No matter what breaks, the client always gets a clean response.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Handle specific MongoDB/Mongoose errors gracefully

  // Duplicate key error (e.g. email already exists)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists`;
  }

  // Mongoose validation error (schema-level)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Invalid MongoDB ObjectId (e.g. /users/not-a-valid-id)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // In development, include the stack trace for debugging
  const response = {
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;