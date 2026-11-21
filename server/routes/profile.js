const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getProfile, updateName, changePassword, deleteAccount } = require('../controllers/profileController');

router.use(authenticateToken);
router.get('/',           getProfile);
router.put('/name',       updateName);
router.put('/password',   changePassword);
router.delete('/',        deleteAccount);
module.exports = router;
