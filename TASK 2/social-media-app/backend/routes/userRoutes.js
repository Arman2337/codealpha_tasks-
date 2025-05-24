const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/:username', auth, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('-password')
            .populate('followers', 'username profilePicture')
            .populate('following', 'username profilePicture');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching user profile',
            error: error.message 
        });
    }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['bio', 'profilePicture'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).json({ message: 'Invalid updates' });
    }

    try {
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();
        res.json(req.user.getPublicProfile());
    } catch (error) {
        res.status(400).json({ 
            message: 'Error updating profile',
            error: error.message 
        });
    }
});

// Follow user
router.post('/follow/:userId', auth, async (req, res) => {
    try {
        if (req.user._id.toString() === req.params.userId) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }

        const userToFollow = await User.findById(req.params.userId);
        if (!userToFollow) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already following
        if (req.user.following.includes(req.params.userId)) {
            return res.status(400).json({ message: 'Already following this user' });
        }

        // Add to following list
        req.user.following.push(req.params.userId);
        await req.user.save();

        // Add to followers list
        userToFollow.followers.push(req.user._id);
        await userToFollow.save();

        res.json({ 
            message: 'Followed successfully',
            following: req.user.following,
            followers: userToFollow.followers
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error following user',
            error: error.message 
        });
    }
});

// Unfollow user
router.post('/unfollow/:userId', auth, async (req, res) => {
    try {
        if (req.user._id.toString() === req.params.userId) {
            return res.status(400).json({ message: 'Cannot unfollow yourself' });
        }

        const userToUnfollow = await User.findById(req.params.userId);
        if (!userToUnfollow) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove from following list
        req.user.following = req.user.following.filter(
            id => id.toString() !== req.params.userId
        );
        await req.user.save();

        // Remove from followers list
        userToUnfollow.followers = userToUnfollow.followers.filter(
            id => id.toString() !== req.user._id.toString()
        );
        await userToUnfollow.save();

        res.json({ 
            message: 'Unfollowed successfully',
            following: req.user.following,
            followers: userToUnfollow.followers
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error unfollowing user',
            error: error.message 
        });
    }
});

// Get user's followers
router.get('/:userId/followers', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('followers', 'username profilePicture bio');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.followers);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching followers',
            error: error.message 
        });
    }
});

// Get user's following
router.get('/:userId/following', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('following', 'username profilePicture bio');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.following);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching following',
            error: error.message 
        });
    }
});

module.exports = router; 