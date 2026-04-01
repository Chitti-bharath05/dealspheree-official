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
        setTimeout(() => setToastMessage(null), 2500);
    };

    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const cardWidth = isWeb ? Math.min(width, 520) : width;

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

    useEffect(() => {
        if (navigator?.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => { console.warn('Geolocation failed:', err); setUserLocation(null); }
            );
        }
    }, []);

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
        const formattedDate = expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        return `Expires on ${formattedDate}`;
    };

    const getStoreLat = () => store?.location?.lat ?? store?.lat ?? null;
    const getStoreLng = () => store?.location?.lng ?? store?.lng ?? null;
    const getStoreAddress = () => store?.address ?? store?.location?.address ?? store?.locationDescription ?? 'Store address not set';
    const hasLocation = () => getStoreLat() !== null && getStoreLng() !== null;

    const handleShare = async () => {
        try {
            const shareTitle = `${offer.discount}% OFF: ${offer.title} at ${store?.storeName}`;
            const shareUrl = `https://dealspheree.in/offer/${offerId}`;
            const shareMessage = `Check out this amazing deal: ${offer.title} at ${store?.storeName}!\n\n🔥 ${offer.discount}% OFF\n\nClick here to view: ${shareUrl}\n\nDownload Dealspheree Mall Offers to see more!`;
            
            await Share.share({ 
                title: shareTitle, 
                message: Platform.OS === 'android' ? `${shareMessage}` : shareMessage,
                url: shareUrl // URL field is mainly for iOS
            });
        } catch (error) {
            if (Platform.OS === 'web') {
                window.alert('Could not share this offer.');
            } else {
                Alert.alert('Error', 'Could not share this offer.');
            }
        }
    };

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
            const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : null;
            const url = origin
                ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving&dir_action=navigate`
                : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving&dir_action=navigate`;
            window.open(url, '_blank');
            setIsNavigating(false);
            return;
        }

        let url = Platform.OS === 'android'
            ? `google.navigation:q=${destination}&mode=d`
            : `maps://app?daddr=${destination}&dirflg=d`;

        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                const webUrl = userLocation
                    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination}&travelmode=driving&dir_action=navigate`
                    : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving&dir_action=navigate`;
                await Linking.openURL(webUrl);
            }
        } catch (error) {
            try {
                await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving&dir_action=navigate`);
            } catch (e) {
                Alert.alert('Error', 'Could not open maps. Please try again later.');
            }
        }
        setIsNavigating(false);
    };

    const handleToggleLike = async () => {
        if (!store || !user) {
            showToast('Please login to like this store');
            return;
        }
        const storeId = store._id || store.id;
        try {
            const res = await likeStore(storeId);
            if (res.success) {
                // The cache is already updated by DataContext.likeStore
                // We update local state too for immediate visual feedback
                setStore(prev => {
                    if (!prev) return prev;
                    const userId = user._id || user.id;
                    return {
                        ...prev,
                        likes: res.likes,
                        likedBy: res.isLiked
                            ? [...(prev.likedBy || []).filter(id => id.toString() !== userId.toString()), userId]
                            : (prev.likedBy || []).filter(id => id.toString() !== userId.toString())
                    };
                });
            }
        } catch (error) {
            console.error('Toggle like error:', error);
            showToast('Failed to update like status.');
        }
    };

    const isStoreLiked = useMemo(() => {
        if (!store || !user) return false;
        const userId = (user._id || user.id).toString();
        return (store.likedBy || []).some(id => id.toString() === userId);
    }, [store, user]);

    const submitRating = async () => {
        if (existingRatingObj) { showToast("Rating already submitted, can't be modified"); return; }
        if (rating === 0) { showToast('Please select a star rating.'); return; }
        setIsSubmitting(true);
        try {
            const response = await rateStore(store._id || store.id, rating, comment);
            if (response.success) { 
                showToast('Thank you for your review!'); 
                // Local state will update via useEffect when 'store' prop changes if parent re-renders, 
                // but since store is local state here, we update it from the response
                if (response.store) {
                    setStore(response.store);
                }
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to submit rating.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!offer) {
        return (
            <View style={s.container}>
                <LinearGradient colors={['#0D0D0D', '#000']} style={s.gradient}>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="alert-circle-outline" size={48} color="#F5C518" />
                        <Text style={s.errorText}>Offer not found</Text>
                    </View>
                </LinearGradient>
            </View>
        );
    }

    const discountedPrice = Math.round((offer?.originalPrice || 0) * (1 - (offer?.discount || 0) / 100));
    const expiryStr = getExpiryString(offer?.expiryDate);

    const RatingStars = ({ current, max = 5, onSelect, size = 28 }) => (
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
                        name={i < current ? 'star' : 'star-outline'}
                        size={size}
                        color="#F5C518"
                    />
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={s.container}>
            <LinearGradient colors={['#0D0D0D', '#000000']} style={s.gradient}>
                {/* Web header spacer */}
                {isWeb && <View style={{ height: 70 }} />}

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[s.scroll, isWeb && { alignItems: 'center' }]}
                >
                    <View style={[s.card, isWeb && { width: cardWidth }]}>

                        {/* ── HERO IMAGE ── */}
                        <View style={s.heroContainer}>
                            <Image
                                source={{ uri: offer?.image || 'https://via.placeholder.com/400x280/1a1a1a/F5C518?text=No+Image' }}
                                style={s.heroImage}
                                resizeMode="cover"
                            />
                            {/* Dark gradient overlay at bottom */}
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.85)']}
                                style={s.heroGradient}
                            />
                            {/* Badges overlaid on image */}
                            <View style={s.heroBadgeRow}>
                                <View style={s.limitedBadge}>
                                    <Ionicons name="flash" size={11} color="#000" />
                                    <Text style={s.limitedTxt}> LIMITED OFFER</Text>
                                </View>
                                {expiryStr ? (
                                    <View style={s.expiryBadge}>
                                        <Ionicons name="time-outline" size={12} color="#F5C518" />
                                        <Text style={s.expiryTxt}> {expiryStr}</Text>
                                    </View>
                                ) : null}
                            </View>
                            {/* Share + Like buttons top-right */}
                            <View style={s.heroTopRight}>
                                <TouchableOpacity style={s.iconCircle} onPress={handleShare}>
                                    <Ionicons name="share-social-outline" size={18} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity style={s.iconCircle} onPress={handleToggleLike}>
                                    <Ionicons name={isStoreLiked ? 'heart' : 'heart-outline'} size={18} color={isStoreLiked ? '#F5C518' : '#fff'} />
                                    {(store?.likes > 0) && <Text style={s.likeCountOverlay}>{store.likes}</Text>}
                                </TouchableOpacity>
                            </View>
                            {/* Back button */}
                            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                                <Ionicons name="arrow-back" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* ── BODY ── */}
                        <View style={s.body}>

                            {/* Store name */}
                            <Text style={s.storeName}>{store?.storeName || 'Dealspheree Store'}</Text>

                            {/* Offer title */}
                            <Text style={s.offerTitle}>{offer.title}</Text>

                            {/* Discount + Expiry row */}
                            <View style={s.badgeRow}>
                                <View style={s.discountBadge}>
                                    <Text style={s.discountTxt}>{offer.discount}% OFF</Text>
                                </View>
                                {expiryStr ? (
                                    <View style={s.expiryRowBadge}>
                                        <Ionicons name="time-outline" size={13} color="#F5C518" />
                                        <Text style={s.expiryRowTxt}> {expiryStr}</Text>
                                    </View>
                                ) : null}
                                {/* Favorite toggle */}
                                <TouchableOpacity
                                    style={[s.favToggle, isFavorite && s.favToggleActive]}
                                    onPress={() => toggleFavorite(offerId)}
                                >
                                    <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={16} color={isFavorite ? '#000' : '#F5C518'} />
                                </TouchableOpacity>
                            </View>

                            {/* Stats row */}
                            <View style={s.statsRow}>
                                <View style={s.statBox}>
                                    <Text style={s.statLabel}>EXCLUSIVE{'\n'}PRICE</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                                        <Text style={s.statValue}>₹{discountedPrice > 0 ? discountedPrice.toLocaleString() : '—'}</Text>
                                        {offer.originalPrice > discountedPrice && (
                                            <Text style={s.oldPriceStat}>₹{offer.originalPrice.toLocaleString()}</Text>
                                        )}
                                    </View>
                                </View>
                                {store?.averageRating > 0 && (
                                    <View style={s.statBox}>
                                        <Text style={s.statLabel}>STORE{'\n'}RATING</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <Text style={s.statValue}>{store.averageRating.toFixed(1)}</Text>
                                            <Ionicons name="star" size={16} color="#F5C518" style={{ marginLeft: 4 }} />
                                        </View>
                                    </View>
                                )}
                                <View style={[s.statBox, { borderColor: 'rgba(245,197,24,0.08)' }]}>
                                    <Text style={s.statLabel}>STORE{'\n'}ADDRESS</Text>
                                    <Text style={[s.statValue, { fontSize: 11, fontWeight: '600', color: '#ccc', marginTop: 4 }]} numberOfLines={2}>{getStoreAddress()}</Text>
                                </View>
                            </View>

                            {/* ── ABOUT THIS OFFER ── */}
                            <View style={s.section}>
                                <View style={s.sectionTitleRow}>
                                    <View style={s.goldBar} />
                                    <Text style={s.sectionTitle}>About this offer</Text>
                                </View>
                                <View style={s.descCard}>
                                    <Text style={s.descTxt}>{offer.description || 'Experience an unmatched exclusive deal at this store.'}</Text>
                                </View>
                            </View>

                            {/* ── RATE THIS STORE ── */}
                            <View style={s.section}>
                                <View style={s.sectionTitleRow}>
                                    <View style={s.goldBar} />
                                    <Text style={s.sectionTitle}>Rate this Store</Text>
                                </View>
                                <View style={s.ratingCard}>
                                    <Text style={s.ratingHint}>
                                        How was your experience at <Text style={{ color: '#F5C518' }}>{store?.storeName || 'this store'}</Text>
                                        {store?.approved && (
                                            <Ionicons name="checkmark-circle" size={14} color="#F5C518" style={{ marginLeft: 4 }} />
                                        )}?
                                    </Text>
                                    <RatingStars current={rating} onSelect={setRating} size={32} />
                                    <TextInput
                                        placeholder={existingRatingObj ? '' : 'Leave a comment (optional)...'}
                                        placeholderTextColor="#444"
                                        style={[s.ratingInput, existingRatingObj && { opacity: 0.6 }]}
                                        value={comment}
                                        onChangeText={setComment}
                                        editable={!existingRatingObj}
                                        multiline
                                        onPressIn={() => existingRatingObj && showToast("Rating already submitted, can't be modified")}
                                    />
                                    <TouchableOpacity
                                        style={[s.submitBtn, existingRatingObj && { backgroundColor: 'rgba(245,197,24,0.4)' }]}
                                        onPress={submitRating}
                                        disabled={isSubmitting || !!existingRatingObj}
                                    >
                                        {isSubmitting
                                            ? <ActivityIndicator color="#000" />
                                            : <Text style={s.submitBtnTxt}>{existingRatingObj ? 'Already Rated' : t('submit_rating')}</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* ── VERIFIED DEAL STATUS ── */}
                            <View style={s.section}>
                                <View style={[s.verifiedCard, store?.approved && { borderColor: 'rgba(245,197,24,0.3)', backgroundColor: 'rgba(245,197,24,0.02)' }]}>
                                    <View style={s.verifiedIcon}>
                                        <Ionicons name={store?.approved ? "shield-checkmark" : "checkmark-circle"} size={22} color="#F5C518" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.verifiedTitle}>{store?.approved ? "Verified Store & Deal" : t('verified_deal')}</Text>
                                        <Text style={s.verifiedSub}>{store?.approved ? "This business has provided valid proof and is fully verified." : t('validated_by')}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Bottom spacer so content clears sticky bar */}
                            <View style={{ height: 100 }} />
                        </View>
                    </View>
                </ScrollView>

                {/* ── STICKY BOTTOM BAR ── */}
                <View style={[s.bottomBar, isWeb && { maxWidth: cardWidth, alignSelf: 'center', width: '100%' }]}>
                    <TouchableOpacity
                        style={s.favBtn}
                        onPress={() => toggleFavorite(offerId)}
                    >
                        <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? '#F5C518' : '#fff'} />
                        <Text style={[s.favBtnTxt, isFavorite && { color: '#F5C518' }]}>{t('favorite')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[s.navBtn, (!hasLocation() || isNavigating) && { opacity: 0.6 }]}
                        onPress={openMapsNavigation}
                        disabled={!hasLocation() || isNavigating}
                    >
                        <LinearGradient
                            colors={['#F5C518', '#E6B800']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={s.navBtnGradient}
                        >
                            {isNavigating
                                ? <ActivityIndicator color="#000" size="small" />
                                : <>
                                    <Ionicons name="navigate" size={20} color="#000" />
                                    <Text style={s.navBtnTxt}>{!hasLocation() ? 'No Location' : t('navigate')}</Text>
                                </>
                            }
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* ── TOAST ── */}
            {toastMessage && (
                <View style={s.toastOverlay} pointerEvents="none">
                    <View style={s.toastBox}>
                        <Text style={s.toastTxt}>{toastMessage}</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    gradient: { flex: 1 },
    scroll: { paddingBottom: 0 },

    card: { width: '100%' },

    // Hero
    heroContainer: {
        width: '100%',
        height: 280,
        position: 'relative',
        backgroundColor: '#111',
    },
    heroImage: { width: '100%', height: '100%' },
    heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
    heroBadgeRow: {
        position: 'absolute',
        top: 16,
        left: 16,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    limitedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5C518',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    limitedTxt: { color: '#000', fontSize: 11, fontWeight: '900' },
    expiryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(245,197,24,0.4)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    expiryTxt: { color: '#F5C518', fontSize: 11, fontWeight: '700' },
    heroTopRight: {
        position: 'absolute',
        top: 14,
        right: 14,
        flexDirection: 'row',
        gap: 8,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    likeCountOverlay: {
        color: '#F5C518',
        fontSize: 9,
        fontWeight: '900',
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#000',
        borderRadius: 6,
        paddingHorizontal: 3,
    },
    backBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 14,
        left: 14,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },

    // Body
    body: {
        backgroundColor: '#0D0D0D',
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 10,
    },
    storeName: {
        color: '#F5C518',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    offerTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '900',
        lineHeight: 34,
        marginBottom: 14,
    },

    // Badge row
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    discountBadge: {
        backgroundColor: '#F5C518',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    discountTxt: { color: '#000', fontWeight: '900', fontSize: 13 },
    expiryRowBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(245,197,24,0.35)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        backgroundColor: 'rgba(245,197,24,0.06)',
    },
    expiryRowTxt: { color: '#F5C518', fontSize: 12, fontWeight: '700' },
    favToggle: {
        marginLeft: 'auto',
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1.5,
        borderColor: '#F5C518',
        alignItems: 'center',
        justifyContent: 'center',
    },
    favToggleActive: { backgroundColor: '#F5C518' },

    // Stats
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(245,197,24,0.12)',
    },
    statLabel: {
        color: '#8E8E93',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    statValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
    oldPriceStat: { color: '#555', fontSize: 12, textDecorationLine: 'line-through', fontWeight: '600' },

    // Sections
    section: { marginBottom: 24 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    goldBar: { width: 4, height: 22, backgroundColor: '#F5C518', borderRadius: 2 },
    sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },

    descCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    descTxt: { color: '#CCCCCC', fontSize: 15, lineHeight: 24, fontWeight: '400' },

    // Rating
    ratingCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
    },
    ratingHint: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
    starsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    ratingInput: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 8,
        padding: 14,
        color: '#fff',
        fontSize: 14,
        minHeight: 72,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 14,
    },
    submitBtn: {
        width: '100%',
        backgroundColor: '#F5C518',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitBtnTxt: { color: '#000', fontWeight: '900', fontSize: 15 },

    // Verified
    verifiedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#1A1A1A',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(245,197,24,0.12)',
    },
    verifiedIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: 'rgba(245,197,24,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifiedTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
    verifiedSub: { color: '#8E8E93', fontSize: 12, marginTop: 2 },

    // Bottom bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        paddingTop: 14,
        backgroundColor: 'rgba(0,0,0,0.96)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    favBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 56,
        flex: 0.6,
        borderRadius: 14,
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    favBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
    navBtn: {
        flex: 1,
        height: 56,
        borderRadius: 14,
        overflow: 'hidden',
    },
    navBtnGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    navBtnTxt: { color: '#000', fontWeight: '900', fontSize: 16 },

    // Toast
    toastOverlay: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    toastBox: {
        backgroundColor: 'rgba(10,10,10,0.95)',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F5C518',
        maxWidth: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    toastTxt: { color: '#F5C518', fontSize: 14, fontWeight: '800', textAlign: 'center' },

    errorText: { color: '#888', textAlign: 'center', marginTop: 16, fontSize: 16 },
});

export default OfferDetailsScreen;