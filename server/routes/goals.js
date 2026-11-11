const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getGoals, getGoal, createGoal, updateGoal, deleteGoal } = require('../controllers/goalsController');
const { validateGoal } = require('../validators/goalValidators');

router.use(authenticateToken);

router.get('/',      getGoals);
router.get('/:id',   getGoal);
router.post('/',     validateGoal, createGoal);
router.put('/:id',   validateGoal, updateGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
