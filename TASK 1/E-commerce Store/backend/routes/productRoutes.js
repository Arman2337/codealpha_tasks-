const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ 
            message: 'Error fetching products',
            error: err.message 
        });
    }
});

// Get a single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ 
            message: 'Error fetching product',
            error: err.message 
        });
    }
});

// Create a new product
router.post('/', async (req, res) => {
    try {
        const { name, price, description, image, stock, category, featured } = req.body;

        // Validate required fields
        if (!name || !price || stock === undefined) {
            return res.status(400).json({ 
                message: 'Name, price, and stock are required' 
            });
        }

        // Validate price is a positive number
        if (isNaN(price) || price <= 0) {
            return res.status(400).json({ 
                message: 'Price must be a positive number' 
            });
        }

        // Validate stock is a non-negative number
        if (isNaN(stock) || stock < 0) {
            return res.status(400).json({ 
                message: 'Stock must be a non-negative number' 
            });
        }

        // Validate category if provided
        const validCategories = ['electronics', 'clothing', 'books', 'home', 'other'];
        if (category && !validCategories.includes(category)) {
            return res.status(400).json({ 
                message: 'Invalid category. Must be one of: ' + validCategories.join(', ')
            });
        }

        const product = new Product({
            name,
            price,
            description,
            image,
            stock,
            category: category || 'other',
            featured: featured || false
        });

        await product.save();
        res.status(201).json(product);
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ 
            message: 'Error creating product',
            error: err.message 
        });
    }
});

// Update a product
router.put('/:id', async (req, res) => {
    try {
        const { name, price, description, image, stock, category, featured } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Validate price if provided
        if (price !== undefined && (isNaN(price) || price <= 0)) {
            return res.status(400).json({ 
                message: 'Price must be a positive number' 
            });
        }

        // Validate stock if provided
        if (stock !== undefined && (isNaN(stock) || stock < 0)) {
            return res.status(400).json({ 
                message: 'Stock must be a non-negative number' 
            });
        }

        // Validate category if provided
        const validCategories = ['electronics', 'clothing', 'books', 'home', 'other'];
        if (category !== undefined && !validCategories.includes(category)) {
            return res.status(400).json({ 
                message: 'Invalid category. Must be one of: ' + validCategories.join(', ')
            });
        }

        // Update fields if provided
        if (name) product.name = name;
        if (price !== undefined) product.price = price;
        if (description !== undefined) product.description = description;
        if (image !== undefined) product.image = image;
        if (stock !== undefined) product.stock = stock;
        if (category !== undefined) product.category = category;
        if (featured !== undefined) product.featured = featured;

        await product.save();
        res.json(product);
    } catch (err) {
        res.status(500).json({ 
            message: 'Error updating product',
            error: err.message 
        });
    }
});

// Delete a product
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await product.deleteOne();
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ 
            message: 'Error deleting product',
            error: err.message 
        });
    }
});

module.exports = router;
