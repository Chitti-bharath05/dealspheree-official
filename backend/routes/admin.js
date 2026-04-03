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
        const pendingStoresCount = await Store.countDocuments({ approved: false });
        const totalOffers = await Offer.countDocuments();
        
        // Active Users (within last 24h)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeUsersCount = await User.countDocuments({ 
            updatedAt: { $gte: twentyFourHoursAgo } 
        });

        // --- Daily Registrations for Chart (Last 7 Days) ---
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0,0,0,0);

        const dailyRegistrations = await User.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Map to ensure we have all 7 days even if 0 registrations
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const found = dailyRegistrations.find(d => d._id === dateString);
            chartData.push({
                day: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()],
                count: found ? found.count : 0
            });
        }

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalStores,
                pendingStores: pendingStoresCount,
                totalOffers,
                activeUsersCount,
                chartData
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get System Alerts/Logs (Admin Only)
router.get('/alerts', protect, authorize('admin'), async (req, res) => {
    try {
        const SystemLog = require('../models/SystemLog');
        const logs = await SystemLog.find().sort({ createdAt: -1 }).limit(10);
        res.json({ success: true, logs });
    } catch (error) {
        console.error('Admin alerts error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

