const mongoose = require('mongoose');
require('dotenv').config();

async function checkStores() {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) throw new Error('No MONGO_URI found in .env');
        
        await mongoose.connect(uri);
        const Store = require('./models/Store');
        const pending = await Store.find({ approved: false });
        console.log(`\n--- DATABASE CHECK ---`);
        console.log(`Pending Stores: ${pending.length}`);
        pending.forEach(s => console.log(`- ${s.storeName} (Owner: ${s.ownerId})`));
        console.log(`----------------------\n`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkStores();
