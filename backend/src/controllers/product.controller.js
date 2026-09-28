const Product = require('../models/Product');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pick = ({ name, description, imageUrl, price, stock, category }) => ({ name, description, imageUrl, price, stock, category });

// Finds the product (404 if missing) and checks the logged-in user owns it (403 if not)
async function findOwned(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return null; }
  if (!product.createdBy.equals(req.user._id)) {
    res.status(403).json({ success: false, message: 'You can only modify your own products' });
    return null;
  }
  return product;
}

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({ ...pick(req.body), createdBy: req.user._id });
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.listProducts = async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const filter = req.query.search ? { name: new RegExp(escapeRegex(req.query.search), 'i') } : {};
    const [data, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Product.countDocuments(filter),
    ]);
    res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await findOwned(req, res);
    if (!product) return;
    Object.assign(product, pick(req.body));
    await product.save();
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await findOwned(req, res);
    if (!product) return;
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
};
