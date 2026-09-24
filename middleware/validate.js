const { validationResult } = require('express-validator');

/**
 * validate — Runs after express-validator checks.
 * If any validation errors exist, returns 400 with a structured error response.
 * Otherwise, passes control to the next handler.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = validate;
