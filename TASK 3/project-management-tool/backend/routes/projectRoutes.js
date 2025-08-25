const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Middleware
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Controllers
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  manageMembers
} = require('../controllers/projectController');

// Validation rules for creating/updating a project
const projectRules = [
  body('title', 'Title is required and must be at least 3 characters').trim().isLength({ min: 3 }),
  body('description', 'Description is required').trim().notEmpty(),
  body('startDate', 'Invalid start date').isISO8601(),
  body('endDate', 'End date must be after start date').isISO8601().custom((value, { req }) => {
    if (new Date(value) <= new Date(req.body.startDate)) {
      throw new Error('End date must be after start date');
    }
    return true;
  }),
  body('priority', 'Invalid priority').optional().isIn(['low', 'medium', 'high']),
  body('status', 'Invalid status').optional().isIn(['planning', 'in-progress', 'completed', 'on-hold'])
];

// --- Project Routes ---

// GET all projects for the user
router.get('/', auth, getProjects);

// GET a single project by ID
router.get('/:id', auth, getProjectById);

// POST (create) a new project
router.post('/', auth, projectRules, validate, createProject);

// PUT (update) a project by ID
router.put('/:id', auth, projectRules, validate, updateProject);

// DELETE a project by ID
router.delete('/:id', auth, deleteProject);

// PATCH to manage project members
router.patch('/:id/members', auth, [
  body('action', 'Action is required and must be "add" or "remove"').isIn(['add', 'remove']),
  body('userId', 'User ID is required').isMongoId()
], validate, manageMembers);

module.exports = router;
