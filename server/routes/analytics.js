const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getAnalytics, getDailyChart } = require('../controllers/analyticsController');

router.use(authenticateToken);
router.get('/',      getAnalytics);
router.get('/daily', getDailyChart);
module.exports = router;
