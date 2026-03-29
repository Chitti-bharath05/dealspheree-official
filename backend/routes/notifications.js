const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');
const { sendPushNotificationToAll } = require('../utils/notificationService');

// Get VAPID Public Key
router.get('/vapidPublicKey', (req, res) => {
    if (!process.env.VAPID_PUBLIC_KEY) {
        return res.status(500).json({ success: false, message: 'VAPID public key not configured on server' });
    }
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Subscribe to Web Push
router.post('/subscribe', protect, async (req, res) => {
    try {
        const subscription = req.body;
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ success: false, message: 'Invalid subscription object' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Initialize array if it doesn't exist
        if (!user.webPushSubscriptions) {
            user.webPushSubscriptions = [];
        }

        // Check if subscription already exists
        const exists = user.webPushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
        if (!exists) {
            user.webPushSubscriptions.push(subscription);
            await user.save();
        }

        res.status(201).json({ success: true, message: 'Subscribed to web push successfully.' });
    } catch (error) {
        console.error('Web Push Subscribe Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Broadcast Web Push (Admin or Store Owner can use it manually if needed)
router.post('/broadcast', protect, authorize('admin'), async (req, res) => {
    try {
        const { title, body, data } = req.body;
        await sendPushNotificationToAll(title || 'New Deal Alert!', body || 'Check out our latest offers', data);
        res.json({ success: true, message: 'Broadcast triggered process' });
    } catch (error) {
        console.error('Web Push Broadcast Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
