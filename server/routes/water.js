const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getWater, logWater, deleteWater } = require('../controllers/waterController');

router.use(authenticateToken);
router.get('/',      getWater);
router.post('/',     logWater);
router.delete('/:id', deleteWater);
module.exports = router;
