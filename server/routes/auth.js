const express = require('express');
const router  = express.Router();
const { register, login, me } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordResetController');
const { validateRegister, validateLogin } = require('../validators/authValidators');
const { authenticateToken } = require('../middleware/auth');

const limiter = (req, res, next) => req.app.get('authLimiter')(req, res, next);

router.post('/register',       limiter, validateRegister, register);
router.post('/login',          limiter, validateLogin,    login);
router.get('/me',              authenticateToken,         me);
router.post('/forgot-password', limiter, forgotPassword);
router.post('/reset-password',  resetPassword);

module.exports = router;
