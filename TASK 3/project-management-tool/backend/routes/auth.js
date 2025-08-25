const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Middleware
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Controllers
const { register, login, getMe } = require('../controllers/authController');

// Validation rules
const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const loginRules = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Routes
router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/me', auth, getMe);

module.exports = router;
