const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const c = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { registerRules, loginRules } = require('../validators/auth.validators');

// Bonus: brute-force protection on login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, try again in 15 minutes' },
});

router.post('/register', registerRules, validate, c.register);
router.post('/login', loginLimiter, loginRules, validate, c.login);
// no body input: the refresh token comes from the httpOnly cookie and is verified in the controller (401/403)
router.post('/refresh-token', c.refreshToken);
router.post('/logout', authenticate, c.logout);
router.get('/me', authenticate, c.me);

module.exports = router;
