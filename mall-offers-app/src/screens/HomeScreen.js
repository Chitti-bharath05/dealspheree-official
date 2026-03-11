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

    const activeOffers = getActiveOffers() || [];

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
                    o?.description?.toLowerCase().includes(q)
            );
        }
        return filtered;
    }, [activeOffers, selectedCategory, searchQuery]);

    if (isLoading) {
        return (
            <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LinearGradient colors={['#1a150d', '#000']} style={StyleSheet.absoluteFill} />
                <ActivityIndicator color="#D4AF37" size="large" />
            </View>
        );
    }

    const CategoryCard = ({ title, icon }) => (
        <TouchableOpacity 
            style={[s.catBtn, selectedCategory === title && s.catBtnActive]}
            onPress={() => navigation.navigate('Deals', { category: title })}
        >
            <View style={s.catIconBox}>
                <Ionicons name={icon} size={28} color={selectedCategory === title ? "#fff" : "#D4AF37"} />
            </View>
            <Text style={[s.catLabel, selectedCategory === title && s.catLabelActive]}>
                {t(catKeys[title] || 'cat_all')}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={s.container}>
            <LinearGradient colors={['#1a150d', '#000']} style={s.gradient}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                    
                    {/* Top Header */}
                    <View style={s.header}>
                        <View style={s.logoMini}>
                            <Ionicons name="diamond" size={20} color="#D4AF37" />
                            <Text style={s.logoTxt}>Sizzling Valoris</Text>
                        </View>
                        <View style={s.headerActions}>
                            <TouchableOpacity style={s.headerBtn} onPress={() => navigation.navigate('Favorites')}>
                                <Ionicons name="heart-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={s.headerBtn}><Ionicons name="notifications" size={20} color="#fff" /></TouchableOpacity>
                        </View>
                    </View>

                    {/* Search Bar - Integrated for better UX */}
                    <View style={s.searchWrap}>
                        <View style={s.searchBox}>
                            <Ionicons name="search" size={18} color="#D4AF37" style={{ marginRight: 10 }} />
                            <TextInput 
                                placeholder={t('search_deals')} 
                                placeholderTextColor="#555" 
                                style={s.searchInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>

                    {/* Map Banner */}
                    <TouchableOpacity style={s.mapCard} onPress={() => navigation.navigate('Map')}>
                        <ImageBackground 
                            source={require('../../assets/luxury_map_bg.png')} 
                            style={s.mapBg}
                            imageStyle={{ borderRadius: 24, opacity: 0.6 }}
                        >
                            <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']} style={s.mapOverlay}>
                                <View style={s.mapIcon}><Ionicons name="map" size={24} color="#000" /></View>
                                <View>
                                    <Text style={s.mapTitle}>{t('interactive_map')}</Text>
                                    <Text style={s.mapSub}>{t('map_sub')}</Text>
                                </View>
                            </LinearGradient>
                        </ImageBackground>
                    </TouchableOpacity>

                    {/* Recommended Section */}
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>{t('recommended')}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Deals', { category: 'All' })}>
                            <Text style={s.viewAll}>{t('view_all')}</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hList}>
                        {(filteredOffers.length > 0 ? filteredOffers : activeOffers).slice(0, 5).map((item) => (
                            <TouchableOpacity 
                                key={item._id || item.id} 
                                style={[s.recCard, { marginRight: 16 }]}
                                onPress={() => navigation.navigate('OfferDetails', { offerId: item._id || item.id })}
                            >
                                <Image source={{ uri: item.image || 'https://via.placeholder.com/200' }} style={s.recImg} />
                                <View style={s.cardBadge}><Text style={s.cardBadgeTxt}>CURATED</Text></View>
                                <View style={s.recInfo}>
                                    <Text style={s.recTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={s.recSub}>{t(catKeys[item.category] || 'cat_all')} • {item.storeId?.storeName || 'Boutique'}</Text>
                                    <Text style={s.recPrice}>₹{(item.originalPrice * (1 - item.discount / 100)).toLocaleString()} <Text style={s.oldPrice}>₹{item.originalPrice.toLocaleString()}</Text></Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Categories Section */}
                    <Text style={s.sectionTitleAlt}>{t('categories')}</Text>
                    <View style={s.grid}>
                        {(categories && categories.length > 0 ? categories : ['All', 'Fashion', 'Electronics', 'Beauty', 'Sports']).map((cat) => (
                            <CategoryCard key={cat} title={cat} icon={catIcons[cat] || 'apps'} />
                        ))}
                    </View>

                    {/* Recently Viewed */}
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>{t('recently_viewed')}</Text>
                    </View>
                    <View style={s.recentList}>
                        {activeOffers.slice(0, 3).map((item) => (
                            <TouchableOpacity 
                                key={item._id || item.id} 
                                style={s.recentCard}
                                onPress={() => navigation.navigate('OfferDetails', { offerId: item._id || item.id })}
                            >
                                <Image source={{ uri: item.image || 'https://via.placeholder.com/80' }} style={s.recentImg} />
                                <View style={s.recentInfo}>
                                    <Text style={s.recentTitle}>{item.title}</Text>
                                    <Text style={s.recentSub}>{item.storeId?.storeName || 'Store'} • Ends soon</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#D4AF37" />
                            </TouchableOpacity>
                        ))}
                    </View>

                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    scroll: { paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, marginBottom: 15 },
    logoMini: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logoTxt: { color: '#D4AF37', fontSize: 18, fontWeight: '800' },
    headerActions: { flexDirection: 'row', gap: 15 },
    headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    searchWrap: { paddingHorizontal: 24, marginBottom: 20 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)' },
    searchInput: { flex: 1, color: '#fff', fontSize: 14 },
    mapCard: { marginHorizontal: 24, marginTop: 10, height: 160, borderRadius: 24, overflow: 'hidden' },
    mapBg: { flex: 1 },
    mapOverlay: { flex: 1, padding: 20, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 15 },
    mapIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' },
    mapTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
    mapSub: { color: '#A0A0B0', fontSize: 12, marginTop: 2 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 30, marginBottom: 15 },
    sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
    sectionTitleAlt: { color: '#fff', fontSize: 20, fontWeight: '800', paddingHorizontal: 24, marginTop: 30, marginBottom: 15 },
    viewAll: { color: '#D4AF37', fontWeight: '700', fontSize: 14 },
    hList: { paddingHorizontal: 24 },
    recCard: { width: width * 0.7, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    recImg: { width: '100%', height: 180, resizeMode: 'cover' },
    cardBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#D4AF37', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    cardBadgeTxt: { color: '#000', fontSize: 10, fontWeight: '900' },
    recInfo: { padding: 16 },
    recTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
    recSub: { color: '#8E8E93', fontSize: 12, marginTop: 4 },
    recPrice: { color: '#D4AF37', fontSize: 16, fontWeight: '800', marginTop: 10 },
    oldPrice: { color: '#555', fontSize: 12, textDecorationLine: 'line-through', fontWeight: '600' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 24 },
    catBtn: { width: (width - 60) / 2, height: 120, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    catBtnActive: { backgroundColor: 'rgba(212,175,55,0.2)', borderColor: '#D4AF37' },
    catIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center' },
    catLabel: { color: '#8E8E93', fontSize: 15, fontWeight: '700' },
    catLabelActive: { color: '#fff' },
    recentList: { paddingHorizontal: 24, gap: 12 },
    recentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 15, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    recentImg: { width: 60, height: 60, borderRadius: 15, backgroundColor: '#000' },
    recentInfo: { flex: 1 },
    recentTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
    recentSub: { color: '#8E8E93', fontSize: 12, marginTop: 4 },
});
