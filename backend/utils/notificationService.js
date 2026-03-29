const { Expo } = require('expo-server-sdk');
const webpush = require('web-push');
const User = require('../models/User');

const expo = new Expo();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        `mailto:${process.env.EMAIL_FROM || 'admin@dealsphere.com'}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

/**
 * Send push notifications to users based on their role.
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string|null} role - Target role (e.g., 'customer', 'admin') or null for all
 * @param {object} data - Optional extra data payload
 */
const sendPushNotifications = async (title, body, role = null, data = {}) => {
    try {
        const query = { 
            $or: [
                { pushToken: { $exists: true, $ne: null, $ne: '' } },
                { 'webPushSubscriptions.0': { $exists: true } }
            ]
        };
        if (role) query.role = role;

        const users = await User.find(query).select('pushToken webPushSubscriptions');

        if (users.length === 0) {
            console.log(`No users with role ${role || 'any'} and push tokens found.`);
            return;
        }

        const messages = [];
        const webPushPromises = [];

        for (const user of users) {
            // Expo Mobile Push
            if (user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
                messages.push({
                    to: user.pushToken,
                    sound: 'default',
                    title,
                    body,
                    data,
                });
            }

            // Web Push (Browser)
            if (user.webPushSubscriptions && user.webPushSubscriptions.length > 0) {
                const payload = JSON.stringify({
                    title,
                    body,
                    data
                });
                for (const sub of user.webPushSubscriptions) {
                    webPushPromises.push(
                        webpush.sendNotification(sub, payload).catch(err => {
                            if (err.statusCode === 410 || err.statusCode === 404) {
                                // Subscription expired or is invalid, should be removed
                                console.log('Subscription expired, removing...');
                                user.webPushSubscriptions = user.webPushSubscriptions.filter(s => s.endpoint !== sub.endpoint);
                                user.save().catch(e => console.error('Failed to save user after removing dead sub:', e));
                            } else {
                                console.error('Web push error:', err);
                            }
                        })
                    );
                }
            }
        }

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
        
        // Wait for all web pushes to try
        await Promise.allSettled(webPushPromises);

        console.log(`Push notifications sent: ${tickets.length} Expo tickets, ${webPushPromises.length} Web pushes to ${role || 'all users'}`);
        return { expoTickets: tickets.length, webPushes: webPushPromises.length };
    } catch (error) {
        console.error('Error in sendPushNotifications:', error);
    }
};

const sendPushNotificationToAll = (title, body, data = {}) => sendPushNotifications(title, body, null, data);
const sendPushNotificationToCustomers = (title, body, data = {}) => sendPushNotifications(title, body, 'customer', data);
const sendPushNotificationToAdmins = (title, body, data = {}) => sendPushNotifications(title, body, 'admin', data);

module.exports = { 
    sendPushNotificationToAll, 
    sendPushNotificationToCustomers, 
    sendPushNotificationToAdmins 
};
