import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    // --- Data Fetching with React Query ---

    const {
        data: stores = [],
        isLoading: isLoadingStores,
        refetch: refetchStores
    } = useQuery({
        queryKey: ['stores'],
        queryFn: () => apiClient.get('/stores'),
    });

    const {
        data: offers = [],
        isLoading: isLoadingOffers,
        refetch: refetchOffers
    } = useQuery({
        queryKey: ['offers'],
        queryFn: () => apiClient.get('/offers'),
    });

    const {
        data: categories = [],
        isLoading: isLoadingCategories
    } = useQuery({
        queryKey: ['categories'],
        queryFn: () => apiClient.get('/categories'),
    });

    const {
        data: ordersData = [],
        isLoading: isLoadingOrders,
        refetch: refetchOrders
    } = useQuery({
        queryKey: ['orders', user?._id || user?.id],
        queryFn: async () => {
            if (!user) return [];
            try {
                const userId = user._id || user.id;
                // Fetch user orders. Note: backend route is /api/orders/user/:userId
                const res = await apiClient.get(`/orders/user/${userId}`);
                return res; 
            } catch (err) {
                console.error('Error fetching orders:', err);
                return [];
            }
        },
        enabled: !!user,
    });

    const orders = ordersData || [];

    // ---- Store operations ----
    const registerStore = async (storeName, ownerId, location, address, category, logoUrl, bannerUrl, hasDeliveryPartner) => {
        try {
            await apiClient.post('/stores', { storeName, ownerId, location, address, category, logoUrl, bannerUrl, hasDeliveryPartner });
            refetchStores();
        } catch (e) {
            console.error('Error registering store:', e);
            throw e;
        }
    };

    const updateStore = async (storeId, updates) => {
        try {
            // updates object can now include hasDeliveryPartner
            await apiClient.put(`/stores/${storeId}`, updates);
            refetchStores();
        } catch (e) {
            console.error('Error updating store:', e);
            throw e;
        }
    };

    const approveStore = async (storeId) => {
        try {
            await apiClient.put(`/stores/${storeId}/approve`);
            refetchStores();
        } catch (e) {
            console.error('Error approving store:', e);
            throw e;
        }
    };

    const rejectStore = async (storeId) => {
        try {
            await apiClient.put(`/stores/${storeId}/reject`);
            refetchStores();
        } catch (e) {
            console.error('Error rejecting store:', e);
            throw e;
        }
    };

    const getStoresByOwner = (ownerId) => {
        return stores.filter((s) => {
            const sOwnerId = s.ownerId?._id || s.ownerId;
            return sOwnerId === ownerId;
        });
    };

    const getApprovedStores = () => {
        return stores.filter((s) => s.approved);
    };

    const getPendingStores = () => {
        return stores.filter((s) => !s.approved);
    };

    const getStoreById = (storeId) => {
        return stores.find((s) => (s._id || s.id) === storeId);
    };

    // ---- Offer operations ----
    const addOffer = async (offerData) => {
        try {
            await apiClient.post('/offers', offerData);
            await refetchOffers();
        } catch (e) {
            console.error('Error adding offer:', e);
            throw e;
        }
    };

    const updateOffer = async (offerId, updates) => {
        try {
            await apiClient.put(`/offers/${offerId}`, updates);
            await refetchOffers();
        } catch (e) {
            console.error('Error updating offer:', e);
            throw e;
        }
    };

    const deleteOffer = async (offerId) => {
        try {
            await apiClient.delete(`/offers/${offerId}`);
            await refetchOffers();
        } catch (e) {
            console.error('Error deleting offer:', e);
            throw e;
        }
    };

    const getOffersByStore = (storeId) => {
        return offers.filter((o) => {
            const oStoreId = o.storeId?._id || o.storeId;
            return oStoreId === storeId;
        });
    };

    const getActiveOffers = () => {
        const now = new Date();
        return offers.filter((o) => {
            const storeId = o.storeId?._id || o.storeId;
            const store = stores.find((s) => (s._id || s.id) === storeId);
            return store && store.approved && new Date(o.expiryDate) >= now;
        });
    };

    const getOfferById = (offerId) => {
        return offers.find((o) => (o._id || o.id) === offerId);
    };

    // ---- Order operations ----
    const placeOrder = async (...args) => {
        try {
            let payload;
            if (args.length === 1 && typeof args[0] === 'object') {
                payload = args[0];
            } else {
                payload = { userId: args[0], items: args[1], totalAmount: args[2] };
            }
            
            const res = await apiClient.post('/orders', payload);
            await refetchOrders();
            return res.order;
        } catch (e) {
            console.error('Error placing order:', e);
            throw e;
        }
    };

    const getStoreAnalytics = async (storeId) => {
        try {
            const res = await apiClient.get(`/orders/store/${storeId}`);
            return res;
        } catch (e) {
            console.error('Error fetching store analytics:', e);
            throw e;
        }
    };

    const getOrdersByUser = (userId) => {
        return orders.filter((o) => (o.userId?._id || o.userId) === userId);
    };

    return (
        <DataContext.Provider
            value={{
                stores,
                offers,
                categories,
                orders,
                isLoading: isLoadingStores || isLoadingOffers || isLoadingCategories || isLoadingOrders,
                registerStore,
                updateStore,
                approveStore,
                rejectStore,
                getStoresByOwner,
                getApprovedStores,
                getPendingStores,
                getStoreById,
                addOffer,
                updateOffer,
                deleteOffer,
                getOffersByStore,
                getActiveOffers,
                getOfferById,
                placeOrder,
                getOrdersByUser,
                getStoreAnalytics,
                getAdminStats: async () => {
                   const res = await apiClient.get('/admin/stats');
                   return res.stats;
                },
                refetchStores,
                refetchOffers
            }}
        >
            {children}
        </DataContext.Provider>
    );
};

export default DataContext;
