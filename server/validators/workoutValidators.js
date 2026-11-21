const { body, validationResult } = require('express-validator');

const handle = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const validateWorkout = [
  body('workout_date').isDate().withMessage('Valid date required (YYYY-MM-DD)'),
  body('type').trim().notEmpty().withMessage('Workout type is required').isLength({ max: 100 }),
  body('duration_min').isInt({ min: 1 }).withMessage('Duration must be a positive integer (minutes)'),
  body('calories').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Calories must be a positive integer'),
  body('distance_km').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Distance must be a non-negative number'),
  body('notes').optional({ nullable: true }).isLength({ max: 1000 }),
  handle,
];

module.exports = { validateWorkout };
