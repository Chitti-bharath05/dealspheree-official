import React, { useState, useMemo } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    FlatList, Modal, TextInput, Alert, Image, ActivityIndicator, 
    Dimensions, Platform 
} from 'react-native';
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

    const allMyStores = useMemo(() => getStoresByOwner(user?._id || user?.id) || [], [stores, user]);
    const myStores = useMemo(() => allMyStores, [allMyStores]); // Show all for management
    const hasApprovedStore = useMemo(() => allMyStores.some(s => s.approved), [allMyStores]);

    const activeOffersCount = useMemo(() => {
        return myOffers.filter(offer => new Date(offer.expiryDate) > new Date()).length;
    }, [myOffers]);

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
            return Alert.alert('Verification Required', 'Please upload a Business Proof (License, GST certificate, or Shop photo with sign) to register your store.');
        }

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
            <Text style={s.emptyTitle}>No Stores Registered</Text>
            <Text style={s.emptySub}>Start your business journey on DealSphere by registering your physical store today.</Text>
            <TouchableOpacity style={s.mainRegisterBtn} onPress={() => { resetForms(); setShowAddStore(true); }}>
                <Ionicons name="add" size={24} color="#000" />
                <Text style={s.mainRegisterBtnTxt}>Register Your Store</Text>
            </TouchableOpacity>
        </View>
    );

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

                {/* Stats Cards Stack */}
                <View style={s.statsStack}>
                    <View style={s.statCardLine}>
                        <View>
                            <Text style={s.statLabel}>MY ACTIVE OFFERS</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                                <Text style={s.statValue}>{activeOffersCount}</Text>
                                <Text style={s.statTrend}>+2 this week</Text>
                            </View>
                        </View>
                        <Ionicons name="pricetag" size={40} color="rgba(255,255,255,0.05)" style={s.statIconBg} />
                    </View>


                    <View style={s.statCardLine}>
                        <View style={s.heartIconCircle}>
                            <Ionicons name="heart" size={20} color="#F5C518" />
                        </View>
                        <View>
                            <Text style={s.statValue}>{myStore.likes || 0}</Text>
                            <Text style={s.statLabel}>{t('store_likes')}</Text>
                        </View>
                        <Text style={[s.statLabel, { marginLeft: 'auto', alignSelf: 'flex-start' }]}>{t('store_favorites_label')}</Text>
                    </View>
                    
                    <View style={s.statCardLine}>
                        <View style={[s.heartIconCircle, { backgroundColor: 'rgba(245,197,24,0.1)' }]}>
                            <Ionicons name="star" size={20} color="#F5C518" />
                        </View>
                        <View>
                            <Text style={s.statValue}>{myStore.rating?.toFixed(1) || '0.0'}</Text>
                            <Text style={s.statLabel}>{t('store_rating')}</Text>
                        </View>
                    </View>
                </View>

                {allMyStores.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <View style={s.layoutGrid}>
                        <View style={s.gridColumn}>
                            <View style={s.sectionHeader}>
                                <Text style={s.sectionTitle}>My Stores</Text>
                                <TouchableOpacity style={s.smallAddBtn} onPress={() => { resetForms(); setShowAddStore(true); }}>
                                    <Ionicons name="add" size={20} color="#F5C518" />
                                    <Text style={s.smallAddBtnTxt}>Add New</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={s.gridList}>
                                {allMyStores.map((item) => (
                                    <TouchableOpacity 
                                        key={item._id || item.id} 
                                        style={s.storeCard}
                                        onPress={() => {
                                            if (item.approved) {
                                                navigation.navigate('StoreOffers', { storeId: item._id || item.id });
                                            } else {
                                                Alert.alert('Store Pending', 'Your store is currently under review by the DealSphere team. You can manage offers once it is approved.');
                                            }
                                        }}
                                    >
                                        <View style={s.storeImgContainer}>
                                            <Image source={{ uri: item.bannerUrl || 'https://via.placeholder.com/600x300' }} style={s.storeImg} />
                                            {!item.approved && (
                                                <View style={s.pendingOverlay}>
                                                    <Ionicons name="time" size={24} color="#F5C518" />
                                                    <Text style={s.pendingText}>PENDING APPROVAL</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={s.storeInfo}>
                                            <View style={s.storeTitleRow}>
                                                <Text style={s.storeName}>{item.storeName}</Text>
                                                {item.approved && (
                                                    <View style={s.approvedBadge}>
                                                        <Ionicons name="checkmark-circle" size={14} color="#F5C518" />
                                                        <Text style={s.approvedBadgeTxt}>APPROVED</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={s.locationRow}>
                                                <Ionicons name="location" size={14} color="#8E8E93" />
                                                <Text style={s.locationTxt}>{item.location}</Text>
                                            </View>
                                            
                                            <View style={s.actionRow}>
                                                <TouchableOpacity 
                                                    style={s.minimalBtn}
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
                                                    <Ionicons name="settings-outline" size={16} color="#F5C518" />
                                                    <Text style={s.minimalBtnTxt}>Edit Basics</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity 
                                                    style={[s.minimalBtn, { borderColor: 'rgba(255,59,48,0.2)' }]}
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        if (Platform.OS === 'web') {
                                                            if(window.confirm('Delete store?')) deleteStore(item._id || item.id);
                                                        } else {
                                                            Alert.alert('Delete Store', 'All offers will be lost. Proceed?', [
                                                                { text: 'Cancel', style: 'cancel' },
                                                                { text: 'Delete', style: 'destructive', onPress: () => deleteStore(item._id || item.id) }
                                                            ]);
                                                        }
                                                    }}
                                                >
                                                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
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
                                        <TouchableOpacity style={[s.imgPickerBox, !businessProofImage && { borderColor: 'rgba(255,59,48,0.3)' }]} onPress={handlePickBusinessProof}>
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
    storeImgContainer: { width: '100%', height: 200 },
    storeImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    activeBadge: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    activeBadgeTxt: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    discountBadge: { position: 'absolute', top: 15, left: 15, backgroundColor: '#F5C518', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
    discountBadgeTxt: { color: '#000', fontSize: 12, fontWeight: '900' },
    storeInfo: { padding: 24 },
    storeTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    storeName: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingTxt: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
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
});

export default StoreOwnerDashboardScreen;
