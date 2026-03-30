import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production API URL from Render:
const PROD_API_URL = 'https://dealspheree-official.onrender.com/api'; 
const DEV_API_URL = Platform.OS === 'web' ? 'http://localhost:5000/api' : 'http://192.168.1.xxx:5000/api';

const getBaseUrl = () => {
    // If we're on a browser, detect the hostname
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        console.log(`[apiClient] Current Hostname: ${hostname}`);
        
        // If the hostname is NOT localhost/127.0.0.1, it's a public domain deployment
        if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '') {
            console.log(`[apiClient] Public domain detected, using PROD_API_URL: ${PROD_API_URL}`);
            return PROD_API_URL;
        }
        
        // Even if __DEV__ is true, if we are on localhost but want to test production,
        // we can check if a query param exists (optional, let's keep it simple for now)
    }
    
    // Fallback to __DEV__ logic
    const url = __DEV__ ? DEV_API_URL : PROD_API_URL;
    console.log(`[apiClient] Using URL based on __DEV__ (${__DEV__}): ${url}`);
    return url;
};

const BASE_URL = getBaseUrl();

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000, // Increased to 60s for Render free-tier cold starts
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

                        if (refreshRes.status === 200 && refreshRes.data.success) {
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
                // If the refresh itself fails with 403, we should clear the session
                if (refreshError.response?.status === 403) {
                    console.log('[apiClient] Refresh token invalid/expired, clearing session');
                    await AsyncStorage.removeItem('userInfo');
                    // Optional: trigger a real-time event for UI to respond (e.g., via a context)
                }
            }
        }

        const message = error.response?.data?.message || error.message || 'An unknown error occurred';
        return Promise.reject({ ...error, message });
    }
);

export default apiClient;
