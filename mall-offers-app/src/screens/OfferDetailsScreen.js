import React, { useEffect, useState, useMemo } from 'react';
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
    useWindowDimensions,
    Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

const OfferDetailsScreen = ({ route, navigation }) => {
    const { offerId } = route.params;
    const { getOfferById, refetchStores, incrementStoreViews, likeStore } = useData();
    const { favorites, toggleFavorite, user } = useAuth();
    const { t } = useLanguage();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2000);
    };

    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const contentWidth = isWeb ? Math.min(width, 800) : width;

    const offer = getOfferById(offerId);
    const [store, setStore] = useState(null);
    const isFavorite = favorites.includes(offerId);

    const existingRatingObj = useMemo(() => {
        if (!store?.ratings || !user) return null;
        return store.ratings.find(r => (r.user?._id || r.user)?.toString() === (user._id || user.id).toString());
    }, [store, user]);

    useEffect(() => {
        if (existingRatingObj) {
            setRating(existingRatingObj.score);
            setComment(existingRatingObj.comment || '');
        }
    }, [existingRatingObj]);

    // ✅ FIX 1: Get customer's live location ONCE on mount (works on both web and mobile)
    useEffect(() => {
        if (navigator?.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => { console.warn('Geolocation failed:', err); setUserLocation(null); }
            );
        }
    }, []);

    // ✅ FIX 2: Fetch full store data including location
    useEffect(() => {
        if (offer && offer.storeId) {
            const storeId = offer.storeId._id || offer.storeId.id || offer.storeId;
            apiClient.get(`/stores/${storeId}`).then((res) => {
                setStore(res);
            }).catch(console.error);
        }
    }, [offer]);

    useEffect(() => {
        if (offerId) {
            apiClient.post(`/offers/${offerId}/view`).catch(err => console.log('View track error:', err));
        }
        if (offer?.storeId) {
            const storeId = offer.storeId._id || offer.storeId.id || offer.storeId;
            incrementStoreViews(storeId);
        }
    }, [offerId, offer?.storeId]);

    const getExpiryString = (expiryDateStr) => {
        if (!expiryDateStr) return '';
        const expiry = new Date(expiryDateStr);
        const now = new Date();
        const diffTime = expiry.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysLeft <= 0) return 'Expired';
        if (daysLeft <= 3) return `Expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
        
        const formattedDate = expiry.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        return `Expires on ${formattedDate}`;
    };

    if (!offer) {
        return (
            <View style={s.container}>
                <LinearGradient colors={['#1a150d', '#000']} style={s.gradient}>
                    <Text style={s.errorText}>Offer not found</Text>
                </LinearGradient>
            </View>
        );
    }

    const discountedPrice = Math.round((offer?.originalPrice || 0) * (1 - (offer?.discount || 0) / 100));

    // ✅ FIX 3: Correctly read store location from nested location object OR flat lat/lng
    // Supports both: store.location.lat/lng AND store.lat/lng (covers both API response formats)
    const getStoreLat = () => store?.location?.lat ?? store?.lat ?? null;
    const getStoreLng = () => store?.location?.lng ?? store?.lng ?? null;
    const getStoreAddress = () => store?.address ?? store?.location?.address ?? store?.locationDescription ?? 'Store address not set';
    const hasLocation = () => getStoreLat() !== null && getStoreLng() !== null;

    const handleShare = async () => {
        try {
            const shareTitle = `${offer.discount}% OFF: ${offer.title} at ${store?.storeName}`;
            const shareMessage = `Check out this amazing deal: ${offer.title} at ${store?.storeName}! ${offer.description}\n\nDownload Dealspheree Mall Offers to see more!`;

            const result = await Share.share({
                title: shareTitle,
                message: shareMessage,
                url: Platform.OS === 'ios' ? 'https://apps.apple.com/app/dealspheree' : undefined
            });
        } catch (error) {
            Alert.alert('Error', 'Could not share this offer.');
        }
    };

    // ✅ FIX 4: Navigate uses correct lat/lng + works on mobile AND web
    const openMapsNavigation = async () => {
        const storeLat = getStoreLat();
        const storeLng = getStoreLng();

        if (storeLat === null || storeLng === null) {
            if (Platform.OS === 'web') {
                window.alert('Store location not available. Please contact the store.');
            } else {
                Alert.alert('Address Not Available', 'This store has not provided a location.');
            }
            return;
        }

        setIsNavigating(true);
        const destination = `${storeLat},${storeLng}`;

        if (Platform.OS === 'web') {
            if (userLocation) {
                const origin = `${userLocation.lat},${userLocation.lng}`;
                window.open(
                    `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving&dir_action=navigate`,
                    '_blank'
                );
            } else {
                window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving&dir_action=navigate`,
                    '_blank'
                );
            }
            setIsNavigating(false);
            return;
        }

        // ✅ FIX 5: Mobile native navigation - opens Google Maps app with Start button
        const isMobile = Platform.OS === 'android' || Platform.OS === 'ios';
        if (isMobile) {
            let url = '';
            if (Platform.OS === 'android') {
                // Google Maps app deep link with navigation mode
                url = `google.navigation:q=${destination}&mode=d`;
            } else if (Platform.OS === 'ios') {
                // Apple Maps with directions
                url = `maps://app?daddr=${destination}&dirflg=d`;
            }

            try {
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                    await Linking.openURL(url);
                } else {
                    // Fallback to Google Maps web with dir_action=navigate
                    const webUrl = userLocation
                        ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination}&travelmode=driving&dir_action=navigate`
                        : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving&dir_action=navigate`;
                    await Linking.openURL(webUrl);
                }
            } catch (error) {
                const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving&dir_action=navigate`;
                try { await Linking.openURL(webUrl); } catch (e) {
                    Alert.alert('Error', 'Could not open maps. Please try again later.');
                }
            }
        }
        setIsNavigating(false);
    };

    const handleToggleLike = async () => {
        if (!store) return;
        const storeId = store._id || store.id;
        try {
            const res = await likeStore(storeId);
            if (res.success) {
                // Update local store state to reflect new like count and status
                setStore(prev => ({
                    ...prev,
                    likes: res.likes,
                    likedBy: res.isLiked 
                        ? [...(prev.likedBy || []), user?._id || user?.id]
                        : (prev.likedBy || []).filter(id => id.toString() !== (user?._id || user?.id).toString())
                }));
            }
        } catch (error) {
            console.error('Toggle like error:', error);
            Alert.alert('Error', 'Failed to update like status.');
        }
    };

    const isStoreLiked = useMemo(() => {
        if (!store || !user) return false;
        const userId = (user._id || user.id).toString();
        return (store.likedBy || []).some(id => id.toString() === userId);
    }, [store, user]);

    const submitRating = async () => {
        if (existingRatingObj) {
            showToast("Rating already submitted, can't be modified");
            return;
        }
        if (rating === 0) {
            showToast('Please select a star rating.');
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await apiClient.post(`/stores/${store._id || store.id}/rate`, {
                score: rating,
                comment: comment
            });
            if (response.success) {
                showToast('Thank you for your response!');
                refetchStores();
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || 'Failed to submit rating. Please try again later.';
            showToast(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const RatingStars = ({ current, max = 5, onSelect, size = 24 }) => (
        <View style={s.starsRow}>
            {[...Array(max)].map((_, i) => (
                <TouchableOpacity 
                    key={i} 
                    onPress={() => {
                        if (existingRatingObj) {
                            showToast("Rating already submitted, can't be modified");
                        } else if (onSelect) {
                            onSelect(i + 1);
                        }
                    }}
                >
                    <Ionicons
                        name={(i < current) ? "star" : "star-outline"}
                        size={size}
                        color="#F5C518"
                    />
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={s.container}>
            <LinearGradient colors={['#1a150d', '#000']} style={s.gradient}>
                {/* Global Header is provided by AppNavigator */}
                <View style={{ height: Platform.OS === 'web' ? 70 : 0 }} />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                    <View style={[s.contentWrapper, isWeb && s.webFlexRow]}>
                        
                        {/* Left Column: Image (Desktop) / Hero (Mobile) */}
                        <View style={[s.heroWrapper, isWeb && s.webLeftCol]}>
                            <Image source={{ uri: offer?.image || 'https://via.placeholder.com/400' }} style={s.heroImage} />
                            <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']} style={s.heroOverlay} />
                            <View style={s.badgeRow}>
                                <View style={s.limitedBadge}>
                                    <Ionicons name="flash" size={12} color="#000" />
                                    <Text style={s.limitedTxt}> {t('limited_offer')}</Text>
                                </View>
                                {offer?.expiryDate && (
                                    <View style={[s.expiryBadge, { marginLeft: 10 }]}>
                                        <Ionicons name="time-outline" size={12} color="#F5C518" />
                                        <Text style={s.expiryTxt}>{getExpiryString(offer.expiryDate)}</Text>
                                    </View>
                                )}
                            </View>
                            {!isWeb && (
                                <View style={s.heroContent}>
                                    <Text style={s.discountTitle}>{offer.discount}% Off {offer.title}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                                        <Text style={s.storeSub}>{store?.storeName || 'Dealspheree Luxury Store'}</Text>
                                        <TouchableOpacity style={s.storeLikeBtn} onPress={handleToggleLike}>
                                            <Ionicons 
                                                name={isStoreLiked ? "heart" : "heart-outline"} 
                                                size={18} 
                                                color="#F5C518" 
                                            />
                                            <Text style={s.storeLikeTxt}>{store?.likes || 0}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Right Column: Details */}
                        <View style={[isWeb && s.webRightCol]}>
                            {isWeb && (
                                <View style={s.webDetailsHeader}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.webStoreLabel}>{store?.storeName || 'Dealspheree Store'}</Text>
                                            <Text style={s.webMainTitle}>{offer.title}</Text>
                                        </View>
                                        <TouchableOpacity style={s.storeLikeBtn} onPress={handleToggleLike}>
                                            <Ionicons 
                                                name={isStoreLiked ? "heart" : "heart-outline"} 
                                                size={20} 
                                                color="#F5C518" 
                                            />
                                            <Text style={s.storeLikeTxt}>{store?.likes || 0}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 15 }}>
                                        <View style={[s.webDiscountBadge, { marginTop: 0 }]}>
                                            <Text style={s.webDiscountTxt}>{offer.discount}% OFF</Text>
                                        </View>
                                        {offer?.expiryDate && (
                                            <View style={s.expiryBadge}>
                                                <Ionicons name="time-outline" size={16} color="#F5C518" />
                                                <Text style={[s.expiryTxt, { fontSize: 13 }]}>{getExpiryString(offer.expiryDate)}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}

                            {/* Price & Rating */}
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
                                            <Ionicons name="star" size={20} color="#F5C518" style={{ marginLeft: 5 }} />
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Description */}
                            <View style={s.content}>
                                <View style={s.sectionHeader}>
                                    <View style={s.goldBar} />
                                    <Text style={s.sectionTitle}>{t('about_offer')}</Text>
                                </View>
                                <View style={s.descCard}>
                                    <Text style={s.descTxt}>{offer.description || 'Experience unmatched luxury with this exclusive deal.'}</Text>
                                </View>
                            </View>

                            {/* Rating Section */}
                            <View style={s.content}>
                                <View style={s.sectionHeader}>
                                    <View style={s.goldBar} />
                                    <Text style={s.sectionTitle}>{t('rate_store')}</Text>
                                </View>
                                <View style={s.ratingCard}>
                                    <Text style={s.ratingHint}>{t('rating_hint')} {store?.storeName || 'this store'}?</Text>
                                    <RatingStars current={rating} onSelect={setRating} size={32} />
                                    <TextInput
                                        placeholder={existingRatingObj ? "" : t('rating_input_hint')}
                                        placeholderTextColor="#555"
                                        style={[s.ratingInput, existingRatingObj && { opacity: 0.7 }]}
                                        value={comment}
                                        onChangeText={setComment}
                                        editable={!existingRatingObj}
                                        onPressIn={() => existingRatingObj && showToast("Rating already submitted, can't be modified")}
                                    />
                                    <TouchableOpacity 
                                        style={[s.rateBtn, existingRatingObj && { backgroundColor: 'rgba(245,197,24,0.5)' }]} 
                                        onPress={submitRating} 
                                        disabled={isSubmitting || existingRatingObj}
                                    >
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
                                    <View style={s.statusIcon}>
                                        <Ionicons name="checkmark-circle" size={24} color="#F5C518" />
                                    </View>
                                    <View>
                                        <Text style={s.statusTitle}>{t('verified_deal')}</Text>
                                        <Text style={s.statusSub}>{t('validated_by')}</Text>
                                    </View>
                                </View>
                                <View style={s.statusCard}>
                                    <View style={[s.statusIcon, { backgroundColor: 'rgba(245,197,24,0.1)' }]}>
                                        <Ionicons name="location" size={24} color="#F5C518" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.statusTitle}>{t('in_store_offer')}</Text>
                                        <Text style={s.statusSub}>{getStoreAddress()}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Bottom Buttons */}
                <View style={s.bottomRow}>
                    <TouchableOpacity style={s.favBtn} onPress={() => toggleFavorite(offerId)}>
                        <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#FFD700" : "#fff"} />
                        <Text style={[s.favTxt, isFavorite && { color: '#FFD700' }]}>{t('favorite')}</Text>
                    </TouchableOpacity>

                    {/* ✅ FIX 7: Navigate button uses hasLocation() helper - works with both data formats */}
                    <TouchableOpacity
                        style={[s.navBtn, !hasLocation() && { opacity: 0.5 }]}
                        onPress={openMapsNavigation}
                        disabled={!hasLocation() || isNavigating}
                    >
                        {isNavigating ? (
                            <ActivityIndicator color="#000" size="small" />
                        ) : (
                            <>
                                <Ionicons name="navigate" size={22} color="#000" />
                                <Text style={s.navTxt}>
                                    {!hasLocation() ? 'Location not set' : t('navigate')}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

            </LinearGradient>

            {toastMessage && (
                <View style={s.toastOverlay}>
                    <View style={s.toastBox}>
                        <Text style={s.toastText}>{toastMessage}</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    gradient: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, maxWidth: 800, alignSelf: 'center', width: '100%' },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
    shareBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingBottom: 120 },
    contentWrapper: { width: '100%' },
    webFlexRow: { flexDirection: 'row', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 24, gap: 40, marginTop: 20 },
    webLeftCol: { width: '50%', height: 600, marginHorizontal: 0 },
    webRightCol: { width: '50%', paddingRight: 0 },
    webDetailsHeader: { marginBottom: 30 },
    webStoreLabel: { color: '#F5C518', fontSize: 18, fontWeight: '800', marginBottom: 8 },
    webMainTitle: { color: '#fff', fontSize: 36, fontWeight: '900', lineHeight: 44 },
    webDiscountBadge: { alignSelf: 'flex-start', backgroundColor: '#F5C518', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, marginTop: 15 },
    webDiscountTxt: { color: '#000', fontWeight: '900', fontSize: 14 },
    heroWrapper: { marginHorizontal: 24, height: 360, borderRadius: 12, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' },
    badgeRow: { position: 'absolute', top: 20, left: 20, flexDirection: 'row', alignItems: 'center' },
    limitedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5C518', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
    limitedTxt: { color: '#000', fontSize: 11, fontWeight: '950' },
    expiryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, gap: 5, borderWidth: 1, borderColor: 'rgba(245,197,24,0.3)' },
    expiryTxt: { color: '#F5C518', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    heroContent: { position: 'absolute', bottom: 30, left: 25, right: 25 },
    discountTitle: { color: '#fff', fontSize: 32, fontWeight: '950', lineHeight: 40 },
    storeSub: { color: '#F5C518', fontSize: 18, fontWeight: '700', marginTop: 10 },
    statsRow: { flexDirection: 'row', gap: 15, paddingHorizontal: 24, paddingHorizontal: Platform.OS === 'web' ? 0 : 24, marginTop: Platform.OS === 'web' ? 0 : 24 },
    statCard: { flex: 1, minHeight: 100, backgroundColor: '#1A1A1A', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    statLabel: { color: '#F5C518', fontSize: 12, fontWeight: '850', marginBottom: 6, letterSpacing: 1.2, textTransform: 'uppercase' },
    statValue: { color: '#fff', fontSize: 26, fontWeight: '950' },
    miniRate: { flexDirection: 'row', alignItems: 'center' },
    content: { paddingHorizontal: Platform.OS === 'web' ? 0 : 24, marginTop: 32 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    goldBar: { width: 4, height: 26, backgroundColor: '#F5C518', borderRadius: 2 },
    sectionTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
    descCard: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
    descTxt: { color: '#FFFFFF', fontSize: 16, lineHeight: 26, fontWeight: '500' },
    ratingCard: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
    ratingHint: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
    starsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    ratingInput: { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 16, color: '#fff', fontSize: 15, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    rateBtn: { width: '100%', backgroundColor: '#F5C518', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
    rateBtnTxt: { color: '#000', fontWeight: '900', fontSize: 16 },
    statusCards: { paddingHorizontal: Platform.OS === 'web' ? 0 : 24, marginTop: 32, gap: 16 },
    statusCard: { flexDirection: 'row', alignItems: 'center', gap: 18, backgroundColor: '#1A1A1A', padding: 22, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
    statusIcon: { width: 56, height: 56, borderRadius: 12, backgroundColor: 'rgba(245,197,24,0.1)', alignItems: 'center', justifyContent: 'center' },
    statusTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
    statusSub: { color: '#8E8E93', fontSize: 14, marginTop: 4 },
    bottomRow: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 15, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20, backgroundColor: 'rgba(0,0,0,0.95)', maxWidth: 1200, alignSelf: 'center', width: '100%', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    favBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 60, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    favTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },
    navBtn: { flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 60, borderRadius: 12, backgroundColor: '#F5C518' },
    navTxt: { color: '#000', fontWeight: '950', fontSize: 16 },
    errorText: { color: '#fff', textAlign: 'center', marginTop: 100 },
    storeLikeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 197, 24, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: 'rgba(245, 197, 24, 0.3)' },
    storeLikeTxt: { color: '#F5C518', fontSize: 13, fontWeight: '800' },
    toastOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', zIndex: 9999, pointerEvents: 'none' },
    toastBox: { backgroundColor: 'rgba(20,20,20,0.95)', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 12, borderWidth: 1, borderColor: '#F5C518', maxWidth: '80%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
    toastText: { color: '#F5C518', fontSize: 14, fontWeight: '800', textAlign: 'center' }
});

export default OfferDetailsScreen;