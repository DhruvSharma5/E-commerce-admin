const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  signAccessToken, signRefreshToken, hashToken, setRefreshCookie, clearRefreshCookie,
} = require('../utils/tokens');

const MAX_SESSIONS = 5; // max devices logged in at once

// POST /api/auth/register  -> returns user only, no tokens
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const hashed = await bcrypt.hash(password, 12); // salt rounds >= 10
    const user = await User.create({ name, email, password: hashed });
    res.status(201).json({ success: true, user }); // toJSON strips the password
  } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password +refreshTokens');
    const ok = user && (await bcrypt.compare(password, user.password));
    // same generic message for wrong email or wrong password
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    user.refreshTokens = [...user.refreshTokens, hashToken(refreshToken)].slice(-MAX_SESSIONS);
    await user.save();

    setRefreshCookie(res, refreshToken);
    res.json({ success: true, accessToken, user });
  } catch (err) { next(err); }
};

// POST /api/auth/refresh-token  -> new access token + rotated refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'Refresh token missing, please log in' });
    let payload;
    try {
      payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: 'Refresh token expired or invalid, please log in again' });
    }

    const user = await User.findById(payload.id).select('+refreshTokens');
    const hash = hashToken(token);
    if (!user || !user.refreshTokens.includes(hash)) {
      // Valid signature but not in DB => already used/revoked => possible theft.
      // Revoke every session of that user and force re-login.
      if (user) { user.refreshTokens = []; await user.save(); }
      clearRefreshCookie(res);
      return res.status(403).json({ success: false, message: 'Refresh token reuse detected, please log in again' });
    }

    const newRefresh = signRefreshToken(user._id);
    user.refreshTokens = user.refreshTokens.filter((h) => h !== hash).concat(hashToken(newRefresh));
    await user.save();

    setRefreshCookie(res, newRefresh);
    res.json({ success: true, accessToken: signAccessToken(user._id) });
  } catch (err) { next(err); }
};

// POST /api/auth/logout (needs access token) -> revoke refresh token + clear cookie
exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await User.updateOne({ _id: req.user._id }, { $pull: { refreshTokens: hashToken(token) } });
    }
    clearRefreshCookie(res);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
};

// GET /api/auth/me
exports.me = (req, res) => res.json({ success: true, user: req.user });
