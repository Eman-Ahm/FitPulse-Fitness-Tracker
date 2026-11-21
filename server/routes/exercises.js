const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getExercises, createExercise, deleteExercise, logExercise } = require('../controllers/exercisesController');

router.use(authenticateToken);
router.get('/',           getExercises);
router.post('/',          createExercise);
router.delete('/:id',     deleteExercise);
router.post('/:id/log',   logExercise);
module.exports = router;
