const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Store = require('../models/Store');
const Offer = require('../models/Offer');
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/authMiddleware');

// Get Platform-wide stats (Admin Only)
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalStores = await Store.countDocuments();
        const pendingStores = await Store.countDocuments({ approved: false });
        const totalOffers = await Offer.countDocuments();
        const totalOrders = await Order.countDocuments();
        
        // Total Revenue Calculation
        const allOrders = await Order.find({ status: 'completed' });
        const platformRevenue = allOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        // Active Users (within last 24h)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeUsersCount = await User.countDocuments({ 
            updatedAt: { $gte: twentyFourHoursAgo } 
        });

        // Revenue over the last 7 days (simplified)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentOrders = await Order.find({ 
            status: 'completed',
            createdAt: { $gte: sevenDaysAgo }
        });
        const recentRevenue = recentOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalStores,
                pendingStores,
                totalOffers,
                totalOrders,
                platformRevenue,
                activeUsersCount,
                recentRevenue
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
