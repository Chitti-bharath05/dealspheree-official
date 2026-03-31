const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const Store = require('../backend/models/Store');

async function resetStats() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/dealsphere';
        console.log('Connecting to:', mongoUri);
        await mongoose.connect(mongoUri);

        const result = await Store.updateMany({}, {
            $set: {
                likes: 0,
                views: 0,
                ratings: [],
                averageRating: 0,
                rating: 0,
                likedBy: []
            }
        });

        console.log(`Success! Reset stats for ${result.modifiedCount} stores.`);
        process.exit(0);
    } catch (error) {
        console.error('Error resetting stats:', error);
        process.exit(1);
    }
}

resetStats();
