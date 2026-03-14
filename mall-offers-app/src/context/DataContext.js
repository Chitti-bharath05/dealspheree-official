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
        data: categoriesData = [],
        isLoading: isLoadingCategories
    } = useQuery({
        queryKey: ['categories'],
        queryFn: () => apiClient.get('/categories'),
    });

    const categories = categoriesData || [];

    // ---- Store operations ----
    const registerStore = async (storeData) => {
        try {
            await apiClient.post('/stores', storeData);
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
        if (!Array.isArray(stores)) return [];
        return stores.filter((s) => {
            const sOwnerId = s?.ownerId?._id || s?.ownerId;
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
        if (!Array.isArray(offers) || !Array.isArray(stores)) return [];
        return offers.filter((o) => {
            const storeId = o?.storeId?._id || o?.storeId;
            const store = stores.find((s) => (s?._id || s?.id) === storeId);
            const isExpired = o?.expiryDate ? new Date(o.expiryDate) < now : true;
            return store && store.approved && !isExpired;
        });
    };

    const getOfferById = (offerId) => {
        return offers.find((o) => (o._id || o.id) === offerId);
    };

    // Orders removed

    return (
        <DataContext.Provider
            value={{
                stores,
                offers,
                categories,
                isLoading: isLoadingStores || isLoadingOffers || isLoadingCategories,
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
