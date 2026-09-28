const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m',
  });

// jti (random id) makes every refresh token unique, even if two are issued in the same second
const signRefreshToken = (userId) =>
  jwt.sign({ id: userId, jti: crypto.randomUUID() }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d',
  });

// We store only a hash of the refresh token in the DB, never the token itself
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const cookieOptions = {
  httpOnly: true, // JS in the browser can't read it (protects from XSS theft)
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  // Frontend and API are separate Vercel origins, so production uses cross-site cookies.
  sameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
  path: '/api/auth', // cookie is only sent to auth routes
};
const setRefreshCookie = (res, token) =>
  res.cookie('refreshToken', token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
const clearRefreshCookie = (res) => res.clearCookie('refreshToken', cookieOptions);

module.exports = { signAccessToken, signRefreshToken, hashToken, setRefreshCookie, clearRefreshCookie };
