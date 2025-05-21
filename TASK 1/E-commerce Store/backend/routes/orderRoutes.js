const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

// Create a new order
router.post('/', async (req, res) => {
    try {
        const { customer, items } = req.body;

        // Validate that all products exist
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(400).json({ 
                    message: `Product with ID ${item.productId} not found` 
                });
            }
            // Use the current product price
            item.price = product.price;
        }

        const order = new Order({
            customer,
            items
        });

        await order.save();
        res.status(201).json(order);
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ 
            message: 'Error creating order',
            error: err.message 
        });
    }
});

// Get all orders (for admin use)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('items.productId')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ 
            message: 'Error fetching orders',
            error: err.message 
        });
    }
});

// Get a specific order
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.productId');
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.json(order);
    } catch (err) {
        res.status(500).json({ 
            message: 'Error fetching order',
            error: err.message 
        });
    }
});

// Update order status (for admin use)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        order.status = status;
        await order.save();
        
        res.json(order);
    } catch (err) {
        res.status(500).json({ 
            message: 'Error updating order status',
            error: err.message 
        });
    }
});

module.exports = router; 