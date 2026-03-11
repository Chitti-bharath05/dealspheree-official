const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validation');

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
        const { storeName, ownerId, location, houseNo, street, area, pincode, city, address, category, logoUrl, bannerUrl, hasDeliveryPartner } = req.body;
        
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
            approved: false 
        });

        res.status(201).json({ success: true, store: newStore });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Approve store (Protected: Admin only)
router.put('/:id/approve', protect, authorize('admin'), async (req, res) => {
    try {
        const store = await Store.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
        if (store) {
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
        const deletedStore = await Store.findByIdAndDelete(req.params.id);
        if (deletedStore) {
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
        const { storeName, location, houseNo, street, area, pincode, city, address, category, logoUrl, bannerUrl, hasDeliveryPartner } = req.body;
        const store = await Store.findById(req.params.id);

        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        // Check ownership (admins can also update)
        if (store.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const updatedStore = await Store.findByIdAndUpdate(
            req.params.id,
            { storeName, location, houseNo, street, area, pincode, city, address, category, logoUrl, bannerUrl, hasDeliveryPartner },
            { new: true }
        );

        res.json({ success: true, store: updatedStore });
    } catch (error) {
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

        await store.save();

        res.json({ success: true, store });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
