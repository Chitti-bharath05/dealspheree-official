import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For local development:
// - Web: localhost works fine
// - Physical Device (Expo Go): Use your computer's local IP address
const BASE_URL = Platform.OS === 'web'
    ? 'http://localhost:5000/api'
    : 'http://192.168.0.109:5000/api'; // Your computer's LAN IP

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

apiClient.interceptors.request.use(
    async (config) => {
        try {
            const userInfoStr = await AsyncStorage.getItem('userInfo');
            if (userInfoStr) {
                const userInfo = JSON.parse(userInfoStr);
                if (userInfo.token) {
                    config.headers.Authorization = `Bearer ${userInfo.token}`;
                }
            }
        } catch (error) {
            console.error('Error fetching token', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const userInfoStr = await AsyncStorage.getItem('userInfo');
                if (userInfoStr) {
                    const userInfo = JSON.parse(userInfoStr);
                    if (userInfo.refreshToken) {
                        // Attempt to refresh
                        const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, {
                            refreshToken: userInfo.refreshToken
                        });

                        if (refreshRes.data.success) {
                            const newToken = refreshRes.data.token;
                            // Update storage
                            userInfo.token = newToken;
                            await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
                            
                            // Retry
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            return apiClient(originalRequest);
                        }
                    }
                }
            } catch (refreshError) {
                console.error('Token refresh failed', refreshError);
                // Optional: Trigger logout by clearing storage
                // await AsyncStorage.removeItem('userInfo');
            }
        }

        const message = error.response?.data?.message || error.message || 'An unknown error occurred';
        return Promise.reject({ ...error, message });
    }
);

export default apiClient;
