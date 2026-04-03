const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const User = require('../models/User');
const Offer = require('../models/Offer');
const SystemLog = require('../models/SystemLog');
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
        const { storeName, ownerId, location, houseNo, street, area, pincode, city, address, category, logoUrl, bannerUrl, businessProofUrl, hasDeliveryPartner, lat, lng } = req.body;
        
        // 🔒 Security check: OwnerId must match authenticated user
        // 🔒 Security check: OwnerId must match authenticated user
        const authenticatedUserId = req.user._id.toString();
        if (ownerId.toString() !== authenticatedUserId) {
            console.error(`[Stores] Security Breach attempt: ${req.user.email} tried to register for ${ownerId}`);
            return res.status(403).json({ success: false, message: 'You can only register stores for your own account.' });
        }

        // 🛡️ Prevent duplicate store names for the same owner
        const existingStore = await Store.findOne({ 
            storeName: { $regex: new RegExp(`^${storeName.trim()}$`, 'i') }, 
            ownerId: authenticatedUserId
        });
        
        if (existingStore) {
            return res.status(400).json({ success: false, message: 'You already have a store registered with this name.' });
        }

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
            logoUrl: logoUrl || '',
            bannerUrl: bannerUrl || '',
            businessProofUrl: businessProofUrl || '',
            hasDeliveryPartner: hasDeliveryPartner || false,
            lat: lat || null,
            lng: lng || null,
            approved: false 
        });

        // 📧 Notify Admins (Non-blocking but optimized)
        try {
            const admins = await User.find({ role: 'admin' }).select('email');
            const owner = await User.findById(ownerId);
            
            if (admins && admins.length > 0) {
                const message = `A new store "${storeName}" has been registered by ${owner?.name || 'a store owner'} and is waiting for your approval.\n\nView and manage at: https://dealspheree.in/admin`;
                
                // Use Promise.all for faster execution
                await Promise.all([
                    sendPushNotificationToAdmins(
                        "New Store Registration",
                        `${storeName} by ${owner?.name || 'a store owner'} is waiting for approval.`,
                        { storeId: newStore._id.toString(), type: 'new_store' }
                    ),
                    ...admins.map(admin => 
                        sendEmail({
                            email: admin.email,
                            subject: "🔔 ACTION REQUIRED: New Store Registered on DealSpheree",
                            message: message
                        })
                    )
                ]);
                console.log(`[Stores] Notifications sent to ${admins.length} admins.`);
            } else {
                console.warn('[Stores] No admins found to notify about new store registration.');
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
                        subject: 'Your Store is Accepted!',
                        message: `Congratulations! Your store "${store.storeName}" is accepted by the team dealsphere.\n\nYou can now log in and start adding exclusive offers for your customers.`
                    });
                }
            } catch (emailErr) {
                console.error('Email notification failed to send on approval:', emailErr);
            }

            // Create System Alert
            await SystemLog.create({
                type: 'success',
                title: 'New Partner Verified',
                message: `${store.storeName} was approved and is now live.`,
                color: '#F5C518'
            });

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
        const store = await Store.findById(req.params.id).populate('ownerId', 'email name');
        if (store) {
            try {
                if (store.ownerId && store.ownerId.email) {
                    await sendEmail({
                        email: store.ownerId.email,
                        subject: '🚨 Store Registration Status: Rejected',
                        message: `Hello,\n\nWe regret to inform you that your store registration for "${store.storeName}" has been declined by the DealSpheree administration.\n\nCommon reasons for rejection include:\n- Invalid business proof\n- Missing storefront photos\n- Inaccurate location details\n\nYou can re-register your store with the correct details anytime. If you have any questions, please contact our support team.\n\nBest regards,\nDealSpheree Administration`
                    });
                }
            } catch (emailErr) {
                console.error('Email notification failed to send on rejection:', emailErr);
            }
            
            await Store.findByIdAndDelete(req.params.id);

            // Create System Alert
            await SystemLog.create({
                type: 'warning',
                title: 'Store Registration Rejected',
                message: `${store.storeName}'s application was rejected and removed.`,
                color: '#FF3B30'
            });

            res.json({ success: true, message: 'Store rejected and removed' });
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
        // We explicitly EXCLUDE internal stats like likes, rating, views from being updated here
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

        const newRating = {
            user: req.user._id,
            score,
            comment: comment || ''
        };

        // Atomic push and update
        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            { $push: { ratings: newRating } },
            { new: true }
        );

        // Recalculate average rating
        const totalScore = updatedStore.ratings.reduce((acc, curr) => acc + curr.score, 0);
        const averageRating = totalScore / updatedStore.ratings.length;

        updatedStore.averageRating = averageRating;
        updatedStore.rating = averageRating;
        await updatedStore.save();

        res.json({ success: true, store: updatedStore });
    } catch (error) {
        console.error('Rating error:', error);
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
        const storeId = req.params.id;
        const userId = req.user._id;

        const store = await Store.findById(storeId);
        if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

        // Ensure store.likedBy exists
        if (!store.likedBy) store.likedBy = [];
        
        const isLiked = store.likedBy.some(id => id.toString() === userId.toString());

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

        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            update,
            { new: true }
        );

        // Ensure likes doesn't go below 0 due to concurrency edge cases
        if (updatedStore.likes < 0) {
            updatedStore.likes = 0;
            await updatedStore.save();
        }

        res.json({ 
            success: true, 
            likes: updatedStore.likes, 
            likedBy: updatedStore.likedBy, // Return full list or just status
            isLiked: !isLiked 
        });
    } catch (error) {
        console.error('Store Like error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
