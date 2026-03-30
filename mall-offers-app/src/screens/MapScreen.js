import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

// Platform-specific map component
let MapComponent = null;
if (Platform.OS === 'web') {
    MapComponent = require('../components/LeafletMapWeb').default;
} else {
    MapComponent = require('../components/WebViewMap').default;
}

export default function MapScreen() {
    const { stores, getStoresByOwner, isLoading } = useData();
    const { user } = useAuth();
    const { t } = useLanguage();

    if (isLoading) {
        return (
            <View style={s.loading}>
                <ActivityIndicator color="#F5C518" size="large" />
                <Text style={s.loadingText}>Loading stores...</Text>
            </View>
        );
    }

    // Default to global stores list
    let displayStores = stores || [];

    // If the user is a store owner, only show their stores to prevent confusion
    if (user && user.role === 'store_owner') {
        const ownerId = user._id || user.id;
        displayStores = getStoresByOwner(ownerId);
    }

    return (
        <View style={s.container}>
            {/* Map takes the full screen */}
            <MapComponent stores={displayStores} />
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loading: { flex: 1, backgroundColor: '#1a150d', justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#F5C518', fontSize: 16, marginTop: 16, fontWeight: '700' },
});
