const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const commentRules = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required'),
  body('task')
    .isMongoId()
    .withMessage('Invalid task ID')
];

// Get all comments for a task
router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project.owner.equals(req.user._id) && 
        !project.members.some(member => member._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'username email')
      .populate('mentions', 'username email')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('author', 'username email')
      .populate('mentions', 'username email');

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user has access to the project
    const task = await Task.findById(comment.task);
    const project = await Project.findById(task.project);
    if (!project.owner.equals(req.user._id) && 
        !project.members.some(member => member._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create comment
router.post('/', auth, commentRules, validate, async (req, res) => {
  try {
    const { content, task, mentions } = req.body;

    // Check if task exists and user has access
    const taskDoc = await Task.findById(task);
    if (!taskDoc) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(taskDoc.project);
    if (!project.owner.equals(req.user._id) && 
        !project.members.some(member => member._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if mentioned users are project members
    if (mentions && mentions.length > 0) {
      const invalidMentions = mentions.filter(
        mention => !project.members.some(member => member._id.equals(mention))
      );
      if (invalidMentions.length > 0) {
        return res.status(400).json({ 
          message: 'All mentioned users must be project members' 
        });
      }
    }

    const comment = new Comment({
      content,
      task,
      author: req.user._id,
      mentions
    });

    await comment.save();
    await comment.populate('author mentions', 'username email');

    // Add comment to task
    taskDoc.comments.push(comment._id);
    await taskDoc.save();

    res.status(201).json({
      message: 'Comment created successfully',
      comment
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update comment
router.put('/:id', auth, async (req, res) => {
  try {
    const { content, mentions } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author
    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only comment author can update' });
    }

    // Check if user has access to the project
    const task = await Task.findById(comment.task);
    const project = await Project.findById(task.project);
    if (!project.owner.equals(req.user._id) && 
        !project.members.some(member => member._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if mentioned users are project members
    if (mentions && mentions.length > 0) {
      const invalidMentions = mentions.filter(
        mention => !project.members.some(member => member._id.equals(mention))
      );
      if (invalidMentions.length > 0) {
        return res.status(400).json({ 
          message: 'All mentioned users must be project members' 
        });
      }
    }

    const updates = {
      content,
      mentions,
      isEdited: true,
      editedAt: Date.now()
    };

    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
    .populate('author mentions', 'username email');

    res.json({
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author or project owner
    const task = await Task.findById(comment.task);
    const project = await Project.findById(task.project);
    
    if (!comment.author.equals(req.user._id) && 
        !project.owner.equals(req.user._id)) {
      return res.status(403).json({ 
        message: 'Only comment author or project owner can delete' 
      });
    }

    // Remove comment from task
    task.comments = task.comments.filter(c => !c.equals(comment._id));
    await task.save();

    await comment.remove();
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 