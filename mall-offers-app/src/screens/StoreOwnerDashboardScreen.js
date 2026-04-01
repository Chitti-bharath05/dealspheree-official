import React, { useState, useMemo } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    FlatList, Modal, TextInput, Alert, Image, ActivityIndicator, 
    Dimensions, Platform, useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import StoreLocationPicker from '../components/StoreLocationPicker';
import StoreLocationDisplay from '../components/StoreLocationDisplay';

const StoreOwnerDashboardScreen = () => {
    const { user, logout } = useAuth();
    const { stores, offers, getStoresByOwner, getOffersByStore, addOffer, updateOffer, updateStore, deleteStore, deleteOffer, registerStore, categories, isLoading } = useData();
    const { t } = useLanguage();
    const { width: screenWidth } = useWindowDimensions(); // Read once at top level
    const [activeTab, setActiveTab] = useState('stores');
    
    // State management for refactored forms
    const [storeName, setStoreName] = useState('');
    const [location, setLocation] = useState('');
    const [storeLocation, setStoreLocation] = useState({ lat: null, lng: null, address: '' });
    const [category, setCategory] = useState(categories[0] || 'Fashion');
    const [offerTitle, setOfferTitle] = useState('');
    const [offerDesc, setOfferDesc] = useState('');
    const [offerDiscount, setOfferDiscount] = useState('');
    const [offerOriginalPrice, setOfferOriginalPrice] = useState('');
    const [offerExpiry, setOfferExpiry] = useState('');
    const [selectedStoreId, setSelectedStoreId] = useState('');
    const [offerImage, setOfferImage] = useState(null);
    const [storeImage, setStoreImage] = useState(null);
    const [businessProofImage, setBusinessProofImage] = useState(null);
    const [showAddOffer, setShowAddOffer] = useState(false);
    const [showAddStore, setShowAddStore] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [editingStore, setEditingStore] = useState(null);
    const [isSavingStore, setIsSavingStore] = useState(false);
    const [isSavingOffer, setIsSavingOffer] = useState(false);
    const [proofError, setProofError] = useState(false);

    // State for the inline store-offers view (avoids URL-based navigation that remounts app on web)
    const [selectedStore, setSelectedStore] = useState(null);

    const allMyStores = useMemo(() => getStoresByOwner(user?._id || user?.id) || [], [stores, user]);
    const myStores = useMemo(() => allMyStores, [allMyStores]); // Show all for management
    const hasApprovedStore = useMemo(() => allMyStores.some(s => s.approved), [allMyStores]);

    const stats = useMemo(() => {
        const approved = allMyStores.filter(s => s.approved);
        const totalLikes = approved.reduce((sum, s) => sum + (s.likes || 0), 0);
        const totalRating = approved.reduce((sum, s) => sum + (s.rating || 0), 0);
        const avgRating = approved.length > 0 ? totalRating / approved.length : 0;
        return { totalLikes, avgRating };
    }, [allMyStores]);

    const activeOffersCount = useMemo(() => {
        const myStoreIds = allMyStores.map(s => s._id || s.id);
        const myOffers = (offers || []).filter(o => {
            const oStoreId = o.storeId?._id || o.storeId;
            return myStoreIds.includes(oStoreId);
        });
        return myOffers.filter(offer => new Date(offer.expiryDate) > new Date()).length;
    }, [offers, allMyStores]);

    // Offers for the currently selected store (for inline view)
    const selectedStoreOffers = useMemo(() => {
        if (!selectedStore) return [];
        return getOffersByStore(selectedStore._id || selectedStore.id) || [];
    }, [offers, selectedStore]);

    const handlePickOfferImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });
        if (!result.canceled) setOfferImage(result.assets[0].uri);
    };

    const handlePickStoreImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });
        if (!result.canceled) setStoreImage(result.assets[0].uri);
    };

    const handlePickBusinessProof = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });
        if (!result.canceled) setBusinessProofImage(result.assets[0].uri);
    };

    const resetForms = () => {
        setStoreName(''); setLocation(''); setStoreLocation({ lat: null, lng: null }); setCategory(categories[0] || 'Fashion'); setStoreImage(null); setBusinessProofImage(null);
        setOfferTitle(''); setOfferDesc(''); setOfferDiscount(''); setOfferOriginalPrice(''); setOfferExpiry('');
        setOfferImage(null); setEditingOffer(null); setEditingStore(null);
        setProofError(false);
    };

    const handleSaveStore = async () => {
        if (!storeName.trim() || !location.trim()) {
            return Alert.alert('Error', 'Store name and location are required.');
        }
        if (!storeLocation?.lat || !storeLocation?.lng) {
            return Alert.alert('Location Required', 'Please use Auto Detect or Search to pin your exact location on the map.');
        }

        // Security check for new registrations
        if (!editingStore && !businessProofImage) {
            setProofError(true);
            return Alert.alert('Verification Required', 'Please upload a Business Proof (License, GST certificate, or Shop photo with sign) to register your store.');
        }
        setProofError(false);

        setIsSavingStore(true);
        try {
            if (editingStore) {
                const updateData = {
                    storeName: storeName.trim(),
                    location: location.trim(),
                    category,
                    lat: storeLocation?.lat || null,
                    lng: storeLocation?.lng || null,
                    bannerUrl: storeImage
                };
                if (storeLocation?.address) {
                    updateData.address = storeLocation.address;
                }
                await updateStore(editingStore._id || editingStore.id, updateData);
                Alert.alert('Success', 'Store updated successfully!');
            } else {
                const registerData = {
                    storeName: storeName.trim(),
                    location: location.trim(),
                    category,
                    ownerId: user.id || user._id,
                    lat: storeLocation?.lat || null,
                    lng: storeLocation?.lng || null,
                    bannerUrl: storeImage,
                    businessProofUrl: businessProofImage
                };
                if (storeLocation?.address) {
                    registerData.address = storeLocation.address;
                }
                await registerStore(registerData);
                Alert.alert('Success', 'Store registered! It will be reviewed shortly.');
            }
            setShowAddStore(false);
            resetForms();
        } catch (e) {
            console.error('handleSaveStore error:', e);
            Alert.alert('Failed to update store', e?.message || 'Please try again.');
        } finally {
            setIsSavingStore(false);
        }
    };

    const handleSaveOffer = async () => {
        if (!offerTitle || !offerDiscount || !offerOriginalPrice || !selectedStoreId || !offerExpiry) {
            return Alert.alert('Error', 'Missing required fields');
        }
        setIsSavingOffer(true);
        try {
            const selectedStore = myStores.find(s => (s._id || s.id) === selectedStoreId);
            const offerCategory = selectedStore ? selectedStore.category : (categories[0] || 'Fashion');
            
            let calculatedExpiry;
            const parts = offerExpiry.split('/');
            if (parts.length === 3) {
                calculatedExpiry = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 23, 59, 59);
            } else {
                calculatedExpiry = new Date(offerExpiry);
            }
            if (isNaN(calculatedExpiry.getTime())) {
                setIsSavingOffer(false);
                return Alert.alert('Invalid Date', 'Please type the expiry date in DD/MM/YYYY format.');
            }

            const offerData = { 
                title: offerTitle, 
                description: offerDesc, 
                discount: parseInt(offerDiscount), 
                originalPrice: parseInt(offerOriginalPrice),
                expiryDate: calculatedExpiry.toISOString(), 
                category: offerCategory,
                storeId: selectedStoreId, 
                image: offerImage 
            };
            if (editingOffer) {
                await updateOffer(editingOffer._id || editingOffer.id, offerData);
            } else {
                await addOffer(offerData);
            }
            setShowAddOffer(false);
            resetForms();
        } catch (e) {
            Alert.alert('Error', 'Failed to save offer');
        } finally {
            setIsSavingOffer(false);
        }
    };

    if (isLoading || !user) {
        return (
            <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color="#F5C518" size="large" />
            </View>
        );
    }

    const renderEmptyState = () => (
        <View style={s.emptyDashboard}>
            <View style={s.emptyIconCircle}>
                <Ionicons name="business-outline" size={80} color="#F5C518" />
            </View>
            <Text style={s.emptyTitle}>no stores registered yet</Text>
            <Text style={s.emptySub}>Start your business journey on DealSphere by registering your physical store today.</Text>
            <TouchableOpacity style={s.mainRegisterBtn} onPress={() => { resetForms(); setShowAddStore(true); }}>
                <Ionicons name="add" size={24} color="#000" />
                <Text style={s.mainRegisterBtnTxt}>Register Your Store</Text>
            </TouchableOpacity>
        </View>
    );

    // ── INLINE STORE OFFERS VIEW ─────────────────────────────────────────────
    if (selectedStore) {
        const sid = selectedStore._id || selectedStore.id;
        return (
            <View style={s.container}>
                {/* Spacer for top header */}
                <View style={{ height: Platform.OS === 'web' ? 70 : 0 }} />

                {/* Sub-header */}
                <View style={s.soHeader}>
                    <TouchableOpacity onPress={() => { setSelectedStore(null); resetForms(); }} style={s.soBackBtn}>
                        <Ionicons name="arrow-back" size={22} color="#F5C518" />
                        <Text style={s.soBackTxt}>Dashboard</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={s.soTitle} numberOfLines={1}>{selectedStore.storeName}</Text>
                        <Text style={s.soSub}>{selectedStoreOffers.length} offer{selectedStoreOffers.length !== 1 ? 's' : ''} active</Text>
                    </View>
                    <TouchableOpacity
                        style={s.soAddBtn}
                        onPress={() => { resetForms(); setSelectedStoreId(sid); setShowAddOffer(true); }}
                    >
                        <Ionicons name="add" size={20} color="#000" />
                        <Text style={s.soAddBtnTxt}>Add Offer</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={[s.scroll, selectedStoreOffers.length === 0 && { flexGrow: 1 }]}>
                    {selectedStoreOffers.length === 0 ? (
                        <View style={s.emptyDashboard}>
                            <View style={s.emptyIconCircle}>
                                <Ionicons name="pricetag-outline" size={70} color="#333" />
                            </View>
                            <Text style={s.emptyTitle}>No Offers Yet</Text>
                            <Text style={s.emptySub}>Launch your first deal for this store to attract customers.</Text>
                            <TouchableOpacity
                                style={s.mainRegisterBtn}
                                onPress={() => { resetForms(); setSelectedStoreId(sid); setShowAddOffer(true); }}
                            >
                                <Ionicons name="add" size={22} color="#000" />
                                <Text style={s.mainRegisterBtnTxt}>Launch First Offer</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={s.offerHeroGrid}>
                            {selectedStoreOffers.map(item => {
                                const cardW = screenWidth > 1024 ? '31%' : screenWidth > 700 ? '48%' : '100%';
                                const cardH = screenWidth > 1024 ? 260 : screenWidth > 700 ? 220 : 180;
                                return (
                                    <View key={item._id || item.id} style={[s.heroOfferCard, { width: cardW, height: cardH }]}>
                                        <Image
                                            source={{ uri: item.image || 'https://via.placeholder.com/600x400/1a1a1a/888?text=No+Image' }}
                                            style={s.heroOfferImg}
                                        />
                                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={s.heroOfferGrad}>
                                            <View style={s.heroTopRow}>
                                                <View style={s.offerHeroBadge}>
                                                    <Text style={s.offerHeroBadgeTxt}>{item.discount}% OFF</Text>
                                                </View>
                                            </View>

                                            <View style={s.heroOfferInfo}>
                                                <Text style={s.heroOfferTitle} numberOfLines={1}>{item.title}</Text>
                                                {item.description ? <Text style={s.heroOfferDesc} numberOfLines={1}>{item.description}</Text> : null}
                                                
                                                <View style={s.heroOfferBottomRow}>
                                                    <View>
                                                        <Text style={s.heroOfferPrice}>₹{(item.originalPrice * (1 - item.discount / 100)).toLocaleString()}</Text>
                                                        <Text style={s.heroOfferOldPrice}>₹{(item.originalPrice || 0).toLocaleString()}</Text>
                                                    </View>
                                                    
                                                    <View style={s.heroOfferActions}>
                                                        <TouchableOpacity
                                                            style={s.heroOfferEditBtn}
                                                            onPress={() => {
                                                                setEditingOffer(item);
                                                                setOfferTitle(item.title);
                                                                setOfferDesc(item.description);
                                                                setOfferDiscount(item.discount.toString());
                                                                setOfferOriginalPrice(item.originalPrice.toString());
                                                                const ex = new Date(item.expiryDate);
                                                                setOfferExpiry(`${String(ex.getDate()).padStart(2,'0')}/${String(ex.getMonth()+1).padStart(2,'0')}/${ex.getFullYear()}`);
                                                                setOfferImage(item.image);
                                                                setSelectedStoreId(sid);
                                                                setShowAddOffer(true);
                                                            }}
                                                        >
                                                            <Ionicons name="pencil" size={14} color="#000" />
                                                            <Text style={s.heroOfferEditBtnTxt}>Edit</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={s.heroOfferDeleteBtn}
                                                            onPress={() => {
                                                                if (Platform.OS === 'web') {
                                                                    if (window.confirm('Delete this offer?')) deleteOffer(item._id || item.id);
                                                                } else {
                                                                    Alert.alert('Delete', 'Delete this offer?', [
                                                                        { text: 'Cancel', style: 'cancel' },
                                                                        { text: 'Delete', style: 'destructive', onPress: () => deleteOffer(item._id || item.id) }
                                                                    ]);
                                                                }
                                                            }}
                                                        >
                                                            <Ionicons name="trash" size={14} color="#FF3B30" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                        </LinearGradient>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>

                {/* Offer Add/Edit Modal — reused from dashboard */}
                <Modal visible={showAddOffer} animationType="slide" transparent>
                    <View style={s.modalOverlay}>
                        <View style={s.modalContent}>
                            <View style={s.modalHeader}>
                                <Text style={s.modalTitle}>{editingOffer ? 'Update' : 'Launch'} Offer</Text>
                                <TouchableOpacity onPress={() => { setShowAddOffer(false); resetForms(); setSelectedStoreId(sid); }}>
                                    <Ionicons name="close" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView>
                                <TouchableOpacity style={s.imgPickerBox} onPress={handlePickOfferImage}>
                                    {offerImage
                                        ? <Image source={{ uri: offerImage }} style={s.pickedImg} />
                                        : <View style={{ alignItems: 'center' }}><Ionicons name="image-outline" size={36} color="#F5C518" /><Text style={s.imgPickerTxt}>Tap to upload photo</Text></View>
                                    }
                                </TouchableOpacity>
                                <View style={s.inputGrp}>
                                    <Text style={s.label}>Offer Title</Text>
                                    <TextInput style={s.input} value={offerTitle} onChangeText={setOfferTitle} placeholder="e.g. 50% Off Everything" placeholderTextColor="#555" />
                                </View>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <View style={[s.inputGrp, { flex: 1 }]}>
                                        <Text style={s.label}>Price (₹)</Text>
                                        <TextInput style={s.input} value={offerOriginalPrice} onChangeText={setOfferOriginalPrice} keyboardType="numeric" placeholder="1000" placeholderTextColor="#555" />
                                    </View>
                                    <View style={[s.inputGrp, { flex: 0.8 }]}>
                                        <Text style={s.label}>Discount %</Text>
                                        <TextInput style={s.input} value={offerDiscount} onChangeText={setOfferDiscount} keyboardType="numeric" placeholder="50" placeholderTextColor="#555" />
                                    </View>
                                </View>
                                <View style={s.inputGrp}>
                                    <Text style={s.label}>Expires On (DD/MM/YYYY)</Text>
                                    <TextInput style={s.input} value={offerExpiry} onChangeText={setOfferExpiry} placeholder="25/12/2026" placeholderTextColor="#555" />
                                </View>
                                <View style={s.inputGrp}>
                                    <Text style={s.label}>Description</Text>
                                    <TextInput style={[s.input, { height: 100, textAlignVertical: 'top', paddingTop: 10 }]} value={offerDesc} onChangeText={setOfferDesc} multiline placeholder="Describe your offer..." placeholderTextColor="#555" />
                                </View>
                                <TouchableOpacity
                                    style={[s.submitBtn, isSavingOffer && { opacity: 0.7 }]}
                                    onPress={async () => {
                                        if (!offerTitle || !offerDiscount || !offerOriginalPrice || !sid || !offerExpiry) {
                                            return Alert.alert('Error', 'Please fill in all required fields.');
                                        }
                                        setIsSavingOffer(true);
                                        try {
                                            let calculatedExpiry;
                                            const parts = offerExpiry.split('/');
                                            if (parts.length === 3) {
                                                calculatedExpiry = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 23, 59, 59);
                                            } else {
                                                calculatedExpiry = new Date(offerExpiry);
                                            }
                                            if (isNaN(calculatedExpiry.getTime())) {
                                                setIsSavingOffer(false);
                                                return Alert.alert('Invalid Date', 'Use DD/MM/YYYY format.');
                                            }
                                            const offerData = {
                                                title: offerTitle, description: offerDesc,
                                                discount: parseInt(offerDiscount),
                                                originalPrice: parseInt(offerOriginalPrice),
                                                expiryDate: calculatedExpiry.toISOString(),
                                                category: selectedStore.category || 'Fashion',
                                                storeId: sid, image: offerImage
                                            };
                                            if (editingOffer) {
                                                await updateOffer(editingOffer._id || editingOffer.id, offerData);
                                            } else {
                                                await addOffer(offerData);
                                            }
                                            setShowAddOffer(false);
                                            resetForms();
                                            setSelectedStoreId(sid);
                                        } catch (e) {
                                            Alert.alert('Error', 'Failed to save offer. Please try again.');
                                        } finally {
                                            setIsSavingOffer(false);
                                        }
                                    }}
                                    disabled={isSavingOffer}
                                >
                                    {isSavingOffer
                                        ? <ActivityIndicator color="#000" />
                                        : <Text style={s.submitBtnTxt}>{editingOffer ? 'Update' : 'Launch'} Offer</Text>
                                    }
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <View style={s.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                    {/* Global Header is provided by AppNavigator */}
                    <View style={{ height: Platform.OS === 'web' ? 70 : 0 }} />


                {/* Dashboard Title */}
                <View style={s.titleSection}>
                    <Text style={s.mainTitle}>Dashboard</Text>
                    <Text style={s.subTitle}>Manage your business performance and offers.</Text>
                </View>

                {allMyStores.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <>
                        {/* Stats Cards Stack */}
                        <View style={s.statsStack}>
                            <View style={s.statCardLine}>
                                <View>
                                    <Text style={s.statLabel}>MY ACTIVE OFFERS</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                                        <Text style={s.statValue}>{activeOffersCount}</Text>
                                    </View>
                                </View>
                                <Ionicons name="pricetag" size={40} color="rgba(255,255,255,0.05)" style={s.statIconBg} />
                            </View>

                            <View style={s.statCardLine}>
                                <View style={s.heartIconCircle}>
                                    <Ionicons name="heart" size={20} color="#F5C518" />
                                </View>
                                <View>
                                    <Text style={s.statValue}>{stats.totalLikes}</Text>
                                    <Text style={s.statLabel}>{t('store_likes')}</Text>
                                </View>
                                <Text style={[s.statLabel, { marginLeft: 'auto', alignSelf: 'flex-start' }]}>TOTAL LIKES</Text>
                            </View>
                            
                            <View style={s.statCardLine}>
                                <View style={[s.heartIconCircle, { backgroundColor: 'rgba(245,197,24,0.1)' }]}>
                                    <Ionicons name="star" size={20} color="#F5C518" />
                                </View>
                                <View>
                                    <Text style={s.statValue}>{stats.avgRating.toFixed(1)}</Text>
                                    <Text style={s.statLabel}>{t('store_rating')}</Text>
                                </View>
                                <Text style={[s.statLabel, { marginLeft: 'auto', alignSelf: 'flex-start' }]}>AVG RATING</Text>
                            </View>
                        </View>

                        <View style={s.layoutGrid}>
                            <View style={s.gridColumn}>
                                <View style={s.sectionHeader}>
                                    <Text style={s.sectionTitle}>My Managed Stores</Text>
                                    <TouchableOpacity style={s.smallAddBtn} onPress={() => { resetForms(); setShowAddStore(true); }}>
                                        <Ionicons name="add" size={20} color="#F5C518" />
                                        <Text style={s.smallAddBtnTxt}>Register New</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={s.storeHeroGrid}>
                                 {allMyStores.map((item) => {
                                        const cardW = screenWidth > 1024 ? '31%' : screenWidth > 700 ? '48%' : '100%';
                                        const cardH = screenWidth > 1024 ? 260 : screenWidth > 700 ? 220 : 180;
                                        const sid = item._id || item.id;
                                        return (
                                        <TouchableOpacity 
                                            key={sid}
                                            style={[s.heroStoreCard, { width: cardW, height: cardH }]}
                                            onPress={() => {
                                                if (item.approved) {
                                                    resetForms();
                                                    setSelectedStoreId(sid);
                                                    setSelectedStore(item);
                                                } else {
                                                    Alert.alert('Store Pending', "Not approved yet — offers can't be added.");
                                                }
                                            }}
                                        >
                                            <Image source={{ uri: item.bannerUrl || 'https://via.placeholder.com/600x400/111/333?text=No+Image' }} style={s.heroStoreImg} />
                                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.96)']} style={s.heroStoreGrad}>
                                                {/* Top badges */}
                                                <View style={s.heroTopRow}>
                                                    <View style={[s.heroCatBadge, { backgroundColor: item.approved ? 'rgba(245,197,24,0.9)' : 'rgba(120,120,120,0.85)' }]}>
                                                        <Text style={[s.heroCatBadgeTxt, { color: item.approved ? '#000' : '#fff' }]}>
                                                            {item.approved ? item.category?.toUpperCase() : 'PENDING'}
                                                        </Text>
                                                    </View>
                                                    {item.approved && (
                                                        <View style={s.approvedDot}>
                                                            <Ionicons name="checkmark-circle" size={14} color="#F5C518" />
                                                            <Text style={s.approvedDotTxt}>APPROVED</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                {/* Bottom info */}
                                                <View style={s.heroStoreInfo}>
                                                    <Text style={s.heroStoreName} numberOfLines={1}>{item.storeName}</Text>
                                                    <Text style={s.heroStoreLocation} numberOfLines={1}>{item.location}</Text>
                                                    {/* Action row */}
                                                    <View style={s.heroActionRow}>
                                                        <TouchableOpacity
                                                            style={s.heroEditBtn}
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                setEditingStore(item);
                                                                setStoreName(item.storeName);
                                                                setLocation(item.location);
                                                                setCategory(item.category);
                                                                setStoreImage(item.bannerUrl);
                                                                setStoreLocation({ lat: item.lat, lng: item.lng, address: item.address });
                                                                setShowAddStore(true);
                                                            }}
                                                        >
                                                            <Ionicons name="settings-outline" size={14} color="#000" />
                                                            <Text style={s.heroEditBtnTxt}>Edit</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={s.heroDeleteBtn}
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                if (Platform.OS === 'web') {
                                                                    if (window.confirm('Delete store? All offers will be lost.')) deleteStore(sid);
                                                                } else {
                                                                    Alert.alert('Delete Store', 'All offers will be lost. Proceed?', [
                                                                        { text: 'Cancel', style: 'cancel' },
                                                                        { text: 'Delete', style: 'destructive', onPress: () => deleteStore(sid) }
                                                                    ]);
                                                                }
                                                            }}
                                                        >
                                                            <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                        );
                                    })}
                                </View> {/* storeHeroGrid */}
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Store Modal */}
            <Modal visible={showAddStore} animationType="slide" transparent>
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>{editingStore ? t('edit') : t('register_store')}</Text>
                            <TouchableOpacity onPress={() => { setShowAddStore(false); resetForms(); }}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {/* Store Image Picker */}
                            <View style={s.imgPickerWrapper}>
                                <TouchableOpacity style={s.imgPickerBox} onPress={handlePickStoreImage}>
                                    {storeImage ? (
                                        <Image source={{ uri: storeImage }} style={s.pickedImg} />
                                    ) : (
                                        <View style={{ alignItems: 'center' }}>
                                            <Ionicons name="image-outline" size={36} color="#F5C518" />
                                            <Text style={s.imgPickerTxt}>Tap to upload{`\n`}Store Photo</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                {storeImage && (
                                    <TouchableOpacity style={s.deleteImgBtn} onPress={() => setStoreImage(null)}>
                                        <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                                        <Text style={s.deleteImgTxt}>Delete Photo</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={s.inputGrp}>
                                <Text style={s.label}>Store Name</Text>
                                <TextInput style={s.input} value={storeName} onChangeText={setStoreName} placeholder="e.g. Gucci Boutique" placeholderTextColor="#555" />
                            </View>
                            <StoreLocationPicker value={storeLocation} onLocationSelect={(loc) => setStoreLocation(loc)} locationText={location} onLocationTextChange={setLocation} />
                            <View style={s.inputGrp}>
                                <Text style={s.label}>Category</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                                    {categories.filter(c => c !== 'All').map(c => (
                                        <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[s.catChip, category === c && s.catChipAct]}>
                                            <Text style={[s.catChipTxt, category === c && s.catChipTxtAct]}>{c}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Business Proof Section - Only for new registrations */}
                            {!editingStore && (
                                <View style={[s.inputGrp, { marginTop: 10 }]}>
                                    <View style={s.sectionHeader}>
                                        <Text style={s.label}>Security Verification</Text>
                                        <View style={s.securityBadge}>
                                            <Ionicons name="shield-checkmark" size={10} color="#F5C518" />
                                            <Text style={s.securityBadgeTxt}>REQUIRED</Text>
                                        </View>
                                    </View>
                                    <Text style={s.helpHeader}>Upload a proof of business (GST, Trade License, or Shop Photo with owner) to prevent unauthorized claims.</Text>
                                    
                                    <View style={s.imgPickerWrapper}>
                                        <TouchableOpacity style={[s.imgPickerBox, !businessProofImage && { borderColor: proofError ? '#FF3B30' : 'rgba(255,59,48,0.3)', borderWidth: proofError ? 2 : 1 }]} onPress={() => { setProofError(false); handlePickBusinessProof(); }}>
                                            {businessProofImage ? (
                                                <Image source={{ uri: businessProofImage }} style={s.pickedImg} />
                                            ) : (
                                                <View style={{ alignItems: 'center' }}>
                                                    <Ionicons name="document-text-outline" size={36} color="#F5C518" />
                                                    <Text style={s.imgPickerTxt}>Tap to upload{`\n`}Business Proof</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                        {businessProofImage && (
                                            <TouchableOpacity style={s.deleteImgBtn} onPress={() => setBusinessProofImage(null)}>
                                                <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                                                <Text style={s.deleteImgTxt}>Delete Proof</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            )}

                            <TouchableOpacity style={[s.submitBtn, isSavingStore && { opacity: 0.7 }]} onPress={handleSaveStore} disabled={isSavingStore}>
                                {isSavingStore ? <ActivityIndicator color="#000" /> : <Text style={s.submitBtnTxt}>{editingStore ? 'Update Store' : 'Register Store'}</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D0D0D' },
    scroll: { 
        paddingBottom: 100,
        ...Platform.select({
            web: { width: '100%', maxWidth: 1000, alignSelf: 'center' }
        })
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, marginBottom: 20 },
    headerLogo: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
    italic: { fontStyle: 'italic' },
    bellBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    titleSection: { paddingHorizontal: 24, marginBottom: 32 },
    mainTitle: { color: '#FFFFFF', fontSize: 32, fontWeight: '900' },
    subTitle: { color: '#8E8E93', fontSize: 14, fontWeight: '400', marginTop: 8 },
    statsStack: { gap: 16, paddingHorizontal: 24 },
    statCardLine: { backgroundColor: '#1A1A1A', borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    statLabel: { color: '#8E8E93', fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
    statValue: { color: '#FFFFFF', fontSize: 32, fontWeight: '900' },
    statTrend: { color: '#F5C518', fontSize: 12, fontWeight: '700', marginBottom: 6 },
    statIconBg: { marginLeft: 'auto' },
    progressRow: { height: 4, width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 2, marginTop: 12, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#F5C518' },
    heartIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(245,197,24,0.1)', alignItems: 'center', justifyContent: 'center' },
    layoutGrid: {
        paddingHorizontal: 24,
        gap: 20,
        ...Platform.select({
            web: { flexDirection: 'row', alignItems: 'flex-start' },
            default: { flexDirection: 'column' }
        })
    },
    gridColumn: { flex: 1, gap: 16 },
    gridAddBtn: {
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#F5C518',
        borderRadius: 16,
        borderStyle: 'dashed',
        height: 55,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 10
    },
    gridAddBtnTxt: { color: '#F5C518', fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
    disabledBtn: { borderColor: '#333' },
    pendingWarning: { color: '#F5C518', textAlign: 'center', marginTop: -5, marginBottom: 15, fontSize: 12, fontStyle: 'italic' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
    smallAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,197,24,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(245,197,24,0.3)' },
    smallAddBtnTxt: { color: '#F5C518', fontSize: 13, fontWeight: '800' },
    emptyDashboard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100, paddingHorizontal: 40 },
    emptyIconCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(245,197,24,0.03)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(245,197,24,0.1)' },
    emptyTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 12 },
    emptySub: { color: '#8E8E93', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
    mainRegisterBtn: { backgroundColor: '#F5C518', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 30, paddingVertical: 18, borderRadius: 18 },
    mainRegisterBtnTxt: { color: '#000', fontSize: 16, fontWeight: '900' },
    pendingOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', gap: 10 },
    pendingText: { color: '#F5C518', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    approvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,197,24,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    approvedBadgeTxt: { color: '#F5C518', fontSize: 9, fontWeight: '900' },
    minimalBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    minimalBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
    storeCard: { 
        backgroundColor: '#1E1E1E', 
        borderRadius: 20, 
        overflow: 'hidden', 
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    storeImgContainer: { width: '100%', height: 130 },
    storeImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    activeBadge: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    activeBadgeTxt: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    discountBadge: { position: 'absolute', top: 15, left: 15, backgroundColor: '#F5C518', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
    discountBadgeTxt: { color: '#000', fontSize: 12, fontWeight: '900' },
    storeInfo: { padding: 14 },
    storeTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    storeName: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingTxt: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    locationTxt: { color: '#8E8E93', fontSize: 13 },
    tagRow: { flexDirection: 'row', gap: 10 },
    storeTag: { backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    storeTagTxt: { color: '#8E8E93', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    actionBtn: { flex: 1, height: 36, backgroundColor: '#F5C518', borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    actionBtnTxt: { color: '#000', fontSize: 13, fontWeight: '800' },
    deleteBtn: { backgroundColor: '#FF3B30' },
    deleteBtnTxt: { color: '#FFF', fontSize: 13, fontWeight: '800' },
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.95)', 
        ...Platform.select({
            ios: { justifyContent: 'flex-end' },
            android: { justifyContent: 'flex-end' },
            web: { justifyContent: 'center' }
        })
    },
    modalContent: { 
        backgroundColor: '#0D0D0D', 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30, 
        padding: 24, 
        maxHeight: '90%',
        ...Platform.select({
            web: { width: '100%', maxWidth: 700, alignSelf: 'center', borderRadius: 20 }
        })
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    modalTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
    inputGrp: { marginBottom: 20 },
    label: { color: '#F5C518', fontSize: 14, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: '#1A1A1A', borderRadius: 18, paddingHorizontal: 20, height: 56, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    catChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: '#1A1A1A', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    catChipAct: { backgroundColor: '#F5C518', borderColor: '#F5C518' },
    catChipTxt: { color: '#8E8E93', fontWeight: '700' },
    catChipTxtAct: { color: '#000' },
    imgPickerWrapper: { alignItems: 'center', marginBottom: 20 },
    imgPickerBox: { width: 200, height: 200, borderRadius: 16, backgroundColor: '#1A1A1A', borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(245,197,24,0.3)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    pickedImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    imgPickerTxt: { color: '#555555', marginTop: 8, fontWeight: '600', textAlign: 'center', fontSize: 13 },
    deleteImgBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)', backgroundColor: 'rgba(255,59,48,0.08)' },
    deleteImgTxt: { color: '#FF3B30', fontSize: 13, fontWeight: '700' },
    submitBtn: { backgroundColor: '#F5C518', height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 40 },
    submitBtnTxt: { color: '#000', fontSize: 18, fontWeight: '900' },
    securityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,197,24,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    securityBadgeTxt: { color: '#F5C518', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    helpHeader: { color: '#8E8E93', fontSize: 13, marginBottom: 15, lineHeight: 18 },
    // ── Inline Store Offers View styles ──────────────────────────────────────
    soHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 20, paddingVertical: 14,
        backgroundColor: '#111', borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    soBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    soBackTxt: { color: '#F5C518', fontSize: 13, fontWeight: '700' },
    soTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
    soSub: { color: '#8E8E93', fontSize: 12 },
    soAddBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#F5C518', paddingHorizontal: 14,
        paddingVertical: 8, borderRadius: 12,
    },
    soAddBtnTxt: { color: '#000', fontSize: 13, fontWeight: '900' },
    offerCard: {
        backgroundColor: '#1A1A1A', borderRadius: 16,
        overflow: 'hidden', borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    offerCardImg: { width: '100%', height: 140, resizeMode: 'cover' },
    offerCardBody: { padding: 14 },
    offerCardTitle: { color: '#fff', fontSize: 15, fontWeight: '800', flex: 1, marginRight: 8 },
    offerCardDesc: { color: '#8E8E93', fontSize: 13, marginTop: 4, lineHeight: 18 },
    offerDiscBadge: { backgroundColor: '#F5C518', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    offerDiscTxt: { color: '#000', fontSize: 11, fontWeight: '900' },
    offerPrice: { color: '#fff', fontSize: 16, fontWeight: '800' },
    offerOldPrice: { color: '#555', fontSize: 12, textDecorationLine: 'line-through' },
    iconBtn: {
        width: 36, height: 36, borderRadius: 10,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center', justifyContent: 'center',
    },
    // ── Hero Grid Store Cards (matching HomeScreen style) ─────────────────────
    storeHeroGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
        paddingHorizontal: 24,
        paddingTop: 8,
    },
    heroStoreCard: {
        borderRadius: 18,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#111',
    },
    heroStoreImg: {
        ...StyleSheet.absoluteFillObject,
        resizeMode: 'cover',
    },
    heroStoreGrad: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        padding: 12,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    heroCatBadge: {
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 8,
    },
    heroCatBadgeTxt: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    approvedDot: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 8,
    },
    approvedDotTxt: { color: '#F5C518', fontSize: 9, fontWeight: '900' },
    heroStoreInfo: {
        gap: 2,
    },
    heroStoreName: { color: '#fff', fontSize: 16, fontWeight: '900' },
    heroStoreLocation: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
    heroActionRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    heroEditBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#F5C518',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
    },
    heroEditBtnTxt: { color: '#000', fontSize: 12, fontWeight: '900' },
    heroDeleteBtn: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: 'rgba(255,59,48,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,59,48,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // ── Hero Grid Offer Cards ────────────────────────────────────────────────
    offerHeroGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    heroOfferCard: {
        borderRadius: 18,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#111',
    },
    heroOfferImg: {
        ...StyleSheet.absoluteFillObject,
        resizeMode: 'cover',
    },
    heroOfferGrad: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        padding: 12,
    },
    offerHeroBadge: {
        backgroundColor: '#F5C518',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    offerHeroBadgeTxt: {
        color: '#000',
        fontSize: 10,
        fontWeight: '900',
    },
    heroOfferInfo: {
        gap: 2,
    },
    heroOfferTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
    heroOfferDesc: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
    },
    heroOfferBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 6,
    },
    heroOfferPrice: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
    heroOfferOldPrice: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        textDecorationLine: 'line-through',
    },
    heroOfferActions: {
        flexDirection: 'row',
        gap: 6,
    },
    heroOfferEditBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F5C518',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    heroOfferEditBtnTxt: {
        color: '#000',
        fontSize: 11,
        fontWeight: '900',
    },
    heroOfferDeleteBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(255,59,48,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,59,48,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default StoreOwnerDashboardScreen;
