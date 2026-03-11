import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Image,
    TextInput,
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

export default function FavoritesScreen({ navigation }) {
    const { favorites, toggleFavorite } = useAuth();
    const { offers } = useData();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('Deals');
    const [searchQuery, setSearchQuery] = useState('');

    const favoriteOffers = useMemo(() => {
        let filtered = offers.filter(o => favorites.includes(o._id || o.id));
        if (searchQuery.trim()) {
            filtered = filtered.filter(o => o.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return filtered;
    }, [offers, favorites, searchQuery]);

    const renderOfferCard = ({ item }) => {
        const store = item.storeId;
        const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        return (
            <TouchableOpacity 
                style={s.card} 
                onPress={() => navigation.navigate('OfferDetails', { offerId: item._id || item.id })}
            >
                <Image source={{ uri: item.image }} style={s.cardImg} />
                <View style={s.cardInfo}>
                    <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={s.cardStore}>{store?.storeName || 'Sizzling Valoris Central'}</Text>
                    <Text style={s.cardExp}>{t('expires_in_days').replace('{days}', daysLeft)}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleFavorite(item._id || item.id)} style={s.heartBtn}>
                    <Ionicons name="heart" size={22} color="#D4AF37" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <View style={s.container}>
            <LinearGradient colors={['#1a150d', '#000']} style={s.gradient}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>{t('my_favorites')}</Text>
                    <TouchableOpacity>
                        <Text style={s.clearAll}>{t('clear_all')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={s.searchWrap}>
                    <View style={s.searchBox}>
                        <Ionicons name="search" size={20} color="#D4AF37" style={{ marginRight: 12 }} />
                        <TextInput 
                            placeholder={t('search_favorites')} 
                            placeholderTextColor="#555" 
                            style={s.searchInput} 
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Tabs */}
                <View style={s.tabRow}>
                    <TouchableOpacity onPress={() => setActiveTab('Deals')} style={[s.tab, activeTab === 'Deals' && s.tabAct]}>
                        <Text style={[s.tabTxt, activeTab === 'Deals' && s.tabTxtAct]}>{t('deals')} ({favoriteOffers.length})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('Stores')} style={[s.tab, activeTab === 'Stores' && s.tabAct]}>
                        <Text style={[s.tabTxt, activeTab === 'Stores' && s.tabTxtAct]}>{t('my_stores')} (0)</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={activeTab === 'Deals' ? favoriteOffers : []}
                    renderItem={renderOfferCard}
                    keyExtractor={item => item._id || item.id}
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={s.empty}>
                            <View style={s.emptyIcWrap}>
                                <Ionicons name="heart-dislike-outline" size={60} color="#D4AF37" />
                            </View>
                            <Text style={s.emptyTxt}>{activeTab === 'Deals' ? t('no_saved_deals') : t('no_saved_stores')}</Text>
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
    clearAll: { color: '#D4AF37', fontWeight: '700', fontSize: 14 },
    searchWrap: { paddingHorizontal: 24, marginBottom: 20 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
    searchInput: { flex: 1, color: '#fff', fontSize: 16 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 24, marginBottom: 20 },
    tab: { paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabAct: { borderBottomColor: '#D4AF37' },
    tabTxt: { color: '#555', fontSize: 16, fontWeight: '700' },
    tabTxtAct: { color: '#D4AF37' },
    list: { paddingHorizontal: 24, paddingBottom: 100 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cardImg: { width: 84, height: 84, borderRadius: 18 },
    cardInfo: { flex: 1, marginLeft: 16 },
    cardTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
    cardStore: { color: '#D4AF37', fontSize: 13, marginTop: 4, fontWeight: '600' },
    cardExp: { color: '#8E8E93', fontSize: 12, marginTop: 6, fontWeight: '500' },
    heartBtn: { padding: 8 },
    empty: { alignItems: 'center', marginTop: 120 },
    emptyIcWrap: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(212,175,55,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    emptyTxt: { color: '#8E8E93', fontSize: 18, fontWeight: '600', textAlign: 'center' },
});

