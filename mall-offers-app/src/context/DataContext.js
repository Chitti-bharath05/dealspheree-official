import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);

    // --- Helper: Distance Calculation (Haversine Formula) ---
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const fetchUserLocation = () => {
        if (typeof window !== 'undefined' && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLocationError(null);
                },
                (err) => {
                    console.warn('Geolocation failed:', err);
                    setLocationError(err.message);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            setLocationError('Geolocation not supported');
        }
    };

    useEffect(() => {
        fetchUserLocation();
    }, []);

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

    const deleteStore = async (storeId) => {
        try {
            await apiClient.delete(`/stores/${storeId}`);
            refetchStores();
        } catch (e) {
            console.error('Error deleting store:', e);
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
        if (!userLocation) return []; // User's strict rule: hide if location unknown
        return stores.filter((s) => {
            if (!s.approved) return false;
            if (!s.lat || !s.lng) return false; // Hide if store location unknown
            const dist = calculateDistance(userLocation.lat, userLocation.lng, s.lat, s.lng);
            return dist <= 50; 
        });
    };

    const getPendingStores = () => {
        return (stores || []).filter((s) => !s.approved);
    };

    const getStoreById = (storeId) => {
        return (stores || []).find((s) => (s._id || s.id) === storeId);
    };

    const incrementStoreViews = async (storeId) => {
        try {
            await apiClient.post(`/stores/${storeId}/view`);
            // We don't necessarily need to refetch ALL stores every time someone views one,
            // but for now, it's the simplest way to keep the dashboard in sync.
            refetchStores();
        } catch (e) {
            console.error('Error incrementing store views:', e);
        }
    };

    const likeStore = async (storeId) => {
        try {
            const res = await apiClient.post(`/stores/${storeId}/like`);
            // Optimistically update the stores cache so the UI reflects instantly
            queryClient.setQueryData(['stores'], (old) => {
                if (!Array.isArray(old)) return old;
                return old.map((s) => {
                    if ((s._id || s.id)?.toString() !== storeId?.toString()) return s;
                    const userId = user?._id || user?.id;
                    return {
                        ...s,
                        likes: res.likes,
                        likedBy: res.isLiked
                            ? [...(s.likedBy || []), userId]
                            : (s.likedBy || []).filter(id => id?.toString() !== userId?.toString()),
                    };
                });
            });
            return res; // { success, likes, isLiked }
        } catch (e) {
            console.error('Error liking store:', e);
            throw e;
        }
    };

    const likeOffer = async (offerId) => {
        try {
            const res = await apiClient.post(`/offers/${offerId}/like`);
            // Optimistically update the offers cache
            queryClient.setQueryData(['offers'], (old) => {
                if (!Array.isArray(old)) return old;
                return old.map((o) => {
                    if ((o._id || o.id)?.toString() !== offerId?.toString()) return o;
                    const userId = user?._id || user?.id;
                    return {
                        ...o,
                        likes: res.likes,
                        likedBy: res.isLiked
                            ? [...(o.likedBy || []), userId]
                            : (o.likedBy || []).filter(id => id?.toString() !== userId?.toString()),
                    };
                });
            });
            return res;
        } catch (e) {
            console.error('Error liking offer:', e);
            throw e;
        }
    };

    // ---- Offer operations ----
    const rateStore = async (storeId, score, comment) => {
        try {
            const res = await apiClient.post(`/stores/${storeId}/rate`, { score, comment });
            const updatedStore = res.store || res;
            // Update cache to reflect new rating immediately
            queryClient.setQueryData(['stores'], (old) => {
                if (!Array.isArray(old)) return old;
                return old.map((s) => {
                    if ((s._id || s.id)?.toString() !== storeId?.toString()) return s;
                    return {
                        ...s,
                        ratings: updatedStore.ratings ?? s.ratings,
                        averageRating: updatedStore.averageRating ?? s.averageRating,
                        rating: updatedStore.rating ?? s.rating,
                    };
                });
            });
            return res;
        } catch (e) {
            console.error('Error rating store:', e);
            throw e;
        }
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
        if (!userLocation) return []; // User's strict rule: hide if location unknown

        return offers.filter((o) => {
            const storeId = o?.storeId?._id || o?.storeId;
            const store = stores.find((s) => (s?._id || s?.id) === storeId);
            if (!store || !store.approved) return false;
            
            // Proximity check: store must be within 50km
            if (!store.lat || !store.lng) return false;
            const dist = calculateDistance(userLocation.lat, userLocation.lng, store.lat, store.lng);
            if (dist > 50) return false;

            const isExpired = o?.expiryDate ? new Date(o.expiryDate) < now : true;
            return !isExpired;
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
                deleteStore,
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
                incrementStoreViews,
                likeStore,
                likeOffer,
                rateStore,
                getAdminStats: async () => {
                   const res = await apiClient.get('/admin/stats');
                   return res.stats;
                },
                refetchStores,
                refetchOffers,
                userLocation,
                locationError,
                refreshLocation: fetchUserLocation,
                calculateDistance
            }}
        >
            {children}
        </DataContext.Provider>
    );
};

export default DataContext;
