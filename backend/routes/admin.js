const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Store = require('../models/Store');
const Offer = require('../models/Offer');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get Platform-wide stats (Admin Only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalStores = await Store.countDocuments();
        const pendingStores = await Store.countDocuments({ approved: false });
        const totalOffers = await Offer.countDocuments();
        
        // Active Users (within last 24h)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeUsersCount = await User.countDocuments({ 
            updatedAt: { $gte: twentyFourHoursAgo } 
        });

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalStores,
                pendingStores,
                totalOffers,
                activeUsersCount
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

