const { body } = require('express-validator');

const registerRules = [
  body('name').isString().withMessage('Name must be text').trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isString().withMessage('Email is required').trim()
    .isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').isString().withMessage('Password is required')
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    .withMessage('Password needs 8+ characters with upper, lower, number and symbol'),
  body('confirmPassword').custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
];

const loginRules = [
  body('email').isString().withMessage('Email is required').trim()
    .isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').isString().withMessage('Password is required')
    .notEmpty().withMessage('Password is required'),
];

module.exports = { registerRules, loginRules };
