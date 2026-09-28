const { validationResult } = require('express-validator');

// Runs after the validator chains. Stops the request with a 400 and
// field-level errors if anything failed, so controllers only see valid input.
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result
    .array({ onlyFirstError: true })
    .map((e) => ({ field: e.path, message: e.msg, location: e.location }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors });
};
