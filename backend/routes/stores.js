const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const User = require('../models/User');
const Offer = require('../models/Offer');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validation');
const { sendPushNotificationToAdmins } = require('../utils/notificationService');
const sendEmail = require('../utils/emailService');

// Get all stores (Public)
router.get('/', async (req, res) => {
    try {
        const stores = await Store.find().populate('ownerId', 'name email');
        res.json(stores);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get store by ID (Public)
router.get('/:id', async (req, res) => {
    try {
        const store = await Store.findById(req.params.id).populate('ownerId', 'name email');
        if (store) {
            res.json(store);
        } else {
            res.status(404).json({ message: 'Store not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get store by owner ID (Public)
router.get('/owner/:ownerId', async (req, res) => {
    try {
        const userStores = await Store.find({ ownerId: req.params.ownerId });
        res.json(userStores);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create new store (Protected)
router.post('/', protect, validateRequest('registerStore'), async (req, res) => {
    try {
        const { storeName, ownerId, location, houseNo, street, area, pincode, city, address, category, logoUrl, bannerUrl, hasDeliveryPartner, lat, lng } = req.body;
        
        const newStore = await Store.create({
            storeName,
            ownerId, 
            location,
            houseNo: houseNo || '',
            street: street || '',
            area: area || '',
            pincode: pincode || '',
            city: city || '',
            address: address || '',
            category,
            logoUrl: logoUrl || null,
            bannerUrl: bannerUrl || null,
            hasDeliveryPartner: !!hasDeliveryPartner,
            lat: lat || null,
            lng: lng || null,
            approved: false 
        });

        // 🚀 Trigger Admin Notifications (Push & Email)
        try {
            const owner = await User.findById(ownerId);
            const ownerName = owner ? owner.name : 'Unknown User';
            
            const message = `🏢 New Store Registration Alert!\n\nStore: ${storeName}\nOwner: ${ownerName}\nLocation: ${location}\n\nPlease log in to the admin panel to review.`;

            // 1. Send Push Notification to all admins
            await sendPushNotificationToAdmins(
                "New Store Registration",
                `${storeName} by ${ownerName} is waiting for approval.`,
                { storeId: newStore._id.toString(), type: 'new_store' }
            );

            // 2. Send Emails to all admins
            const admins = await User.find({ role: 'admin' }).select('email');
            for (const admin of admins) {
                await sendEmail({
                    email: admin.email,
                    subject: "Action Required: New Store Registered",
                    message: message
                });
            }
        } catch (notifError) {
            console.error('Admin notification error (non-blocking):', notifError);
        }

        res.status(201).json({ success: true, store: newStore });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Approve store (Protected: Admin only)
router.put('/:id/approve', protect, authorize('admin'), async (req, res) => {
    try {
        const store = await Store.findByIdAndUpdate(req.params.id, { approved: true }, { new: true }).populate('ownerId', 'email name');
        if (store) {
            try {
                if (store.ownerId && store.ownerId.email) {
                    await sendEmail({
                        email: store.ownerId.email,
                        subject: 'Your Store is Approved!',
                        message: `Congratulations! Your store "${store.storeName}" has been approved on DealSphere.\n\nYou can now log in and start adding exclusive offers for your customers.`
                    });
                }
            } catch (emailErr) {
                console.error('Email notification failed to send on approval:', emailErr);
            }
            res.json({ success: true, store });
        } else {
            res.status(404).json({ success: false, message: 'Store not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Reject/Delete store (Protected: Admin only)
router.put('/:id/reject', protect, authorize('admin'), async (req, res) => {
    try {
        // Here rejection behaves as deletion for now, mimicking previous behavior
        const deletedStore = await Store.findByIdAndDelete(req.params.id).populate('ownerId', 'email name');
        if (deletedStore) {
            try {
                if (deletedStore.ownerId && deletedStore.ownerId.email) {
                    await sendEmail({
                        email: deletedStore.ownerId.email,
                        subject: 'Store Registration Update',
                        message: `Hello, we regret to inform you that your store registration for "${deletedStore.storeName}" has been rejected.\n\nFor more information on listing rules, please contact DealSphere support.`
                    });
                }
            } catch (emailErr) {
                console.error('Email notification failed to send on rejection:', emailErr);
            }
            res.json({ success: true, message: 'Store rejected' });
        } else {
            res.status(404).json({ success: false, message: 'Store not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update store (Protected: Owner or Admin)
router.put('/:id', protect, async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);

        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        // Handle both populated object and raw ObjectId for ownerId
        const storeOwnerId = store.ownerId?._id
            ? store.ownerId._id.toString()
            : store.ownerId.toString();

        if (storeOwnerId !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Build update object with only fields that are actually provided
        const { storeName, location, houseNo, street, area, pincode, city, address, category, logoUrl, bannerUrl, hasDeliveryPartner, lat, lng } = req.body;
        const updateFields = {};
        if (storeName !== undefined) updateFields.storeName = storeName;
        if (location !== undefined) updateFields.location = location;
        if (houseNo !== undefined) updateFields.houseNo = houseNo;
        if (street !== undefined) updateFields.street = street;
        if (area !== undefined) updateFields.area = area;
        if (pincode !== undefined) updateFields.pincode = pincode;
        if (city !== undefined) updateFields.city = city;
        if (address !== undefined) updateFields.address = address;
        if (category !== undefined) updateFields.category = category;
        if (logoUrl !== undefined) updateFields.logoUrl = logoUrl;
        if (bannerUrl !== undefined) updateFields.bannerUrl = bannerUrl;
        if (hasDeliveryPartner !== undefined) updateFields.hasDeliveryPartner = hasDeliveryPartner;
        if (lat !== undefined) updateFields.lat = lat;
        if (lng !== undefined) updateFields.lng = lng;

        const updatedStore = await Store.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: false }
        );

        res.json({ success: true, store: updatedStore });
    } catch (error) {
        console.error('Update store error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// Delete store and related offers (Protected: Owner or Admin)
router.delete('/:id', protect, async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);

        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        const storeOwnerId = store.ownerId?._id 
            ? store.ownerId._id.toString() 
            : store.ownerId.toString();

        if (storeOwnerId !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this store' });
        }

        // Delete the store and all matching offers cascading
        await Store.findByIdAndDelete(req.params.id);
        await Offer.deleteMany({ storeId: req.params.id });

        res.json({ success: true, message: 'Store and related offers permanently deleted' });
    } catch (error) {
        console.error('Delete store error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add rating to store (Protected: Customer only)
router.post('/:id/rate', protect, async (req, res) => {
    try {
        const { score, comment } = req.body;
        const storeId = req.params.id;

        if (!score || score < 1 || score > 5) {
            return res.status(400).json({ success: false, message: 'Invalid score' });
        }

        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        const existingRating = store.ratings.find(
            r => r.user && r.user.toString() === req.user._id.toString()
        );
        if (existingRating) {
            return res.status(400).json({ success: false, message: "Rating already submitted, can't be modified" });
        }

        // Add new rating
        const newRating = {
            user: req.user._id,
            score,
            comment: comment || ''
        };

        store.ratings.push(newRating);

        // Recalculate average rating
        const totalScore = store.ratings.reduce((acc, curr) => acc + curr.score, 0);
        store.averageRating = totalScore / store.ratings.length;
        store.rating = store.averageRating;

        await store.save();

        res.json({ success: true, store });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Increment store views (Public)
router.post('/:id/view', async (req, res) => {
    try {
        const store = await Store.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        );
        if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
        res.json({ success: true, views: store.views });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Toggle store like (Protected: Customer only)
router.post('/:id/like', protect, async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

        const userId = req.user._id.toString();
        const isLiked = store.likedBy.some(id => id.toString() === userId);

        if (isLiked) {
            // Unlike: Remove from likedBy and decrement likes
            store.likedBy = store.likedBy.filter(id => id.toString() !== userId);
            store.likes = Math.max(0, store.likes - 1);
        } else {
            // Like: Add to likedBy and increment likes
            store.likedBy.push(req.user._id);
            store.likes += 1;
        }

        await store.save();
        res.json({ success: true, likes: store.likes, isLiked: !isLiked });
    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
