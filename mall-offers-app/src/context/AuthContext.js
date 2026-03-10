import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiClient';

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
            }
        } catch (e) {
            console.log('Error loading user:', e);
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
                return { success: true, user: response.user };
            }
            return { success: false, message: response.message || 'Registration failed' };
        } catch (error) {
            return { success: false, message: error.message || 'An error occurred during registration' };
        }
    };

    const logout = async () => {
        try {
            const stored = await AsyncStorage.getItem('userInfo');
            if (stored) {
                const { refreshToken } = JSON.parse(stored);
                if (refreshToken) {
                    await apiClient.post('/auth/logout', { refreshToken });
                }
            }
            await AsyncStorage.removeItem('userInfo');
            setUser(null);
        } catch (e) {
            console.error('Logout error:', e);
            await AsyncStorage.removeItem('userInfo');
            setUser(null);
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
                fetchUsers,
                fetchFavorites,
                toggleFavorite,
                deleteUser: (id) => setUsers(prev => prev.filter(u => (u._id || u.id) !== id)),
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
