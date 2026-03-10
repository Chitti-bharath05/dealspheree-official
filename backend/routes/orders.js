const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Offer = require('../models/Offer');
const { protect } = require('../middleware/authMiddleware');

// Get all orders for a specific user (Protected)
router.get('/user/:userId', protect, async (req, res) => {
    try {
        // Note: For extra security, one might check if req.user._id matches req.params.userId
        const userOrders = await Order.find({ userId: req.params.userId }).populate('items.offerId');
        res.json(userOrders);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get orders for a store (Protected - for Analytics)
router.get('/store/:storeId', protect, async (req, res) => {
    try {
        const { storeId } = req.params;
        // Find all offers belonging to this store
        const storeOffers = await Offer.find({ storeId }).select('_id');
        const offerIds = storeOffers.map(o => o._id);
        
        // Find orders containing these offers
        const storeOrders = await Order.find({
            'items.offerId': { $in: offerIds }
        }).populate('userId', 'name email').populate('items.offerId');
        
        // Filter and aggregate specifically for this store
        const analytics = storeOrders.map(order => {
            const storeItems = order.items.filter(item => 
                offerIds.some(id => id.equals(item.offerId?._id || item.offerId))
            );
            const storeRevenue = storeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            return {
                orderId: order._id,
                date: order.createdAt,
                customer: order.userId,
                items: storeItems,
                storeRevenue,
                status: order.status
            };
        });
        
        res.json(analytics);
    } catch (error) {
        console.error('Store analytics error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create new order (Protected)
router.post('/', protect, async (req, res) => {
    try {
        const { userId, items, totalAmount } = req.body;

        if (!userId || !items || !totalAmount) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const newOrder = await Order.create({
            userId,
            items,
            totalAmount,
            status: 'completed' // Replacing paymentStatus to match schema
        });

        res.status(201).json({ success: true, order: newOrder });
    } catch (error) {
         res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
