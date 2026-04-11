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

/**
 * 🛡️ AI Verification Helper
 * Simulates a Vision API/OCR scan to detect fraudulent documents.
 */
router.post('/verify-proof/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
        if (!store.businessProofUrl) return res.status(400).json({ success: false, message: 'No proof document to scan' });

        // Logic Simulation: Mocking OCR extraction and fraud detection
        // In a production app, this would integrate with Google Vision, AWS Textract, or Gemini
        
        const analysis = {
            extractedName: store.storeName, // Mock success
            trustScore: 92,
            warnings: [],
            isStockPhoto: false,
            checks: [
                { id: 1, label: "Official Document Structure", status: 'PASS' },
                { id: 2, label: "Text Data consistency", status: 'PASS' },
                { id: 3, label: "Global Stock Image check", status: 'PASS' }
            ]
        };

        // Heuristic: Flag common placeholder or small generic files
        if (store.businessProofUrl.toLowerCase().includes('sample') || store.businessProofUrl.toLowerCase().includes('test')) {
            analysis.trustScore = 15;
            analysis.isStockPhoto = true;
            analysis.warnings.push("GENERIC TEMPLATE DETECTED: This image appears to be a common internet sample.");
            analysis.checks[0].status = 'FAIL';
            analysis.checks[2].status = 'FAIL';
        }

        // Randomly simulate a mismatch for demo purposes if the store name starts with "Fake"
        if (store.storeName.toLowerCase().startsWith('fake')) {
            analysis.trustScore = 45;
            analysis.extractedName = "Suspicious Business Inc.";
            analysis.warnings.push("DATA MISMATCH: Extracted certificate name does not match registered store name.");
            analysis.checks[1].status = 'WARN';
        }

        res.json({
            success: true,
            analysis
        });
    } catch (error) {
        console.error('Verify proof error:', error);
        res.status(500).json({ success: false, message: 'AI Scan engine offline' });
    }
});

module.exports = router;

