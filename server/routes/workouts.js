const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getWorkouts, getWorkout, createWorkout, updateWorkout, deleteWorkout } = require('../controllers/workoutsController');
const { validateWorkout } = require('../validators/workoutValidators');

router.use(authenticateToken);

router.get('/',      getWorkouts);
router.get('/:id',   getWorkout);
router.post('/',     validateWorkout, createWorkout);
router.put('/:id',   validateWorkout, updateWorkout);
router.delete('/:id', deleteWorkout);

module.exports = router;
