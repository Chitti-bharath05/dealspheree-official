const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Store = require('../backend/models/Store');
const Offer = require('../backend/models/Offer');
const path = require('path');

// Load env variables
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const removeDummyStores = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        const dummyStoreNames = ['Fashion Hub', 'Tech World', 'Fresh Bites'];

        console.log('Finding dummy stores...');
        const dummyStores = await Store.find({ storeName: { $in: dummyStoreNames } });

        if (dummyStores.length === 0) {
            console.log('No dummy stores found. They might have already been deleted.');
        } else {
            console.log(`Found ${dummyStores.length} dummy stores to delete.`);
            
            for (const store of dummyStores) {
                console.log(`Deleting store: ${store.storeName} (ID: ${store._id})`);
                // Delete related offers as well
                const deletedOffers = await Offer.deleteMany({ storeId: store._id });
                console.log(`Deleted ${deletedOffers.deletedCount} offers associated with ${store.storeName}`);
                // Delete the store
                await Store.findByIdAndDelete(store._id);
            }
            console.log('Successfully deleted dummy stores and their offers.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error removing dummy stores:', error);
        process.exit(1);
    }
};

removeDummyStores();
