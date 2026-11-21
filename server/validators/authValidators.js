const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Accepted email providers (expand as needed)
const ALLOWED_DOMAINS = new Set([
  'gmail.com','yahoo.com','yahoo.co.uk','yahoo.fr','yahoo.de','yahoo.it','yahoo.es',
  'outlook.com','outlook.co.uk','outlook.fr','hotmail.com','hotmail.co.uk',
  'icloud.com','me.com','mac.com',
  'protonmail.com','proton.me',
  'live.com','msn.com',
  'aol.com',
]);

const emailChain = body('email')
  .trim()
  .toLowerCase()
  .notEmpty().withMessage('Please enter your email address')
  .isLength({ max: 255 }).withMessage('Email must be under 255 characters')
  .isEmail({ require_tld: true, allow_utf8_local_part: false })
    .withMessage('Please enter a valid email address (e.g. name@gmail.com)')
  .custom((val) => {
    const domain = (val.split('@')[1] || '').toLowerCase();
    if (!domain.includes('.') || domain.endsWith('.')) {
      throw new Error('Please enter a valid email address (e.g. name@gmail.com)');
    }
    // Allow common providers OR any domain with a recognised TLD (edu, org, net, etc.)
    const tld = domain.split('.').pop();
    const knownTlds = ['com','net','org','edu','gov','io','co','uk','de','fr','jp','au','ca','in','pk'];
    if (!ALLOWED_DOMAINS.has(domain) && !knownTlds.includes(tld)) {
      throw new Error('Please use a valid email provider (e.g. @gmail.com, @yahoo.com, @outlook.com)');
    }
    return true;
  });

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
  emailChain,
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  handleValidation,
];

const validateLogin = [
  emailChain,
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

module.exports = { validateRegister, validateLogin };
