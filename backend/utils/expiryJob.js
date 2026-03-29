const cron = require('node-cron');
const Offer = require('../models/Offer');
const Store = require('../models/Store');
const { sendPushNotificationToCustomers } = require('./notificationService');

/**
 * Scheduled job to check for expiring offers and notify customers.
 * Runs every day at 09:00 AM.
 */
const initExpiryJob = () => {
    // Cron schedule: minute hour dayOfMonth month dayOfWeek
    // '0 9 * * *' = Daily at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('⏰ Running daily offer expiry check...');
        try {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const twoDaysLater = new Date(now);
            twoDaysLater.setDate(twoDaysLater.getDate() + 2);

            // 1. Delete offers that have already expired
            const expiredOffers = await Offer.deleteMany({
                expiryDate: { $lt: now }
            });
            console.log(`Deleted ${expiredOffers.deletedCount} expired offers.`);

            // 2. Find offers expiring tomorrow (between 24h and 48h from now roughly)
            // For simplicity, we check if expiryDate is within the next 24-48 hours
            const expiringSoon = await Offer.find({
                expiryDate: { 
                    $gt: now, 
                    $lte: twoDaysLater 
                }
            }).populate('storeId', 'storeName');

            if (expiringSoon.length === 0) {
                console.log('No offers expiring in the next 48 hours.');
                return;
            }

            for (const offer of expiringSoon) {
                const diffTime = Math.abs(new Date(offer.expiryDate) - now);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                const storeName = offer.storeId ? offer.storeId.storeName : 'the store';
                const title = `⌛ Last chance at ${storeName}!`;
                const body = `Your favorite offer "${offer.title}" is going to expire in ${diffDays} day(s). Grab it now!`;

                await sendPushNotificationToCustomers(title, body, {
                    offerId: offer._id.toString(),
                    type: 'expiry_alert'
                });
            }
            
            console.log(`Expiry alerts sent for ${expiringSoon.length} offers.`);
        } catch (error) {
            console.error('Error in expiry job:', error);
        }
    });
    
    console.log('✅ Offer Expiry Cron Job initialized.');
};

module.exports = { initExpiryJob };
