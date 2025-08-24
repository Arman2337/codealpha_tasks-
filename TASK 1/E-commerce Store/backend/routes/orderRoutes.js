const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

// Create a new order
router.post('/', async (req, res) => {
    try {
        const { customer, items } = req.body;

        // --- Step 1: Calculate total and validate products (This part is already correct) ---
        let calculatedTotal = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Product with ID ${item.productId} not found.` });
            }
            // Check if there is enough stock
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Not enough stock for ${product.name}. Only ${product.stock} left.` });
            }
            calculatedTotal += product.price * item.quantity;
            processedItems.push({
                productId: item.productId,
                quantity: item.quantity,
                price: product.price
            });
        }

        const order = new Order({
            customer,
            items: processedItems,
            total: calculatedTotal
        });
        
        // Save the new order to the database
        const savedOrder = await order.save();

        // --- Step 2: Update stock quantities (THIS IS THE NEW LOGIC) ---
        // We create an array of update operations
        const stockUpdatePromises = savedOrder.items.map(item => {
            return Product.findByIdAndUpdate(item.productId, {
                // Use the $inc operator to increment the stock by a negative number (to decrease it)
                $inc: { stock: -item.quantity } 
            });
        });

        // Execute all the update operations
        await Promise.all(stockUpdatePromises);
        
        // --- End of new logic ---

        res.status(201).json(savedOrder);

    } catch (err) {
        console.error('Error creating order:', err); 
        res.status(500).json({ 
            message: 'Error creating order on the server.',
            error: err.message 
        });
    }
});

// (The rest of the file remains the same)
// Get all orders (for admin use)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('items.productId', 'name price image')
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
            .populate('items.productId', 'name price image');
        
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
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.json(order);
    } catch (err) {
        res.status(500).json({ 
            message: 'Error updating order status',
            error: err.message 
        });
    }
});

module.exports = router;