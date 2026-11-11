const { body, validationResult } = require('express-validator');

const handle = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const GOAL_TYPES = ['workouts_count','duration_min','calories','distance_km','weight_kg','custom'];

const validateGoal = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('goal_type').optional().isIn(GOAL_TYPES).withMessage('Invalid goal type'),
  body('target_value').isFloat({ min: 0.01 }).withMessage('Target value must be positive'),
  body('current_value').optional({ nullable: true }).isFloat({ min: 0 }),
  body('deadline').optional({ nullable: true }).isDate().withMessage('Valid date required'),
  handle,
];

module.exports = { validateGoal };
