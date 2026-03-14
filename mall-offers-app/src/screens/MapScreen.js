import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform, Alert, TextInput, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import NavigationControls from '../components/NavigationControls';

export default function MapScreen({ navigation }) {
    const { t } = useLanguage();
    const { stores } = useData();
    const [search, setSearch] = useState('');

    const approvedStores = stores.filter(s => s.approved);
    const filteredStores = approvedStores.filter(s => 
        s.storeName.toLowerCase().includes(search.toLowerCase()) ||
        s.area.toLowerCase().includes(search.toLowerCase())
    );

    const navigateToStore = async (store) => {
        const address = [store.houseNo, store.street, store.area, store.city, store.pincode].filter(Boolean).join(', ');
        if (!address) {
            Alert.alert('Address Not Available', 'This store has not provided a location.');
            return;
        }

        const encodedAddress = encodeURIComponent(address);
        let url = Platform.OS === 'android' 
            ? `google.navigation:q=${encodedAddress}`
            : Platform.OS === 'ios'
                ? `maps://app?daddr=${encodedAddress}`
                : `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

        try {
            const supported = await Linking.canOpenURL(url);
            await Linking.openURL(supported ? url : `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`);
        } catch (error) {
            Alert.alert('Error', 'Could not open maps.');
        }
    };

    return (
        <View style={s.container}>
            <LinearGradient colors={['#1a150d', '#000']} style={s.gradient}>
                {/* Header */}
                <View style={s.header}>
                    <View style={s.headerLeft}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <NavigationControls />
                    </View>
                    <Text style={s.headerTitle}>{t('store_directory') || 'Store Directory'}</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Search Bar */}
                <View style={s.searchWrap}>
                    <Ionicons name="search" size={20} color="#8E8E93" style={s.searchIcon} />
                    <TextInput
                        style={s.searchInput}
                        placeholder={t('search_stores') || 'Search stores or locations...'}
                        placeholderTextColor="#8E8E93"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                
                <ScrollView contentContainerStyle={s.scroll}>
                    {filteredStores.length > 0 ? (
                        filteredStores.map(store => (
                            <View key={store._id || store.id} style={s.storeCard}>
                                <View style={s.storeInfo}>
                                    <View style={s.logoWrap}>
                                        {store.logoUrl ? (
                                            <Image source={{ uri: store.logoUrl }} style={s.logo} />
                                        ) : (
                                            <Ionicons name="business" size={24} color="#D4AF37" />
                                        )}
                                    </View>
                                    <View style={s.txtWrap}>
                                        <Text style={s.storeName}>{store.storeName}</Text>
                                        <Text style={s.locationTxt} numberOfLines={1}>
                                            <Ionicons name="location" size={12} color="#D4AF37" /> {store.area}, {store.city}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={s.navBtn} onPress={() => navigateToStore(store)}>
                                    <View style={s.navIcon}>
                                        <Ionicons name="navigate" size={20} color="#000" />
                                    </View>
                                    <Text style={s.navBtnTxt}>{t('navigate') || 'Navigate'}</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View style={s.empty}>
                            <Ionicons name="business-outline" size={60} color="#333" />
                            <Text style={s.emptyTxt}>{t('no_stores_found') || 'No stores found'}</Text>
                        </View>
                    )}
                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, marginBottom: 20 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
    searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 24, borderRadius: 16, paddingHorizontal: 16, height: 50, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)' },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, color: '#fff', fontSize: 16 },
    scroll: { paddingHorizontal: 24, paddingBottom: 100 },
    storeCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    storeInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    logoWrap: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(212,175,55,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    logo: { width: '100%', height: '100%', borderRadius: 15 },
    txtWrap: { flex: 1, marginRight: 10 },
    storeName: { color: '#fff', fontSize: 17, fontWeight: '800' },
    locationTxt: { color: '#8E8E93', fontSize: 13, marginTop: 4, fontWeight: '500' },
    navBtn: { backgroundColor: '#D4AF37', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
    navIcon: { backgroundColor: 'rgba(0,0,0,0.1)', padding: 4, borderRadius: 6 },
    navBtnTxt: { color: '#000', fontWeight: '900', fontSize: 14 },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyTxt: { color: '#555', fontSize: 16, marginTop: 15, fontWeight: '600' }
});

