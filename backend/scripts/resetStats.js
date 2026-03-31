const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('MONGO_URI not found in .env file');
    process.exit(1);
}

// Define schemas locally to avoid model registration issues
const StoreSchema = new mongoose.Schema({
    likes: Number,
    likedBy: Array,
    views: Number,
    rating: Number,
    averageRating: Number,
    ratings: Array
}, { strict: false });

const OfferSchema = new mongoose.Schema({
    views: Number,
    likes: Number,
    likedBy: Array
}, { strict: false });

const Store = mongoose.model('StoreMigration', StoreSchema, 'stores');
const Offer = mongoose.model('OfferMigration', OfferSchema, 'offers');

const resetStats = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully.');

        console.log('Resetting Store metrics...');
        const storeResult = await Store.updateMany({}, {
            $set: {
                likes: 0,
                likedBy: [],
                views: 0,
                rating: 0,
                averageRating: 0,
                ratings: []
            }
        });
        console.log(`Updated ${storeResult.modifiedCount} stores.`);

        console.log('Resetting Offer metrics...');
        const offerResult = await Offer.updateMany({}, {
            $set: {
                views: 0,
                likes: 0,
                likedBy: []
            }
        });
        console.log(`Updated ${offerResult.modifiedCount} offers.`);

        console.log('Stats reset complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting stats:', error);
        process.exit(1);
    }
};

resetStats();
