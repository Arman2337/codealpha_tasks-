const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const taskRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters long'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('dueDate')
    .isISO8601()
    .withMessage('Invalid due date'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority level'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'completed'])
    .withMessage('Invalid status'),
  body('project')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID')
];

// Get all tasks for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to the project
    if (!project.owner.equals(req.user._id) && 
        !project.members.some(member => member._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo createdBy', 'username email')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username email'
        }
      })
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo createdBy', 'username email')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username email'
        }
      });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project.owner.equals(req.user._id) && 
        !project.members.some(member => member._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/', auth, taskRules, validate, async (req, res) => {
  try {
    const { title, description, dueDate, priority, status, project, assignedTo, tags } = req.body;

    // Check if project exists and user has access
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!projectDoc.owner.equals(req.user._id) && 
        !projectDoc.members.some(member => member._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if assigned user is a project member
    if (assignedTo && !projectDoc.members.some(member => member._id.equals(assignedTo))) {
      return res.status(400).json({ message: 'Assigned user must be a project member' });
    }

    const task = new Task({
      title,
      description,
      dueDate,
      priority,
      status,
      project,
      assignedTo,
      createdBy: req.user._id,
      tags
    });

    await task.save();
    await task.populate('assignedTo createdBy', 'username email');

    // Add task to project
    projectDoc.tasks.push(task._id);
    await projectDoc.save();

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', auth, taskRules, validate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project.owner.equals(req.user._id) && 
        !project.members.some(member => member._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if assigned user is a project member
    if (req.body.assignedTo && 
        !project.members.some(member => member._id.equals(req.body.assignedTo))) {
      return res.status(400).json({ message: 'Assigned user must be a project member' });
    }

    const updates = {
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate,
      priority: req.body.priority,
      status: req.body.status,
      assignedTo: req.body.assignedTo,
      tags: req.body.tags
    };

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
    .populate('assignedTo createdBy', 'username email')
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'username email'
      }
    });

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project.owner.equals(req.user._id) && 
        !project.members.some(member => member._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove task from project
    project.tasks = project.tasks.filter(t => !t.equals(task._id));
    await project.save();

    await task.remove();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 