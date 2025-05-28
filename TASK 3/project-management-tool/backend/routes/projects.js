const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const mongoose = require('mongoose');

// Validation rules
const projectRules = [
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
  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date'),
  body('endDate')
    .isISO8601()
    .withMessage('Invalid end date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority level'),
  body('status')
    .optional()
    .isIn(['planning', 'in-progress', 'completed', 'on-hold'])
    .withMessage('Invalid status')
];

// Get all projects (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    const query = {};

    // Add filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get projects where user is owner or member
    query.$or = [
      { owner: req.user._id },
      { members: req.user._id }
    ];

    const projects = await Project.find(query)
      .populate('owner', 'username email')
      .populate('members', 'username email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('Fetching project with ID:', req.params.id);
    console.log('User ID:', req.user._id);

    // Validate project ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    const project = await Project.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('members', 'username email')
      .populate({
        path: 'tasks',
        populate: {
          path: 'assignedTo createdBy',
          select: 'username email'
        }
      });

    console.log('Project found:', project ? 'Yes' : 'No');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to the project
    const isOwner = project.owner._id.toString() === req.user._id.toString();
    const isMember = project.members.some(member => 
      member._id.toString() === req.user._id.toString()
    );

    console.log('User is owner:', isOwner);
    console.log('User is member:', isMember);

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Create project
router.post('/', auth, projectRules, validate, async (req, res) => {
  try {
    const { title, description, startDate, endDate, priority, status, tags } = req.body;

    const project = new Project({
      title,
      description,
      startDate,
      endDate,
      priority,
      status,
      tags,
      owner: req.user._id,
      members: [req.user._id]
    });

    await project.save();
    await project.populate('owner members', 'username email');

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project
router.put('/:id', auth, projectRules, validate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the owner
    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only project owner can update' });
    }

    const updates = {
      title: req.body.title,
      description: req.body.description,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      priority: req.body.priority,
      status: req.body.status,
      tags: req.body.tags
    };

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
    .populate('owner members', 'username email')
    .populate({
      path: 'tasks',
      populate: {
        path: 'assignedTo createdBy',
        select: 'username email'
      }
    });

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add/remove project member
router.patch('/:id/members', auth, async (req, res) => {
  try {
    const { action, userId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the owner
    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only project owner can manage members' });
    }

    if (action === 'add') {
      if (project.members.includes(userId)) {
        return res.status(400).json({ message: 'User is already a member' });
      }
      project.members.push(userId);
    } else if (action === 'remove') {
      if (project.owner.equals(userId)) {
        return res.status(400).json({ message: 'Cannot remove project owner' });
      }
      project.members = project.members.filter(
        member => !member.equals(userId)
      );
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await project.save();
    await project.populate('owner members', 'username email');

    res.json({
      message: `Member ${action === 'add' ? 'added' : 'removed'} successfully`,
      project
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the owner
    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only project owner can delete' });
    }

    await project.remove();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;