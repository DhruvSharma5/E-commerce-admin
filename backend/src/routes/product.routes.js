const router = require('express').Router();
const c = require('../controllers/product.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createProductRules, updateProductRules, idRules, listRules } = require('../validators/product.validators');

router.get('/', listRules, validate, c.listProducts);
router.get('/:id', idRules, validate, c.getProduct);
router.post('/', authenticate, createProductRules, validate, c.createProduct);
router.put('/:id', authenticate, updateProductRules, validate, c.updateProduct);
router.delete('/:id', authenticate, idRules, validate, c.deleteProduct);

module.exports = router;
