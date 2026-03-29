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
    useWindowDimensions
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
    const { offers, categories, isLoading, getActiveOffers } = useData();
    const { t } = useLanguage();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const activeOffers = getActiveOffers() || [];

    const contentWidth = isWeb ? Math.min(width, 1200) : width;

    const filteredOffers = useMemo(() => {
        let filtered = activeOffers;
        if (selectedCategory !== 'All') {
            filtered = filtered.filter((o) => o?.category === selectedCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (o) =>
                    o?.title?.toLowerCase().includes(q) ||
                    o?.description?.toLowerCase().includes(q) ||
                    o?.storeId?.storeName?.toLowerCase().includes(q)
            );
        }
        return filtered;
    }, [activeOffers, selectedCategory, searchQuery]);

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
                            <Ionicons name="search" size={20} color="#555" style={{ marginRight: 12 }} />
                            <TextInput 
                                placeholder={isWeb ? "Search for local deals, malls, and shops..." : "Search for local deals..."}
                                placeholderTextColor="#555" 
                                style={s.searchInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>

                    {/* Categories Grid (Amazon-Style Tile View) */}
                    <View style={s.sectionHeader}>
                        <View style={s.sectionRow}>
                            <View style={s.accentBar} />
                            <Text style={s.sectionTitle}>Shop by <Text style={s.italicGold}>Category</Text></Text>
                        </View>
                    </View>
                    
                    <View style={[s.catContainer, isWeb && s.catGridWeb]}>
                        {['Fashion', 'Electronics', 'Beauty', 'Food', 'Home', 'Footwear', 'Watches & Accessories', 'Sports'].map((cat) => (
                            <TouchableOpacity 
                                key={cat} 
                                style={[s.catTile, isWeb && { width: '11%' }]}
                                onPress={() => setSelectedCategory(cat)}
                            >
                                <View style={[s.catIconBox, selectedCategory === cat && s.catIconBoxActive]}>
                                    <Ionicons name={catIcons[cat] || 'apps'} size={isWeb ? 28 : 22} color={selectedCategory === cat ? "#000" : "#fff"} />
                                </View>
                                <Text style={[s.catLabel, selectedCategory === cat && s.catLabelActive]}>
                                    {cat.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Exclusive Offers (Multi-Column Grid) */}
                    <View style={s.sectionHeader}>
                        <View style={s.sectionRow}>
                            <View style={s.accentBar} />
                            <Text style={s.sectionTitle}>Prime <Text style={s.italicGold}>Deals</Text></Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('Deals', { category: 'All' })}>
                            <Text style={s.viewAll}>SEE ALL</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[s.heroGrid, isWeb && s.heroGridWeb]}>
                        {filteredOffers.length > 0 ? (
                            filteredOffers.slice(0, isWeb ? 8 : 4).map((item) => (
                            <TouchableOpacity 
                                key={item._id || item.id} 
                                style={[s.heroCard, isWeb ? { width: '24%', height: 440, marginBottom: 20 } : { width: width - 48 }]}
                                onPress={() => navigation.navigate('OfferDetails', { offerId: item._id || item.id })}
                            >
                                <Image source={{ uri: item.image || 'https://via.placeholder.com/600x400' }} style={s.heroImg} />
                                <LinearGradient 
                                    colors={['transparent', 'rgba(0,0,0,0.95)']} 
                                    style={s.heroOverlay}
                                >
                                    <View style={s.heroBadge}>
                                        <Text style={s.heroBadgeTxt}>AMAZING DEAL</Text>
                                    </View>
                                    <View style={s.heroContent}>
                                        <Text style={[s.offerText, isWeb && { fontSize: 32 }]}>{item.discount}% OFF</Text>
                                        <Text style={[s.storeText, isWeb && { fontSize: 18 }]}>{item.storeId?.storeName || 'Premium Store'}</Text>
                                        <Text style={s.descText} numberOfLines={2}>{item.title}</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                            ))
                        ) : (
                            <View style={s.emptyState}>
                                <Ionicons name="storefront-outline" size={48} color="#333" />
                                <Text style={s.emptyTxt}>No stores available in {selectedCategory} yet.</Text>
                            </View>
                        )}
                    </View>

                    {/* Deals Near You */}
                    <View style={s.sectionHeader}>
                        <View style={s.sectionRow}>
                            <View style={s.accentBar} />
                            <Ionicons name="location" size={22} color="#F5C518" style={{ marginRight: 8 }} />
                            <Text style={s.sectionTitle}>Deals Near <Text style={s.italicGold}>You</Text></Text>
                        </View>
                    </View>

                    <View style={[s.nearList, isWeb && s.nearGridWeb]}>
                        {filteredOffers.length > 4 ? (
                            filteredOffers.slice(4, 12).map((item) => (
                            <TouchableOpacity 
                                key={item._id || item.id} 
                                style={[s.nearCard, isWeb && { width: '48%' }]}
                                onPress={() => navigation.navigate('OfferDetails', { offerId: item._id || item.id })}
                            >
                                <Image source={{ uri: item.image || 'https://via.placeholder.com/100' }} style={s.nearImg} />
                                <View style={s.nearInfo}>
                                    <View style={s.nearTitleRow}>
                                        <Text style={s.nearStoreName}>{item.storeId?.storeName || 'The Burger Lab'}</Text>
                                        <View style={s.distBadge}>
                                            <Text style={s.distBadgeTxt}>2.4 km</Text>
                                        </View>
                                    </View>
                                    <Text style={s.nearDesc} numberOfLines={2}>{item.title}</Text>
                                    <View style={s.expiryRow}>
                                        <Ionicons name="time-outline" size={14} color="#F5C518" />
                                        <Text style={s.expiryText}>ENDS IN 4H</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                            ))
                        ) : filteredOffers.length > 0 ? null : (
                            <View style={[s.emptyState, { width: '100%' }]}>
                                <Ionicons name="pricetags-outline" size={48} color="#333" />
                                <Text style={s.emptyTxt}>Check back later for more deals!</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
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
    searchInput: { flex: 1, color: '#FFFFFF', fontSize: 16 },
    catContainer: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 32, flexWrap: 'wrap', gap: 16 },
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
    heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', padding: 24, justifyContent: 'flex-end' },
    heroBadge: { position: 'absolute', top: 20, left: 20, backgroundColor: '#F5C518', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
    heroBadgeTxt: { color: '#000', fontSize: 10, fontWeight: '900' },
    heroContent: { gap: 6 },
    offerText: { color: '#F5C518', fontSize: 44, fontWeight: '950' },
    storeText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
    descText: { color: '#A0A0A0', fontSize: 15, fontWeight: '400', lineHeight: 22 },
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
});

