import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiClient';
import { registerForPushNotifications, savePushTokenToBackend } from '../services/notificationService';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication'; // Assuming this will be added if needed, or using a generic flow
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

const UI_SECURE_KEY = 'ds_login_creds';

const saveSecureCredentials = async (email, password) => {
    if (Platform.OS === 'web') return;
    try {
        await SecureStore.setItemAsync(UI_SECURE_KEY, JSON.stringify({ email, password }));
    } catch (e) {
        console.error('SecureStore Error:', e);
    }
};

const getSecureCredentials = async () => {
    if (Platform.OS === 'web') return null;
    try {
        const res = await SecureStore.getItemAsync(UI_SECURE_KEY);
        return res ? JSON.parse(res) : null;
    } catch (e) {
        console.error('SecureStore Read Error:', e);
        return null;
    }
};

const clearSecureCredentials = async () => {
    if (Platform.OS === 'web') return;
    try {
        await SecureStore.deleteItemAsync(UI_SECURE_KEY);
    } catch (e) {
        console.error('SecureStore Delete Error:', e);
    }
};

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
        // Safety net: never let the app stay loading forever
        const timeout = setTimeout(() => setIsLoading(false), 8000);
        return () => clearTimeout(timeout);
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
                setupPushNotifications();
            }
        } catch (e) {
            console.log('Error loading user:', e);
        } finally {
            setIsLoading(false); // Unblock UI even if no user stored
        }
    };

    const setupPushNotifications = async () => {
        try {
            console.log("Starting push notification setup...");
            try {
                // Expo Mobile Push
                if (Platform.OS !== 'web') {
                    const token = await registerForPushNotifications();
                    if (token) {
                        await savePushTokenToBackend(token);
                    }
                }
            } catch (innerError) {
                console.log('Inner push setup error safely caught:', innerError);
            }

            // Web Push for Browsers
            if (Platform.OS === 'web' && 'serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    const register = await navigator.serviceWorker.register('/sw.js');
                    const vapidRes = await apiClient.get('/notifications/vapidPublicKey');
                    if (vapidRes && vapidRes.publicKey) {
                        const convertedVapidKey = urlBase64ToUint8Array(vapidRes.publicKey);
                        
                        let subscription = await register.pushManager.getSubscription();
                        if (!subscription) {
                            subscription = await register.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: convertedVapidKey
                            });
                        }
                        
                        await apiClient.post('/notifications/subscribe', subscription);
                        console.log('Web Push Subscription saved.');
                    }
                } catch (webPushError) {
                    console.log('Web Push Setup Error (safely caught):', webPushError);
                }
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

    const login = async (email, password, rememberMe = false) => {
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            if (response.success) {
                setUser(response.user);
                
                // Persistence Logic
                if (Platform.OS === 'web') {
                    if (rememberMe) {
                        await AsyncStorage.setItem('userInfo', JSON.stringify(response.user));
                    } else {
                        // For web, if not rememberMe, we might still store but normally we'd rely on session
                        // In this app's current architecture, AsyncStorage is used for persistent login.
                        await AsyncStorage.setItem('userInfo', JSON.stringify(response.user));
                    }
                } else {
                    await AsyncStorage.setItem('userInfo', JSON.stringify(response.user));
                    
                    // If biometric setting is ON, save the password securely
                    const biometricEnabled = await AsyncStorage.getItem('settings_biometrics');
                    if (biometricEnabled === 'true') {
                        await saveSecureCredentials(email, password);
                    }
                }

                if (response.user.role === 'admin') fetchUsers();
                setupPushNotifications();
                return { success: true, user: response.user };
            }
            return { success: false, message: response.message || 'Login failed' };
        } catch (error) {
            return { success: false, message: error.message || 'An error occurred during login' };
        }
    };

    const loginWithBiometrics = async () => {
        if (Platform.OS === 'web') return { success: false, message: 'Not supported on web' };
        
        try {
            const creds = await getSecureCredentials();
            if (!creds) {
                return { success: false, message: 'No credentials stored for biometric login' };
            }

            // Just attempt a normal login with saved credentials
            return await login(creds.email, creds.password);
        } catch (e) {
            return { success: false, message: 'Biometric login sequence failed' };
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
                if (response.user.role === 'admin') fetchUsers();
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
            
            // Optionally clear biometric storage if we want a fresh start
            // and the user hasn't opted to "Always allow biometrics" 
            // but for convenience we'll keep them unless they toggle off in settings.
            
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
        try {
            // Save to backend so it persists across logins
            const response = await apiClient.put('/auth/profile', { profileImage: imageUri });
            if (response.success) {
                // Merge backend-confirmed data back into local state
                const updatedUser = { ...user, profileImage: response.user.profileImage };
                setUser(updatedUser);
                await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
                return true;
            }
            // Fallback: save locally even if backend failed
            return updateProfile({ profileImage: imageUri });
        } catch (e) {
            console.error('Error updating profile image:', e);
            // Fallback: still save locally so UX is not broken
            return updateProfile({ profileImage: imageUri });
        }
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
                deleteUser: async (id) => {
                    try {
                        const response = await apiClient.delete(`/auth/users/${id}`);
                        if (response.success) {
                            setUsers(prev => prev.filter(u => (u._id || u.id) !== id));
                            return true;
                        }
                        return false;
                    } catch (e) {
                        console.error('Error deleting user:', e);
                        return false;
                    }
                },
                loginWithBiometrics,
                saveSecureCredentials,
                clearSecureCredentials,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
