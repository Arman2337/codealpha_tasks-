const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                message: 'User with this email or username already exists' 
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            user: user.getPublicProfile(),
            token
        });
    } catch (error) {
        res.status(400).json({ 
            message: 'Error creating user',
            error: error.message 
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            user: user.getPublicProfile(),
            token
        });
    } catch (error) {
        res.status(400).json({ 
            message: 'Error logging in',
            error: error.message 
        });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    res.json(req.user.getPublicProfile());
});

// Logout user (client-side only, just return success)
router.post('/logout', auth, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router; 