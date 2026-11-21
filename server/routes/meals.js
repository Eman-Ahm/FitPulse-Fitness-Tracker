const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getMeals, createMeal, updateMeal, deleteMeal } = require('../controllers/mealsController');

router.use(authenticateToken);
router.get('/',       getMeals);
router.post('/',      createMeal);
router.put('/:id',    updateMeal);
router.delete('/:id', deleteMeal);
module.exports = router;
