const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    storeName: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: String, required: true },
    houseNo: { type: String, default: '' },
    street: { type: String, default: '' },
    area: { type: String, default: '' },
    pincode: { type: String, default: '' },
    city: { type: String, default: '' },
    address: { type: String, default: '' },
    approved: { type: Boolean, default: false },
    category: { type: String, required: true },
    logoUrl: { type: String, default: null },
    bannerUrl: { type: String, default: null },
    hasDeliveryPartner: { type: Boolean, default: false },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    ratings: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        score: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now }
    }],
    averageRating: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);
