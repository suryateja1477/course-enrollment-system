/**
 * Centralized error-handling middleware.
 * Catches all unhandled errors from route handlers and middleware.
 * Returns a consistent JSON error response without leaking stack traces in production.
 */
const errorHandler = (err, req, res, _next) => {
  console.error('Unhandled error:', err.message);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ error: 'Validation failed', details });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ error: `Duplicate value for '${field}'. This record already exists.` });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ error: 'Invalid ID format.' });
  }

  // Default server error — never leak stack trace
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
