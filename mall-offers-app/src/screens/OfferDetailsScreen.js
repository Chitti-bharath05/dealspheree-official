import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Image,
    Dimensions,
    Linking,
    Platform,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';

const { width } = Dimensions.get('window');

import { useLanguage } from '../context/LanguageContext';

const OfferDetailsScreen = ({ route, navigation }) => {
    const { offerId } = route.params;
    const { getOfferById, refetchStores } = useData();
    const { favorites, toggleFavorite, user } = useAuth();
    const { t } = useLanguage();
    
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const offer = getOfferById(offerId);
    const store = offer?.storeId;
    const isFavorite = favorites.includes(offerId);

    useEffect(() => {
        if (offerId) {
            apiClient.post(`/offers/${offerId}/view`).catch(err => console.log('View track error:', err));
        }
    }, [offerId]);

    if (!offer) {
        return (
            <View style={s.container}>
                <LinearGradient colors={['#1a150d', '#000']} style={s.gradient}>
                    <Text style={s.errorText}>Offer not found</Text>
                </LinearGradient>
            </View>
        );
    }

    const discountedPrice = Math.round(offer.originalPrice * (1 - offer.discount / 100));

    const openMapsNavigation = async () => {
        const address = [store?.houseNo, store?.street, store?.area, store?.city, store?.pincode].filter(Boolean).join(', ');
        if (!address) {
            Alert.alert('Address Not Available', 'This store has not provided a location.');
            return;
        }
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
        Linking.openURL(googleMapsUrl).catch(() => Alert.alert('Error', 'Could not open maps.'));
    };

    const submitRating = async () => {
        if (rating === 0) {
            Alert.alert('Error', 'Please select a star rating.');
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await apiClient.post(`/stores/${store._id || store.id}/rate`, {
                score: rating,
                comment: comment
            });
            if (response.success) {
                Alert.alert('Success', 'Thank you for your rating!');
                setRating(0);
                setComment('');
                refetchStores(); // Refresh store data to see new rating
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to submit rating. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const RatingStars = ({ current, max = 5, onSelect, size = 24 }) => (
        <View style={s.starsRow}>
            {[...Array(max)].map((_, i) => (
                <TouchableOpacity key={i} onPress={() => onSelect && onSelect(i + 1)}>
                    <Ionicons 
                        name={(i < current) ? "star" : "star-outline"} 
                        size={size} 
                        color="#D4AF37" 
                    />
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={s.container}>
            <LinearGradient colors={['#1a150d', '#000']} style={s.gradient}>
                
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>{t('deal_details')}</Text>
                    <TouchableOpacity style={s.shareBtn}>
                        <Ionicons name="share-social" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                    
                    {/* Hero Section */}
                    <View style={s.heroWrapper}>
                        <Image source={{ uri: offer.image }} style={s.heroImage} />
                        <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']} style={s.heroOverlay} />
                        
                        <View style={s.badgeRow}>
                            <View style={s.limitedBadge}>
                                <Ionicons name="flash" size={12} color="#000" />
                                <Text style={s.limitedTxt}> {t('limited_offer')}</Text>
                            </View>
                        </View>

                        <View style={s.heroContent}>
                            <Text style={s.discountTitle}>{offer.discount}% Off {offer.title}</Text>
                            <Text style={s.storeSub}>{store?.storeName || 'Valoris Luxury Store'}</Text>
                        </View>
                    </View>

                    {/* Price & Rating Intro */}
                    <View style={s.statsRow}>
                        <View style={s.statCard}>
                            <Text style={s.statLabel}>{t('exclusive_price')}</Text>
                            <Text style={s.statValue}>₹{discountedPrice.toLocaleString()}</Text>
                        </View>
                        {store?.averageRating > 0 && (
                            <View style={s.statCard}>
                                <Text style={s.statLabel}>{t('store_rating')}</Text>
                                <View style={s.miniRate}>
                                    <Text style={s.statValue}>{store.averageRating.toFixed(1)}</Text>
                                    <Ionicons name="star" size={16} color="#D4AF37" style={{ marginLeft: 5 }} />
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Description Section */}
                    <View style={s.content}>
                        <View style={s.sectionHeader}>
                            <View style={s.goldBar} />
                            <Text style={s.sectionTitle}>{t('about_offer')}</Text>
                        </View>
                        <Text style={s.descTxt}>{offer.description || 'Experience unmatched luxury with this exclusive deal from our premium boutique.'}</Text>
                    </View>

                    {/* Store & Rating Section */}
                    <View style={s.content}>
                        <View style={s.sectionHeader}>
                            <View style={s.goldBar} />
                            <Text style={s.sectionTitle}>{t('rate_store')}</Text>
                        </View>
                        <View style={s.ratingCard}>
                            <Text style={s.ratingHint}>{t('rating_hint')} {store?.storeName || 'this store'}?</Text>
                            <RatingStars current={rating} onSelect={setRating} size={32} />
                            <TextInput 
                                placeholder={t('rating_input_hint')} 
                                placeholderTextColor="#555" 
                                style={s.ratingInput}
                                value={comment}
                                onChangeText={setComment}
                            />
                            <TouchableOpacity style={s.rateBtn} onPress={submitRating} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <Text style={s.rateBtnTxt}>{t('submit_rating')}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Status Cards */}
                    <View style={s.statusCards}>
                        <View style={s.statusCard}>
                            <View style={s.statusIcon}><Ionicons name="checkmark-circle" size={24} color="#D4AF37" /></View>
                            <View>
                                <Text style={s.statusTitle}>{t('verified_deal')}</Text>
                                <Text style={s.statusSub}>{t('validated_by')}</Text>
                            </View>
                        </View>
                        <View style={s.statusCard}>
                            <View style={[s.statusIcon, { backgroundColor: 'rgba(212,175,55,0.1)' }]}><Ionicons name="location" size={24} color="#D4AF37" /></View>
                            <View>
                                <Text style={s.statusTitle}>{t('in_store_offer')}</Text>
                                <Text style={s.statusSub}>{store?.location || 'Valoris Central Mall'}</Text>
                            </View>
                        </View>
                    </View>

                </ScrollView>

                {/* Bottom Buttons */}
                <View style={s.bottomRow}>
                    <TouchableOpacity style={s.favBtn} onPress={() => toggleFavorite(offerId)}>
                        <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#FFD700" : "#fff"} />
                        <Text style={[s.favTxt, isFavorite && {color: '#FFD700'}]}>{t('favorite')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.navBtn} onPress={openMapsNavigation}>
                        <Ionicons name="navigate" size={22} color="#000" />
                        <Text style={s.navTxt}>{t('navigate')}</Text>
                    </TouchableOpacity>
                </View>

            </LinearGradient>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
    shareBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingBottom: 120 },
    heroWrapper: { marginHorizontal: 24, height: 320, borderRadius: 32, overflow: 'hidden', position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' },
    badgeRow: { position: 'absolute', top: 20, left: 20 },
    limitedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFD700', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    limitedTxt: { color: '#000', fontSize: 11, fontWeight: '900' },
    heroContent: { position: 'absolute', bottom: 30, left: 25, right: 25 },
    discountTitle: { color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 36 },
    storeSub: { color: '#D4AF37', fontSize: 16, fontWeight: '700', marginTop: 8 },
    statsRow: { flexDirection: 'row', gap: 15, paddingHorizontal: 24, marginTop: 24 },
    statCard: { flex: 1, minHeight: 80, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)', paddingVertical: 10 },
    statLabel: { color: '#D4AF37', fontSize: 10, fontWeight: '800', marginBottom: 8 },
    statValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
    miniRate: { flexDirection: 'row', alignItems: 'center' },
    content: { paddingHorizontal: 24, marginTop: 32 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
    goldBar: { width: 4, height: 24, backgroundColor: '#D4AF37', borderRadius: 2 },
    sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
    descTxt: { color: '#8E8E93', fontSize: 15, lineHeight: 24 },
    ratingCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
    ratingHint: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 15, textAlign: 'center' },
    starsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    ratingInput: { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 12, color: '#fff', fontSize: 14, minHeight: 60, textAlignVertical: 'top' },
    rateBtn: { width: '100%', backgroundColor: '#D4AF37', borderRadius: 15, paddingVertical: 12, alignItems: 'center', marginTop: 15 },
    rateBtnTxt: { color: '#000', fontWeight: '800', fontSize: 15 },
    statusCards: { paddingHorizontal: 24, marginTop: 24, gap: 12 },
    statusCard: { flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: 'rgba(255,255,255,0.03)', padding: 18, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    statusIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center' },
    statusTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    statusSub: { color: '#8E8E93', fontSize: 13, marginTop: 2 },
    bottomRow: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 15, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20, backgroundColor: 'rgba(26,21,13,0.98)' },
    favBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    favTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
    navBtn: { flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 60, borderRadius: 20, backgroundColor: '#FFD700' },
    navTxt: { color: '#000', fontWeight: '800', fontSize: 15 },
    errorText: { color: '#fff', textAlign: 'center', marginTop: 100 },
});

export default OfferDetailsScreen;
