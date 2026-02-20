function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  // Validation errors
  if (err.name === 'ValidationError') {
    status = 400;
    message = err.message;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }

  // Database errors
  if (err.code === 'SQLITE_CONSTRAINT') {
    status = 409;
    message = 'Resource already exists';
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;

// Made with Bob
