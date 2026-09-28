module.exports = (err, _req, res, _next) => {
  if (err.code === 11000) return res.status(409).json({ success: false, message: 'Duplicate value' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'Invalid JSON body' });
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
};
