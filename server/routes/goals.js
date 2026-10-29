const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
} = require('../controllers/goalsController');

router.use(authenticateToken);

router.get('/',     getGoals);
router.get('/:id',  getGoal);
router.post('/',    createGoal);
router.put('/:id',  updateGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
