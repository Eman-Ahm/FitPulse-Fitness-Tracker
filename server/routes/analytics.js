const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getAnalytics } = require('../controllers/analyticsController');

router.use(authenticateToken);

router.get('/', getAnalytics);

module.exports = router;
