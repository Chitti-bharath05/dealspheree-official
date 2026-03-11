import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from './apiClient';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Register for push notifications and return the Expo push token.
 * Only works on physical devices (not simulators/emulators).
 */
export async function registerForPushNotifications() {
    let token = null;

    // Push notifications only work on physical devices
    if (Platform.OS !== 'web' && !Device.isDevice) {
        console.log('Push notifications require a physical device.');
        return null;
    }

    try {
        // Check existing permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request permission if not already granted
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission not granted.');
            return null;
        }

        // Get the Expo push token
        try {
            const projectId = 
                Constants.expoConfig?.extra?.eas?.projectId || 
                Constants.easConfig?.projectId;

            const pushTokenData = await Notifications.getExpoPushTokenAsync({
                projectId: projectId,
            });
            token = pushTokenData.data;
            console.log('Expo Push Token:', token);
        } catch (tokenError) {
            console.log('Push Token skipped (Firebase not initialized or running in Expo Go Android):', tokenError.message);
        }
    } catch (error) {
        console.error('Error in push notification registration:', error);
    }

    // Set up Android notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('offers', {
            name: 'New Offers',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF6B6B',
            sound: 'default',
        });
    }

    return token;
}

/**
 * Save the push token to the backend for the logged-in user.
 */
export async function savePushTokenToBackend(pushToken) {
    try {
        await apiClient.post('/auth/push-token', { pushToken });
        console.log('Push token saved to backend.');
    } catch (error) {
        console.error('Error saving push token to backend:', error);
    }
}
