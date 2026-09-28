const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Reads "Authorization: Bearer <accessToken>", verifies it and attaches req.user
module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, message: 'Access token missing' });
    }
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists' });
    req.user = user;
    next();
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    res.status(401).json({
      success: false,
      code: expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
      message: expired ? 'Access token expired' : 'Invalid access token',
    });
  }
};
