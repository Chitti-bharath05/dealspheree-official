import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiClient';
import { registerForPushNotifications, savePushTokenToBackend } from '../services/notificationService';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication'; // Assuming this will be added if needed, or using a generic flow
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUser();
        fetchUsers();
    }, []);

    const loadUser = async () => {
        try {
            const stored = await AsyncStorage.getItem('userInfo');
            if (stored) {
                const parsedUser = JSON.parse(stored);
                setUser(parsedUser);
                if (parsedUser.role === 'customer') {
                    fetchFavorites();
                }
                // Register push notifications for returning users
                setupPushNotifications();
            }
        } catch (e) {
            console.log('Error loading user:', e);
        }
    };

    const setupPushNotifications = async () => {
        try {
            console.log("Starting push notification setup...");
            try {
                const token = await registerForPushNotifications();
                if (token) {
                    await savePushTokenToBackend(token);
                }
            } catch (innerError) {
                console.log('Inner push setup error safely caught:', innerError);
            }
        } catch (e) {
            console.log('Push notification setup error (safely caught):', e);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await apiClient.get('/auth/users');
            if (Array.isArray(response)) {
                setUsers(response);
            }
        } catch (e) {
            console.log('Error fetching users:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFavorites = async () => {
        try {
            const response = await apiClient.get('/auth/favorites');
            if (response.success) {
                // We only need the IDs for the local state to show the heart icon accurately
                setFavorites(response.favorites.map(f => f._id || f.id));
            }
        } catch (e) {
            console.log('Error fetching favorites:', e);
        }
    };

    const toggleFavorite = async (offerId) => {
        try {
            const response = await apiClient.post(`/auth/favorites/toggle/${offerId}`);
            if (response.success) {
                setFavorites(response.favorites);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error toggling favorite:', e);
            return false;
        }
    };

    const login = async (email, password) => {
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            if (response.success) {
                setUser(response.user);
                await AsyncStorage.setItem('userInfo', JSON.stringify(response.user));
                setupPushNotifications();
                return { success: true, user: response.user };
            }
            return { success: false, message: response.message || 'Login failed' };
        } catch (error) {
            return { success: false, message: error.message || 'An error occurred during login' };
        }
    };

    const register = async (name, email, password, role, mobileNumber) => {
        try {
            const response = await apiClient.post('/auth/register', { name, email, password, role, mobileNumber });
            if (response.success) {
                setUser(response.user);
                await AsyncStorage.setItem('userInfo', JSON.stringify(response.user));
                setupPushNotifications();
                return { success: true, user: response.user };
            }
            return { success: false, message: response.message || 'Registration failed' };
        } catch (error) {
            return { success: false, message: error.message || 'An error occurred during registration' };
        }
    };

    const socialLogin = async (provider, socialData) => {
        try {
            const response = await apiClient.post('/auth/social-login', { 
                provider, 
                email: socialData.email,
                name: socialData.name,
                socialId: socialData.id,
                profileImage: socialData.picture || socialData.avatar,
                role: socialData.role
            });
            
            if (response.success) {
                setUser(response.user);
                await AsyncStorage.setItem('userInfo', JSON.stringify(response.user));
                setupPushNotifications();
                return { success: true, user: response.user };
            }
            return { 
                success: false, 
                requiresRole: response.requiresRole, 
                message: response.message || 'Social login failed' 
            };
        } catch (error) {
            console.error('Social login error:', error);
            return { success: false, message: error.message || 'An error occurred during social login' };
        }
    };

    const logout = async () => {
        try {
            const stored = await AsyncStorage.getItem('userInfo');
            
            // Clear local state FIRST, so the UI updates immediately
            await AsyncStorage.removeItem('userInfo');
            setUser(null);

            if (stored) {
                const { refreshToken } = JSON.parse(stored);
                if (refreshToken) {
                    // Fire and forget the backend logout
                    apiClient.post('/auth/logout', { refreshToken }).catch(e => {
                        console.log('Backend logout failed silently:', e.message);
                    });
                }
            }
        } catch (e) {
            console.error('Logout error:', e);
            // Ensure state is cleared even if something went wrong
            await AsyncStorage.removeItem('userInfo').catch(() => {});
            setUser(null);
        }
    };

    const updateProfile = async (updatedData) => {
        try {
            const updatedUser = { ...user, ...updatedData };
            setUser(updatedUser);
            await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
            return true;
        } catch (e) {
            console.error('Error updating profile:', e);
            return false;
        }
    };

    const updateProfileImage = async (imageUri) => {
        return updateProfile({ profileImage: imageUri });
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                users,
                favorites,
                isLoading,
                login,
                register,
                logout,
                socialLogin,
                fetchUsers,
                fetchFavorites,
                toggleFavorite,
                updateProfile,
                updateProfileImage,
                setUser, // Exporting for direct state updates if needed
                deleteUser: (id) => setUsers(prev => prev.filter(u => (u._id || u.id) !== id)),
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
