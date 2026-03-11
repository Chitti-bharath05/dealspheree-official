import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Image,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

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

export default function OffersScreen({ route, navigation }) {
    const { offers, categories, isLoading, getActiveOffers } = useData();
    const { favorites, toggleFavorite } = useAuth();
    const { t } = useLanguage();
    
    const [selectedCategory, setSelectedCategory] = useState(route.params?.category || 'All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (route.params?.category) {
            setSelectedCategory(route.params.category);
        }
    }, [route.params?.category]);

    const activeOffers = getActiveOffers() || [];

    const filteredOffers = useMemo(() => {
        let filtered = activeOffers;
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(o => o.category === selectedCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(o => 
                o.title.toLowerCase().includes(q) || 
                o.storeId?.storeName?.toLowerCase().includes(q)
            );
        }
        return filtered;
    }, [activeOffers, selectedCategory, searchQuery]);

    const renderOfferCard = ({ item }) => {
        const isFavorite = favorites.includes(item._id || item.id);
        const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

        return (
            <TouchableOpacity 
                style={s.card} 
                onPress={() => navigation.navigate('OfferDetails', { offerId: item._id || item.id })}
            >
                <Image source={{ uri: item.image }} style={s.cardImg} />
                <View style={s.cardInfo}>
                    <View style={s.cardHeader}>
                        <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); toggleFavorite(item._id || item.id); }}>
                            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color="#D4AF37" />
                        </TouchableOpacity>
                    </View>
                    <Text style={s.cardStore}>{item.storeId?.storeName || 'Sizzling Valoris Central'}</Text>
                    <View style={s.cardFooter}>
                        <Text style={s.cardPrice}>₹{(item.originalPrice * (1 - item.discount / 100)).toLocaleString()}</Text>
                        <Text style={s.cardExp}>{t('expires_in_days').replace('{days}', daysLeft)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={s.loading}>
                <LinearGradient colors={['#1a150d', '#000']} style={StyleSheet.absoluteFill} />
                <ActivityIndicator color="#D4AF37" size="large" />
            </View>
        );
    }

    return (
        <View style={s.container}>
            <LinearGradient colors={['#1a150d', '#000']} style={s.gradient}>
                <View style={s.header}>
                    <Text style={s.headerTitle}>{t('exclusive_offers')}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
                        <Ionicons name="heart-outline" size={26} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={s.searchWrap}>
                    <View style={s.searchBox}>
                        <Ionicons name="search" size={20} color="#D4AF37" style={{ marginRight: 12 }} />
                        <TextInput 
                            placeholder={t('search_deals')} 
                            placeholderTextColor="#555" 
                            style={s.searchInput} 
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Category Pills */}
                <View>
                    <FlatList
                        horizontal
                        data={['All', ...categories]}
                        keyExtractor={item => item}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={s.catList}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                onPress={() => setSelectedCategory(item)}
                                style={[s.catPill, selectedCategory === item && s.catPillActive]}
                            >
                                <Text style={[s.catText, selectedCategory === item && s.catTextActive]}>
                                    {t(catKeys[item] || 'cat_all')}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                <FlatList
                    data={filteredOffers}
                    renderItem={renderOfferCard}
                    keyExtractor={item => item._id || item.id}
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={s.empty}>
                            <Ionicons name="pricetags-outline" size={60} color="#333" />
                            <Text style={s.emptyTxt}>{t('no_offers_found')}</Text>
                        </View>
                    }
                />
            </LinearGradient>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
    searchWrap: { paddingHorizontal: 24, marginBottom: 15 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
    searchInput: { flex: 1, color: '#fff', fontSize: 16 },
    catList: { paddingHorizontal: 24, paddingBottom: 15 },
    catPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    catPillActive: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
    catText: { color: '#8E8E93', fontSize: 14, fontWeight: '700' },
    catTextActive: { color: '#000' },
    list: { paddingHorizontal: 24, paddingBottom: 100 },
    card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cardImg: { width: '100%', height: 180 },
    cardInfo: { padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { color: '#fff', fontSize: 18, fontWeight: '800', flex: 1, marginRight: 10 },
    cardStore: { color: '#D4AF37', fontSize: 14, marginTop: 4, fontWeight: '600' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    cardPrice: { color: '#fff', fontSize: 18, fontWeight: '800' },
    cardExp: { color: '#8E8E93', fontSize: 12, fontWeight: '500' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyTxt: { color: '#555', fontSize: 18, fontWeight: '700', marginTop: 15 },
});
