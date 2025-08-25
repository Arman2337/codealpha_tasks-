const Task = require('../models/Task');
const Project = require('../models/Project');

// Helper function to check project membership
const checkProjectMembership = async (projectId, userId) => {
    const project = await Project.findById(projectId);
    if (!project) {
        return { error: { status: 404, message: 'Project not found' } };
    }
    if (!project.members.some(memberId => memberId.equals(userId))) {
        return { error: { status: 403, message: 'Access denied. You are not a member of this project.' } };
    }
    return { project };
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
    try {
        const { title, description, dueDate, project: projectId, assignedTo } = req.body;
        const { project: projectDoc, error } = await checkProjectMembership(projectId, req.user._id);
        if (error) return res.status(error.status).json({ message: error.message });

        if (assignedTo && !projectDoc.members.some(memberId => memberId.equals(assignedTo))) {
            return res.status(400).json({ message: 'Assigned user must be a project member' });
        }

        const task = new Task({
            ...req.body,
            project: projectId,
            createdBy: req.user._id,
        });

        await task.save(); // The post-save hook in the Task model will handle adding the task to the project
        await task.populate('assignedTo createdBy', 'username email');
        res.status(201).json({ message: 'Task created successfully', task });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update an existing task (including status changes)
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const { project: projectDoc, error } = await checkProjectMembership(task.project, req.user._id);
        if (error) return res.status(error.status).json({ message: error.message });

        if (req.body.assignedTo && !projectDoc.members.some(memberId => memberId.equals(req.body.assignedTo))) {
            return res.status(400).json({ message: 'Assigned user must be a project member' });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('assignedTo createdBy', 'username email');

        res.json({ message: 'Task updated successfully', task: updatedTask });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const { error } = await checkProjectMembership(task.project, req.user._id);
        if (error) return res.status(error.status).json({ message: error.message });
        
        // The pre-remove hook in the Task model will handle removing the task from the project
        await Task.findByIdAndDelete(req.params.id);

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// --- Other functions (ensure they are exported if used in routes) ---
exports.getTasksByProject = async (req, res) => {
    try {
        const { error } = await checkProjectMembership(req.params.projectId, req.user._id);
        if (error) return res.status(error.status).json({ message: error.message });

        const tasks = await Task.find({ project: req.params.projectId })
            .populate('assignedTo createdBy', 'username email')
            .sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate('assignedTo createdBy', 'username email');
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const { error } = await checkProjectMembership(task.project, req.user._id);
        if (error) return res.status(error.status).json({ message: error.message });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
