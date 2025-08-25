const Project = require('../models/Project');
const User = require('../models/User'); // Make sure User model is imported
const mongoose = require('mongoose');

// @desc    Get all projects for the logged-in user
exports.getProjects = async (req, res) => {
  try {
    const query = {
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    };

    const projects = await Project.find(query)
      .populate('owner', 'username email')
      .populate('members', 'username email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single project by ID
exports.getProjectById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    const project = await Project.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('members', 'username email')
      .populate({ // This correctly populates tasks and the users within them
        path: 'tasks',
        populate: {
          path: 'assignedTo createdBy',
          select: 'username email',
        },
      });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.members.some(member => member._id.equals(req.user._id));
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new project
exports.createProject = async (req, res) => {
  try {
    const { title, description, startDate, endDate, members: memberEmails = [] } = req.body;
    const ownerId = req.user._id;

    // --- FIX: Convert member emails to user IDs ---
    const memberUsers = await User.find({ email: { $in: memberEmails } }).select('_id');
    const memberIds = memberUsers.map(user => user._id);

    // Always ensure the project creator is included as a member
    if (!memberIds.some(id => id.equals(ownerId))) {
      memberIds.push(ownerId);
    }
    // --- END FIX ---

    const project = new Project({
      title,
      description,
      startDate,
      endDate,
      owner: ownerId,
      members: memberIds, // Use the final array of user IDs
    });

    await project.save();
    await project.populate('owner members', 'username email');

    res.status(201).json({
      message: 'Project created successfully',
      project, // Send the full project object back
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an existing project
exports.updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        if (!project.owner.equals(req.user._id)) {
            return res.status(403).json({ message: 'Access denied. Only the project owner can update.' });
        }
        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('owner members', 'username email').populate('tasks');
        res.json({
            message: 'Project updated successfully',
            project: updatedProject,
        });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a project
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        if (!project.owner.equals(req.user._id)) {
            return res.status(403).json({ message: 'Access denied. Only the project owner can delete.' });
        }
        await Project.findByIdAndDelete(req.params.id);
        // Associated tasks should be handled here if needed (e.g., Task.deleteMany({ project: project._id }))
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Manage project members
exports.manageMembers = async (req, res) => {
    try {
        const { action, userId } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        if (!project.owner.equals(req.user._id)) {
            return res.status(403).json({ message: 'Access denied. Only the project owner can manage members.' });
        }
        if (action === 'add') {
            if (project.members.includes(userId)) {
                return res.status(400).json({ message: 'User is already a member.' });
            }
            project.members.push(userId);
        } else if (action === 'remove') {
            if (project.owner.equals(userId)) {
                return res.status(400).json({ message: 'Cannot remove the project owner.' });
            }
            project.members = project.members.filter(memberId => !memberId.equals(userId));
        } else {
            return res.status(400).json({ message: 'Invalid action.' });
        }
        await project.save();
        await project.populate('owner members', 'username email');
        res.json({
            message: `Member ${action}ed successfully.`,
            project,
        });
    } catch (error) {
        console.error('Error managing members:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
