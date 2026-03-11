const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

const expo = new Expo();

/**
 * Send push notifications to all customers with valid push tokens.
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional extra data payload
 */
const sendPushNotificationToAll = async (title, body, data = {}) => {
    try {
        // Get all users with valid push tokens
        const users = await User.find({
            pushToken: { $exists: true, $ne: null, $ne: '' },
            role: 'customer'
        }).select('pushToken');

        if (users.length === 0) {
            console.log('No users with push tokens found.');
            return;
        }

        // Build notification messages
        const messages = [];
        for (const user of users) {
            if (!Expo.isExpoPushToken(user.pushToken)) {
                console.warn(`Invalid push token for user: ${user.pushToken}`);
                continue;
            }

            messages.push({
                to: user.pushToken,
                sound: 'default',
                title,
                body,
                data,
            });
        }

        // Send in chunks (Expo recommends batching)
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending push notification chunk:', error);
            }
        }

        console.log(`Push notifications sent: ${tickets.length} tickets`);
        return tickets;
    } catch (error) {
        console.error('Error in sendPushNotificationToAll:', error);
    }
};

module.exports = { sendPushNotificationToAll };
