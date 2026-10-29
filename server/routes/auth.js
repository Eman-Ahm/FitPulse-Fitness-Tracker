const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validators/authValidators');

// Auth limiter is attached to app in index.js
router.post('/register', (req, res, next) => req.app.get('authLimiter')(req, res, next), validateRegister, register);
router.post('/login',    (req, res, next) => req.app.get('authLimiter')(req, res, next), validateLogin,    login);

module.exports = router;
