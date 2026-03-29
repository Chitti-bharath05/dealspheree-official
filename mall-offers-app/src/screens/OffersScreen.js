import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Image,
    Platform,
    ActivityIndicator,
    useWindowDimensions
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

    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    
    // Calculate columns based on width
    const numColumns = width > 1200 ? 4 : width > 800 ? 3 : width > 600 ? 2 : 1;
    const cardWidth = (width - 48 - (numColumns - 1) * 16) / numColumns;

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
        const expiryDate = item.expiryDate ? new Date(item.expiryDate) : new Date();
        const daysLeft = Math.max(0, Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)));

        return (
            <TouchableOpacity 
                style={[s.card, { width: cardWidth }]} 
                onPress={() => navigation.navigate('OfferDetails', { offerId: item._id || item.id })}
            >
                <View style={s.cardImgWrapper}>
                    <Image source={{ uri: item.image }} style={s.cardImg} resizeMode="cover" />
                    <LinearGradient 
                        colors={['transparent', 'rgba(0,0,0,0.8)']} 
                        style={s.cardImgOverlay} 
                    />
                    <View style={s.discountBadge}>
                        <Text style={s.discountBadgeTxt}>{item.discount}% OFF</Text>
                    </View>
                </View>
                <View style={s.cardInfo}>
                    <View style={s.cardHeader}>
                        <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); toggleFavorite(item._id || item.id); }}>
                            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={20} color="#D4AF37" />
                        </TouchableOpacity>
                    </View>
                    <Text style={s.cardStore} numberOfLines={1}>{item.storeId?.storeName || 'Boutique'}</Text>
                    <View style={s.cardFooter}>
                        <View>
                            <Text style={s.cardPrice}>₹{(item.originalPrice * (1 - item.discount / 100)).toLocaleString()}</Text>
                            <Text style={s.oldPrice}>₹{item.originalPrice.toLocaleString()}</Text>
                        </View>
                        <View style={s.expBadge}>
                            <Ionicons name="time-outline" size={12} color="#8E8E93" />
                            <Text style={s.cardExp}>{daysLeft}d</Text>
                        </View>
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
                {/* Global Header is provided by AppNavigator */}
                <View style={{ height: Platform.OS === 'web' ? 70 : 0 }} />


                {/* Search Bar */}
                <View style={s.searchWrap}>
                    <View style={s.searchBox}>
                        <Ionicons name="search" size={22} color="#F5C518" style={{ marginRight: 12 }} />
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
                    key={`grid-${numColumns}`}
                    data={filteredOffers}
                    renderItem={renderOfferCard}
                    numColumns={numColumns}
                    keyExtractor={item => item._id || item.id}
                    contentContainerStyle={[s.list, isWeb && { maxWidth: 1440, alignSelf: 'center', width: '100%' }]}
                    columnWrapperStyle={numColumns > 1 ? s.columnWrapper : null}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={s.empty}>
                            <Ionicons name="pricetags-outline" size={60} color="#333" />
                            <Text style={s.emptyTxt}>
                                {selectedCategory !== 'All' 
                                    ? `No stores available in ${selectedCategory} yet.` 
                                    : t('no_offers_found')}
                            </Text>
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, maxWidth: 1440, alignSelf: 'center', width: '100%' },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
    searchWrap: { paddingHorizontal: 24, marginBottom: 15, maxWidth: 1440, alignSelf: 'center', width: '100%' },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    searchInput: { flex: 1, color: '#fff', fontSize: 16 },
    catList: { paddingHorizontal: 24, paddingBottom: 15, maxWidth: 1440, alignSelf: 'center' },
    catPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, backgroundColor: '#1A1A1A', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    catPillActive: { backgroundColor: '#F5C518', borderColor: '#F5C518' },
    catText: { color: '#8E8E93', fontSize: 13, fontWeight: '800' },
    catTextActive: { color: '#000' },
    list: { paddingHorizontal: 24, paddingBottom: 100 },
    columnWrapper: { justifyContent: 'flex-start', gap: 20 },
    card: { backgroundColor: '#121212', borderRadius: 12, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    cardImgWrapper: { width: '100%', height: 260, position: 'relative' },
    cardImg: { width: '100%', height: '100%' },
    cardImgOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%' },
    discountBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#F5C518', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
    discountBadgeTxt: { color: '#000', fontSize: 10, fontWeight: '900' },
    cardInfo: { padding: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { color: '#fff', fontSize: 18, fontWeight: '800', flex: 1, marginRight: 8 },
    cardStore: { color: '#8E8E93', fontSize: 14, marginTop: 4, fontWeight: '500' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 15 },
    cardPrice: { color: '#F5C518', fontSize: 22, fontWeight: '950' },
    oldPrice: { color: '#555', fontSize: 12, textDecorationLine: 'line-through', marginTop: 2 },
    expBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    cardExp: { color: '#8E8E93', fontSize: 11, fontWeight: '700' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyTxt: { color: '#555', fontSize: 18, fontWeight: '700', marginTop: 15 },
});
