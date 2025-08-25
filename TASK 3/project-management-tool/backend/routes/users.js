const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Middleware
const { auth, adminAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Controllers
const {
  getAllUsers,
  getUserById,
  updateUserProfile,
  deleteUser
} = require('../controllers/userController');

// Validation rules for updating a profile
const updateProfileRules = [
  body('username', 'Username must be at least 3 characters long').optional().trim().isLength({ min: 3 }),
  body('email', 'Please enter a valid email').optional().trim().isEmail(),
  body('password', 'Password must be at least 6 characters long').optional().isLength({ min: 6 })
];

// --- User Routes ---

// GET all users (Admin only)
router.get('/', auth, adminAuth, getAllUsers);

// GET current user profile (using the /api/auth/me route is often preferred)
// PUT update current user profile
router.put('/profile', auth, updateProfileRules, validate, updateUserProfile);

// GET user by ID (Admin or for specific profile views)
router.get('/:id', auth, getUserById);

// DELETE a user by ID (Admin only)
router.delete('/:id', auth, adminAuth, deleteUser);

module.exports = router;
