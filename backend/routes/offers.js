const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const Store = require('../models/Store');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validation');
const { sendPushNotificationToAll } = require('../utils/notificationService');

// Get all offers (Public)
router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};

        if (category && category !== 'All') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const offers = await Offer.find(query).populate('storeId', 'storeName location logoUrl bannerUrl');
        res.json(offers);
    } catch (error) {
        console.error('API Error in GET /api/offers:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Get single offer (Public)
router.get('/:id', async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id).populate('storeId');
        if (offer) {
            res.json(offer);
        } else {
            res.status(404).json({ message: 'Offer not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create new offer (Protected: Store Owner, Admin)
router.post('/', protect, authorize('store_owner', 'admin'), validateRequest('addOffer'), async (req, res) => {
    try {
        const { title, description, discount, originalPrice, storeId, expiryDate, category, isOnline, platformLink, image } = req.body;
        
        const newOffer = await Offer.create({
            title,
            description,
            discount,
            originalPrice,
            storeId,
            expiryDate,
            category,
            isOnline: !!isOnline,
            platformLink: platformLink || null,
            image: image || null
        });

        // Send push notification to all customers
        try {
            const store = await Store.findById(storeId);
            const storeName = store ? store.storeName : 'A store';
            await sendPushNotificationToAll(
                `🔥 New ${discount}% Off Deal!`,
                `${title} at ${storeName}. Don't miss out!`,
                { offerId: newOffer._id.toString(), type: 'new_offer' }
            );
        } catch (notifError) {
            console.error('Push notification error (non-blocking):', notifError);
        }

        res.status(201).json({ success: true, offer: newOffer });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update offer (Protected: Store Owner, Admin)
router.put('/:id', protect, authorize('store_owner', 'admin'), validateRequest('updateOffer'), async (req, res) => {
    try {
        const updatedOffer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        if (updatedOffer) {
            res.json({ success: true, offer: updatedOffer });
        } else {
            res.status(404).json({ success: false, message: 'Offer not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete offer (Protected: Store Owner, Admin)
router.delete('/:id', protect, authorize('store_owner', 'admin'), async (req, res) => {
    try {
        const deletedOffer = await Offer.findByIdAndDelete(req.params.id);
        
        if (deletedOffer) {
            res.json({ success: true, message: 'Offer deleted' });
        } else {
            res.status(404).json({ success: false, message: 'Offer not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Increment offer views (Public)
router.post('/:id/view', async (req, res) => {
    try {
        const offer = await Offer.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        );
        if (offer) {
            res.json({ success: true, views: offer.views });
        } else {
            res.status(404).json({ success: false, message: 'Offer not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
