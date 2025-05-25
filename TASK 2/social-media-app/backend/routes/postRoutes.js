const express = require('express');
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

// Create a new post
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        const post = new Post({
            user: req.user._id,
            caption: req.body.caption,
            image: req.file.path
        });

        await post.save();
        await post.populate('user', 'username profilePicture');

        res.status(201).json(post);
    } catch (error) {
        res.status(400).json({ 
            message: 'Error creating post',
            error: error.message 
        });
    }
});

// Get all posts (feed)
router.get('/feed', auth, async (req, res) => {
    try {
        // Show all posts to everyone
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate('user', 'username profilePicture')
            .populate('comments.user', 'username profilePicture');

        res.json(posts);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching feed',
            error: error.message 
        });
    }
});

// Get user's posts
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const posts = await Post.find({ user: req.params.userId })
            .sort({ createdAt: -1 })
            .populate('user', 'username profilePicture')
            .populate('comments.user', 'username profilePicture');

        res.json(posts);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching user posts',
            error: error.message 
        });
    }
});

// Get a single post
router.get('/:postId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId)
            .populate('user', 'username profilePicture')
            .populate('comments.user', 'username profilePicture');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json(post);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching post',
            error: error.message 
        });
    }
});

// Delete a post
router.delete('/:postId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        await post.deleteOne();
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error deleting post',
            error: error.message 
        });
    }
});

// Like/Unlike a post
router.post('/:postId/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const isLiked = post.toggleLike(req.user._id);
        await post.save();

        res.json({ 
            message: isLiked ? 'Post liked' : 'Post unliked',
            likes: post.likes,
            likeCount: post.likeCount
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error liking/unliking post',
            error: error.message 
        });
    }
});

// Add a comment
router.post('/:postId/comments', auth, async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const post = await Post.findById(req.params.postId);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.comments.push({
            user: req.user._id,
            text
        });

        await post.save();
        await post.populate('comments.user', 'username profilePicture');

        res.json(post.comments);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error adding comment',
            error: error.message 
        });
    }
});

// Delete a comment
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = post.comments.id(req.params.commentId);
        
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        comment.remove();
        await post.save();

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error deleting comment',
            error: error.message 
        });
    }
});

module.exports = router; 