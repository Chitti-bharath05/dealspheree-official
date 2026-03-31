const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    discount: { type: Number, required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    expiryDate: { type: Date, required: true },
    image: { type: String, default: null },
    category: { type: String, required: true },
    originalPrice: { type: Number, required: true },
    isOnline: { type: Boolean, default: false },
    platformLink: { type: String, default: null },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
