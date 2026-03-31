const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const Store = require('../models/Store');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validation');
const { sendPushNotificationToCustomers } = require('../utils/notificationService');

// Get all offers (Public)
router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {
            expiryDate: { $gte: new Date() } // Filter out expired offers
        };

        if (category && category !== 'All') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const offers = await Offer.find(query).populate('storeId', 'storeName location logoUrl bannerUrl lat lng houseNo street area city pincode');
        res.json(offers);
    } catch (error) {
        console.error('API Error in GET /api/offers:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Get single offer (Public)
router.get('/:id', async (req, res) => {
    try {
        const offer = await Offer.findOne({ 
            _id: req.params.id, 
            expiryDate: { $gte: new Date() } 
        }).populate('storeId');
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
        
        // 🔒 Check if the store is approved before allowing offer creation
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }
        if (!store.approved) {
            return res.status(403).json({ 
                success: false, 
                message: 'Your store registration is pending review. Offers can only be added to approved stores.' 
            });
        }

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
            const storeName = store.storeName || 'A store';
            await sendPushNotificationToCustomers(
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
        // Exclude stats from being updated via this route
        const { title, description, discount, originalPrice, storeId, expiryDate, category, isOnline, platformLink, image } = req.body;
        const updateFields = {};
        if (title !== undefined) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (discount !== undefined) updateFields.discount = discount;
        if (originalPrice !== undefined) updateFields.originalPrice = originalPrice;
        if (storeId !== undefined) updateFields.storeId = storeId;
        if (expiryDate !== undefined) updateFields.expiryDate = expiryDate;
        if (category !== undefined) updateFields.category = category;
        if (isOnline !== undefined) updateFields.isOnline = isOnline;
        if (platformLink !== undefined) updateFields.platformLink = platformLink;
        if (image !== undefined) updateFields.image = image;

        const updatedOffer = await Offer.findByIdAndUpdate(
            req.params.id, 
            { $set: updateFields }, 
            { new: true }
        );
        
        if (updatedOffer) {
            res.json({ success: true, offer: updatedOffer });
        } else {
            res.status(404).json({ success: false, message: 'Offer not found' });
        }
    } catch (error) {
        console.error('Update offer error:', error);
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

// Toggle offer like (Protected: Customer only)
router.post('/:id/like', protect, async (req, res) => {
    try {
        const offerId = req.params.id;
        const userId = req.user._id;

        const offer = await Offer.findById(offerId);
        if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });

        // Ensure offer.likedBy exists
        if (!offer.likedBy) offer.likedBy = [];

        const isLiked = offer.likedBy.some(id => id.toString() === userId.toString());

        let update;
        if (isLiked) {
            update = {
                $pull: { likedBy: userId },
                $inc: { likes: -1 }
            };
        } else {
            update = {
                $addToSet: { likedBy: userId },
                $inc: { likes: 1 }
            };
        }

        const updatedOffer = await Offer.findByIdAndUpdate(
            offerId,
            update,
            { new: true }
        );

        if (updatedOffer.likes < 0) {
            updatedOffer.likes = 0;
            await updatedOffer.save();
        }

        res.json({ 
            success: true, 
            likes: updatedOffer.likes, 
            isLiked: !isLiked 
        });
    } catch (error) {
        console.error('Offer Like error:', error);
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
