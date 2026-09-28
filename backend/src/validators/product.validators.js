const { body, param, query } = require('express-validator');

const idRule = param('id').isMongoId().withMessage('Invalid product id');

// strict type check: JSON must contain real numbers, not strings like "10"
const isNonNegNumber = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

const productBody = [
  body('name').isString().withMessage('Name is required').trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description').optional().isString().withMessage('Description must be text').trim()
    .isLength({ max: 1000 }).withMessage('Description can be at most 1000 characters'),
  body('imageUrl').optional({ values: 'falsy' }).isString().withMessage('Image URL must be text').trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Image URL must be a valid http or https URL')
    .isLength({ max: 2048 }).withMessage('Image URL is too long'),
  body('price').custom(isNonNegNumber).withMessage('Price must be a number, 0 or more'),
  body('stock').custom((v) => isNonNegNumber(v) && Number.isInteger(v))
    .withMessage('Stock must be a whole number, 0 or more'),
  body('category').optional().isString().withMessage('Category must be text').trim()
    .isLength({ min: 1, max: 50 }).withMessage('Category must be 1-50 characters'),
];

const createProductRules = productBody;
const updateProductRules = [idRule, ...productBody];
const idRules = [idRule];
const listRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100').toInt(),
  query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('search is too long'),
];

module.exports = { createProductRules, updateProductRules, idRules, listRules };
