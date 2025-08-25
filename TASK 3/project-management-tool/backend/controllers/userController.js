const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('projects', 'title description status'); // Assuming you have a 'projects' field in User model

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Check for unique username/email before updating
    if (username && username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Username already taken', field: 'username' });
        user.username = username;
    }
    if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already taken', field: 'email' });
        user.email = email;
    }
    if (password) {
        user.password = password; // The 'pre-save' hook in your User model will hash it
    }

    const updatedUser = await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add logic here to handle what happens to the deleted user's projects/tasks
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
