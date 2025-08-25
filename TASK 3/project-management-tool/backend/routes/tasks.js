const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
    createTask,
    updateTask,
    deleteTask,
    getTasksByProject,
    getTaskById
} = require('../controllers/taskController');

// Validation rules for CREATING a task (strict)
const createTaskRules = [
  body('title', 'Title is required').trim().notEmpty(),
  body('description', 'Description is required').trim().notEmpty(),
  body('project', 'A valid project ID is required').isMongoId(),
  body('dueDate', 'A valid due date is required').optional().isISO8601(),
];

// --- FIX FOR UPDATING ---
// Validation rules for UPDATING a task (flexible, all fields are optional)
const updateTaskRules = [
  body('title', 'Title must be a string').optional().trim().notEmpty(),
  body('description', 'Description must be a string').optional().trim().notEmpty(),
  body('status', 'Invalid status').optional().isIn(['todo', 'in-progress', 'review', 'completed']),
  body('priority', 'Invalid priority').optional().isIn(['low', 'medium', 'high']),
  body('assignedTo', 'Invalid user ID').optional().isMongoId(),
  body('dueDate', 'Invalid due date').optional().isISO8601(),
];

// --- Task Routes ---
router.post('/', auth, createTaskRules, validate, createTask);
router.get('/project/:projectId', auth, getTasksByProject);
router.get('/:id', auth, getTaskById);
// Use the new flexible rules for the PUT route
router.put('/:id', auth, updateTaskRules, validate, updateTask);
router.delete('/:id', auth, deleteTask);

module.exports = router;
