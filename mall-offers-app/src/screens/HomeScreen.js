import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Platform,
    Image,
    ImageBackground,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Alert,
    useWindowDimensions,
    Animated,
    Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';

const catIcons = {
    'All': 'apps',
    'Fashion': 'shirt',
    'Electronics': 'phone-portrait',
    'Beauty': 'sparkles',
    'Sports': 'fitness',
    'Home & Living': 'home',
    'Footwear': 'footsteps',
    'Watches & Accessories': 'watch',
};

const catKeys = {
    'All': 'cat_all',
    'Fashion': 'cat_fashion',
    'Electronics': 'cat_electronics',
    'Beauty': 'cat_beauty',
    'Sports': 'cat_sports',
    'Home & Living': 'cat_home',
    'Footwear': 'cat_footwear',
    'Watches & Accessories': 'cat_watches',
};

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();
    const { stores, offers, categories, isLoading, getActiveOffers, userLocation, locationError, refreshLocation, calculateDistance } = useData();
    const { t } = useLanguage();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuAnim] = useState(new Animated.Value(-300)); // Hidden to the left

    const toggleMenu = () => {
        const toValue = isMenuOpen ? -300 : 0;
        Animated.timing(menuAnim, {
            toValue,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: Platform.OS !== 'web'
        }).start();
        setIsMenuOpen(!isMenuOpen);
    };

    const activeOffers = getActiveOffers() || [];

    const contentWidth = isWeb ? Math.min(width, 1200) : width;

    const filteredStores = useMemo(() => {
        let filtered = (stores || []).filter(s => s.approved === true);
        
        // Radius filter: 50km
        if (userLocation) {
            filtered = filtered.filter(s => {
                if (!s.lat || !s.lng) return false;
                const dist = calculateDistance(userLocation.lat, userLocation.lng, s.lat, s.lng);
                return dist <= 50;
            });
        }

        if (selectedCategory !== 'All') {
            filtered = filtered.filter((s) => s?.category === selectedCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (s) =>
                    s?.storeName?.toLowerCase().includes(q) ||
                    s?.location?.toLowerCase().includes(q) ||
                    s?.category?.toLowerCase().includes(q)
            );
        }
        return filtered;
    }, [stores, userLocation, selectedCategory, searchQuery]);

    if (isLoading) {
        return (
            <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color="#F5C518" size="large" />
            </View>
        );
    }

    const CategoryPill = ({ title, icon }) => (
        <TouchableOpacity 
            style={[s.catPill, selectedCategory === title && s.catPillActive]}
            onPress={() => setSelectedCategory(title)}
        >
            <View style={[s.catIconBox, selectedCategory === title && s.catIconBoxActive]}>
                <Ionicons name={icon} size={22} color={selectedCategory === title ? "#000" : "#fff"} />
            </View>
            <Text style={[s.catLabel, selectedCategory === title && s.catLabelActive]}>
                {title.toUpperCase()}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={s.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                <View style={[s.contentWrapper, isWeb && { width: contentWidth, alignSelf: 'center' }]}>
                    
                    {/* Global Header is now provided by AppNavigator */}
                    <View style={{ height: Platform.OS === 'web' ? 70 : 0 }} />

                    <View style={s.searchSection}>
                        <View style={s.searchBar}>
                            <TouchableOpacity onPress={toggleMenu} style={s.menuBtn}>
                                <Ionicons name="menu" size={24} color="#F5C518" />
                                <Text style={s.menuBtnTxt}>CATEGORIES</Text>
                            </TouchableOpacity>
                            <View style={s.divider} />
                            <Ionicons name="search" size={20} color="#555" style={{ marginLeft: 12, marginRight: 12 }} />
                            <TextInput 
                                placeholder={isWeb ? "Search for local deals, malls, and shops..." : "Search for local deals..."}
                                placeholderTextColor="#555" 
                                style={s.searchInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>


                    {/* Exclusive Stores (Multi-Column Grid) */}
                    <View style={s.sectionHeader}>
                        <View style={s.sectionRow}>
                            <View style={s.accentBar} />
                            <Text style={s.sectionTitle}>Local <Text style={s.italicGold}>Exclusives</Text></Text>
                        </View>
                    </View>
                    
                    <View style={[s.heroGrid, isWeb && s.heroGridWeb]}>
                        {filteredStores.length > 0 ? (
                            filteredStores.map((item) => {
                                const cardWidth = width > 1024 ? '31%' : width > 768 ? '48%' : '100.5%';
                                const cardHeight = width > 1024 ? 350 : 250;
                                
                                const dist = userLocation && item.lat && item.lng 
                                    ? calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng) 
                                    : null;

                                return (
                                    <TouchableOpacity 
                                        key={item._id || item.id} 
                                        style={[s.heroCard, { width: cardWidth, height: cardHeight, marginBottom: 20 }]}
                                        onPress={() => navigation.navigate('Deals', { storeId: item._id || item.id })}
                                    >
                                        <Image source={{ uri: item.bannerUrl || 'https://via.placeholder.com/600x400' }} style={s.heroImg} />
                                        <LinearGradient 
                                            colors={['transparent', 'rgba(0,0,0,0.95)']} 
                                            style={s.heroOverlay}
                                        >
                                            <View style={s.heroBadge}>
                                                <Text style={s.heroBadgeTxt}>{item.category.toUpperCase()}</Text>
                                            </View>
                                            {dist !== null && (
                                                <View style={s.distIndicator}>
                                                    <Ionicons name="location" size={10} color="#000" />
                                                    <Text style={s.distIndicatorTxt}>{dist.toFixed(1)} km</Text>
                                                </View>
                                            )}
                                            <View style={s.heroContent}>
                                                <Text style={s.storeText} numberOfLines={1}>{item.storeName}</Text>
                                                <Text style={s.descText} numberOfLines={1}>{item.location}</Text>
                                                <View style={s.ratingMini}>
                                                    <Ionicons name="star" size={12} color="#F5C518" />
                                                    <Text style={s.ratingMiniTxt}>{item.rating?.toFixed(1) || '0.0'}</Text>
                                                </View>
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <View style={s.emptyState}>
                                <Ionicons name="storefront-outline" size={48} color="#333" />
                                <Text style={s.emptyTxt}>No approved stores found within 50km in {selectedCategory}.</Text>
                            </View>
                        )}
                    </View>

                    {/* Quick Store Links */}
                    <View style={s.sectionHeader}>
                        <View style={s.sectionRow}>
                            <View style={s.accentBar} />
                            <Ionicons name="flash-outline" size={22} color="#F5C518" style={{ marginRight: 8 }} />
                            <Text style={s.sectionTitle}>Popular <Text style={s.italicGold}>Nearby</Text></Text>
                        </View>
                    </View>

                    <View style={[s.nearList, isWeb && s.nearGridWeb]}>
                        {filteredStores.length > 3 ? (
                            filteredStores.slice(3, 9).map((item) => (
                            <TouchableOpacity 
                                key={item._id || item.id} 
                                style={[s.nearCard, isWeb && { width: '48%' }]}
                                onPress={() => navigation.navigate('Deals', { storeId: item._id || item.id })}
                            >
                                <Image source={{ uri: item.bannerUrl || 'https://via.placeholder.com/100' }} style={s.nearImg} />
                                <View style={s.nearInfo}>
                                    <View style={s.nearTitleRow}>
                                        <Text style={s.nearStoreName} numberOfLines={1}>{item.storeName}</Text>
                                        {userLocation && item.lat && item.lng && (
                                            <View style={s.distBadge}>
                                                <Text style={s.distBadgeTxt}>
                                                    {calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng).toFixed(1)} km
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={s.nearDesc} numberOfLines={1}>{item.location}</Text>
                                    <View style={[s.expiryRow, { backgroundColor: 'rgba(245,197,24,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, alignSelf: 'flex-start' }]}>
                                        <Text style={s.expiryText}>{item.category.toUpperCase()}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                            ))
                        ) : null}
                    </View>
                </View>
            </ScrollView>

            {/* Strict Location Access Overlay (if location is missing) */}
            {!userLocation && !isLoading && (
                <View style={s.locationOverlay}>
                    <View style={s.locationCard}>
                        <Ionicons name="location" size={60} color="#F5C518" />
                        <Text style={s.locationTitle}>Location Access Required</Text>
                        <Text style={s.locationSub}>
                            To maintain premium local exclusivity, Dealspheree only displays deals within a 50km radius. 
                            {locationError ? `\n\nError: ${locationError}` : ""}
                        </Text>
                        <TouchableOpacity style={s.locationBtn} onPress={refreshLocation}>
                            <Text style={s.locationBtnTxt}>Enable Location Access</Text>
                        </TouchableOpacity>
                        <Text style={s.vpnNote}>Note: Some VPNs may block location services. Please check your settings.</Text>
                    </View>
                </View>
            )}
            {/* Categories Sidebar */}
            <Animated.View style={[s.sidebar, { left: menuAnim }]}>
                <View style={s.sidebarHeader}>
                    <Text style={s.sidebarTitle}>EXPLORE CATEGORIES</Text>
                    <TouchableOpacity onPress={toggleMenu}>
                        <Ionicons name="close" size={24} color="#F5C518" />
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={s.sidebarScroll}>
                    {['All', 'Fashion', 'Electronics', 'Beauty', 'Food', 'Home', 'Footwear', 'Watches & Accessories', 'Sports'].map((cat) => (
                        <TouchableOpacity 
                            key={cat} 
                            style={[s.sidebarItem, selectedCategory === cat && s.sidebarItemActive]}
                            onPress={() => {
                                setSelectedCategory(cat);
                                toggleMenu();
                            }}
                        >
                            <Ionicons name={catIcons[cat] || 'apps'} size={20} color={selectedCategory === cat ? "#000" : "#8E8E93"} />
                            <Text style={[s.sidebarItemText, selectedCategory === cat && s.sidebarItemTextActive]}>
                                {cat.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>

            {isMenuOpen && (
                <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={toggleMenu} />
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D0D0D' },
    scroll: { paddingBottom: 100 },
    contentWrapper: { width: '100%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, marginBottom: 20 },
    desktopNav: { backgroundColor: '#121212', paddingVertical: 15, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 30 },
    desktopNavContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, maxWidth: 1440, alignSelf: 'center', width: '100%' },
    desktopSearch: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', height: 48, borderRadius: 8, marginHorizontal: 40, paddingHorizontal: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 24 },
    iconBtn: { alignItems: 'center' },
    iconLabel: { color: '#8E8E93', fontSize: 11, fontWeight: '600', marginTop: 2 },
    logoText: { color: '#F5C518', fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
    bellBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    searchSection: { paddingHorizontal: 24, marginBottom: 24 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 24, paddingHorizontal: 20, height: 56, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    menuBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 12 },
    menuBtnTxt: { color: '#F5C518', fontSize: 13, fontWeight: '900' },
    divider: { height: '60%', width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    searchInput: { flex: 1, color: '#FFFFFF', fontSize: 16, marginLeft: 10 },
    sidebar: { position: 'absolute', top: 0, bottom: 0, width: 280, backgroundColor: '#111', zIndex: 2000, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' },
    sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingTop: Platform.OS === 'web' ? 40 : 60 },
    sidebarTitle: { color: '#F5C518', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    sidebarScroll: { paddingVertical: 20 },
    sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18, gap: 12 },
    sidebarItemActive: { backgroundColor: 'rgba(245,197,24,0.1)' },
    sidebarItemText: { color: '#8E8E93', fontSize: 14, fontWeight: '800' },
    sidebarItemTextActive: { color: '#F5C518' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1900 },
    catGridWeb: { justifyContent: 'space-between', gap: 32 },
    catTile: { alignItems: 'center', gap: 8 },
    catIconBox: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    catIconBoxActive: { backgroundColor: '#F5C518', borderColor: '#F5C518' },
    catLabel: { color: '#8E8E93', fontSize: 11, fontWeight: '800', textAlign: 'center' },
    catLabelActive: { color: '#F5C518' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 24, marginTop: 10 },
    sectionRow: { flexDirection: 'row', alignItems: 'center' },
    accentBar: { width: 4, height: 26, backgroundColor: '#F5C518', marginRight: 12, borderRadius: 2 },
    sectionTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '950' },
    italicGold: { color: '#F5C518', fontStyle: 'italic' },
    viewAll: { color: '#F5C518', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
    heroGrid: { paddingHorizontal: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    heroGridWeb: { justifyContent: 'space-between' },
    heroCard: { width: '100%', height: 380, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1A1A1A' },
    heroImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '75%', padding: 15, justifyContent: 'flex-end' },
    heroBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#F5C518', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    heroBadgeTxt: { color: '#000', fontSize: 8, fontWeight: '900' },
    distIndicator: { position: 'absolute', top: 12, right: 12, backgroundColor: '#F5C518', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
    distIndicatorTxt: { color: '#000', fontSize: 9, fontWeight: '900' },
    heroContent: { gap: 6 },
    offerText: { color: '#F5C518', fontSize: 44, fontWeight: '950', lineHeight: 50 },
    storeText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
    descText: { color: '#A0A0A0', fontSize: 16, fontWeight: '500', lineHeight: 22 },
    nearList: { paddingHorizontal: 24, gap: 16 },
    nearGridWeb: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    nearCard: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, gap: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    nearImg: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#222' },
    nearInfo: { flex: 1, justifyContent: 'center', gap: 6 },
    nearTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    nearStoreName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', flex: 1 },
    distBadge: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    distBadgeTxt: { color: '#8E8E93', fontSize: 10, fontWeight: '700' },
    nearDesc: { color: '#8E8E93', fontSize: 14, fontWeight: '400', lineHeight: 20 },
    expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    expiryText: { color: '#F5C518', fontSize: 12, fontWeight: '700' },
    ratingMini: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    ratingMiniTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },

    emptyState: { 
        width: '100%', 
        paddingVertical: 60, 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#161616',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        marginTop: 10
    },
    emptyTxt: { 
        color: '#555', 
        fontSize: 15, 
        fontWeight: '600', 
        marginTop: 15,
        textAlign: 'center'
    },
    locationOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40
    },
    locationCard: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#121212',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(245,197,24,0.2)',
        shadowColor: '#F5C518',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10
    },
    locationTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
        marginTop: 20,
        textAlign: 'center'
    },
    locationSub: {
        color: '#8E8E93',
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        marginTop: 15
    },
    locationBtn: {
        backgroundColor: '#F5C518',
        paddingHorizontal: 30,
        paddingVertical: 18,
        borderRadius: 12,
        marginTop: 30,
        width: '100%',
        alignItems: 'center'
    },
    locationBtnTxt: {
        color: '#000',
        fontSize: 16,
        fontWeight: '900'
    },
    vpnNote: {
        color: '#555',
        fontSize: 12,
        marginTop: 20,
        textAlign: 'center'
    }
});

