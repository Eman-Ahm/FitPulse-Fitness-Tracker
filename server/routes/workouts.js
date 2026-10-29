const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getWorkouts,
  getWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout,
} = require('../controllers/workoutsController');

router.use(authenticateToken); // all workout routes require auth

router.get('/',     getWorkouts);
router.get('/:id',  getWorkout);
router.post('/',    createWorkout);
router.put('/:id',  updateWorkout);
router.delete('/:id', deleteWorkout);

module.exports = router;
