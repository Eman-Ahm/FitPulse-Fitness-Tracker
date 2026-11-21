const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getAchievements, checkAndAward } = require('../controllers/achievementsController');

router.use(authenticateToken);
router.get('/',     getAchievements);
router.post('/check', checkAndAward);
module.exports = router;
