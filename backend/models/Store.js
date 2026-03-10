const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    storeName: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: String, required: true },
    address: { type: String, default: '' },
    approved: { type: Boolean, default: false },
    category: { type: String, required: true },
    logoUrl: { type: String, default: null },
    bannerUrl: { type: String, default: null },
    hasDeliveryPartner: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);
