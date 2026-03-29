const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const Store = require('../backend/models/Store');

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mall-offers');
        console.log('Connected to MongoDB');

        const result = await Store.updateMany(
            { rating: { $exists: false } },
            [
                { $set: { rating: { $ifNull: ["$averageRating", 0] } } }
            ]
        );

        console.log(`Migration complete. Updated ${result.modifiedCount} stores.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
