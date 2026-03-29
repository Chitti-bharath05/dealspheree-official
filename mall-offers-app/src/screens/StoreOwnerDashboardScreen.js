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
    const [showAddOffer, setShowAddOffer] = useState(false);
    const [showAddStore, setShowAddStore] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [editingStore, setEditingStore] = useState(null);
    const [isSavingStore, setIsSavingStore] = useState(false);
    const [isSavingOffer, setIsSavingOffer] = useState(false);

    const myStores = useMemo(() => getStoresByOwner(user?._id || user?.id) || [], [stores, user]);
    const myStore = myStores[0] || {};
    const myOffers = useMemo(() => {
        return myStores.flatMap(store => {
            const storeId = store._id || store.id;
            return (getOffersByStore(storeId) || []).map(o => ({ ...o, storeName: store.storeName }));
        });
    }, [offers, myStores]);

    const hasApprovedStore = myStores.some(s => s.approved === true);

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

    const resetForms = () => {
        setStoreName(''); setLocation(''); setStoreLocation({ lat: null, lng: null }); setCategory(categories[0] || 'Fashion'); setStoreImage(null);
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
                    bannerUrl: storeImage
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

                {/* Two Column Layout */}
                <View style={s.layoutGrid}>
                    
                    {/* Left Column: My Stores */}
                    <View style={s.gridColumn}>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>My Stores</Text>
                            <TouchableOpacity onPress={() => setActiveTab('stores')}>
                                <Text style={s.viewAll}>View All</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={s.gridAddBtn} onPress={() => { resetForms(); setShowAddStore(true); }}>
                            <Ionicons name="add" size={20} color="#F5C518" />
                            <Text style={s.gridAddBtnTxt}>Register Store</Text>
                        </TouchableOpacity>

                        <View style={s.gridList}>
                    {myStores.map((item) => (
                        <View key={item._id || item.id} style={s.storeCard}>
                            <View style={s.storeImgContainer}>
                                <Image source={{ uri: item.bannerUrl || 'https://via.placeholder.com/600x300' }} style={s.storeImg} />
                                <View style={s.activeBadge}>
                                    <Text style={s.activeBadgeTxt}>ACTIVE</Text>
                                </View>
                            </View>
                            <View style={s.storeInfo}>
                                <View style={s.storeTitleRow}>
                                    <Text style={s.storeName}>{item.storeName}</Text>
                                    <View style={s.ratingRow}>
                                        <Ionicons name="star" size={14} color="#F5C518" />
                                        <Text style={s.ratingTxt}>{item.rating?.toFixed(1) || '0.0'}</Text>
                                    </View>
                                </View>
                                <View style={s.locationRow}>
                                    <Ionicons name="location" size={14} color="#8E8E93" />
                                    <Text style={s.locationTxt}>{item.location}</Text>
                                </View>
                                <View style={s.tagRow}>
                                    <View style={s.storeTag}>
                                        <Text style={s.storeTagTxt}>3 ACTIVE DEALS</Text>
                                    </View>
                                    <View style={s.storeTag}>
                                        <Text style={s.storeTagTxt}>{item.category.toUpperCase()}</Text>
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View style={s.actionRow}>
                                    <TouchableOpacity 
                                        style={s.actionBtn} 
                                        onPress={() => {
                                            setEditingStore(item);
                                            setStoreName(item.storeName || '');
                                            setLocation(item.location || '');
                                            setCategory(item.category || (categories[0] || 'Fashion'));
                                            setStoreImage(item.bannerUrl || null);
                                            setStoreLocation({
                                                lat: item.lat || null,
                                                lng: item.lng || null,
                                                address: item.address || ''
                                            });
                                            setShowAddStore(true);
                                        }}
                                    >
                                        <Ionicons name="pencil" size={16} color="#000" />
                                        <Text style={s.actionBtnTxt}>Edit Store</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[s.actionBtn, s.deleteBtn]} 
                                        onPress={() => {
                                            if (Platform.OS === 'web') {
                                                if(window.confirm('Are you sure you want to permanently delete this store and ALL its active offers?')) {
                                                    deleteStore(item._id || item.id);
                                                }
                                            } else {
                                                Alert.alert('Delete Store', 'Are you sure you want to permanently delete this store and ALL its active offers?', [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    { text: 'Delete', style: 'destructive', onPress: () => deleteStore(item._id || item.id) }
                                                ]);
                                            }
                                        }}
                                    >
                                        <Ionicons name="trash" size={16} color="#FFF" />
                                        <Text style={s.deleteBtnTxt}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))}
                        </View>
                    </View>
                    <View style={s.gridColumn}>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>My Offers</Text>
                            <TouchableOpacity onPress={() => setActiveTab('offers')}>
                                <Text style={s.viewAll}>View All</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            style={[s.gridAddBtn, !hasApprovedStore && s.disabledBtn]} 
                            onPress={() => {
                                if (!hasApprovedStore && myStores.length > 0) {
                                    Alert.alert('Store Pending', 'You cannot launch offers until your store is approved by an administrator.');
                                    return;
                                } else if (myStores.length === 0) {
                                    Alert.alert('No Store', 'Please register a store first.');
                                    return;
                                }
                                resetForms();
                                setShowAddOffer(true);
                            }}
                        >
                            <Ionicons name="add" size={20} color={hasApprovedStore ? "#F5C518" : "#8E8E93"} />
                            <Text style={[s.gridAddBtnTxt, !hasApprovedStore && { color: '#8E8E93' }]}>Add Offer</Text>
                        </TouchableOpacity>

                        {!hasApprovedStore && myStores.length > 0 && (
                            <Text style={s.pendingWarning}>
                                Your store registration is pending review.
                            </Text>
                        )}

                        <View style={s.gridList}>
                    {myOffers.length > 0 ? myOffers.map((item) => (
                        <View key={item._id || item.id} style={s.storeCard}>
                            <View style={[s.storeImgContainer, { height: 140 }]}>
                                <Image source={{ uri: item.image || 'https://via.placeholder.com/600x300' }} style={s.storeImg} />
                                <View style={s.discountBadge}>
                                    <Ionicons name="flash" size={12} color="#000" />
                                    <Text style={s.discountBadgeTxt}>{item.discount}% OFF</Text>
                                </View>
                            </View>
                            <View style={s.storeInfo}>
                                <View style={s.storeTitleRow}>
                                    <Text style={s.storeName}>{item.title}</Text>
                                </View>
                                <View style={s.locationRow}>
                                    <Ionicons name="pricetag" size={14} color="#8E8E93" />
                                    <Text style={s.locationTxt} numberOfLines={1}>{item.storeName}</Text>
                                    <Text style={[s.locationTxt, { marginLeft: 'auto', color: '#F5C518' }]}>
                                        Ends: {new Date(item.expiryDate).toLocaleDateString()}
                                    </Text>
                                </View>

                                {/* Action Buttons */}
                                <View style={s.actionRow}>
                                    <TouchableOpacity 
                                        style={s.actionBtn} 
                                        onPress={() => {
                                            setEditingOffer(item);
                                            setOfferTitle(item.title || '');
                                            setOfferDesc(item.description || '');
                                            setOfferDiscount(item.discount?.toString() || '');
                                            setOfferOriginalPrice(item.originalPrice?.toString() || '');
                                            if (item.expiryDate) {
                                                const ex = new Date(item.expiryDate);
                                                const d = String(ex.getDate()).padStart(2, '0');
                                                const m = String(ex.getMonth() + 1).padStart(2, '0');
                                                const y = ex.getFullYear();
                                                setOfferExpiry(`${d}/${m}/${y}`);
                                            } else {
                                                setOfferExpiry('');
                                            }
                                            setSelectedStoreId(item.storeId?._id || item.storeId || '');
                                            setShowAddOffer(true);
                                        }}
                                    >
                                        <Ionicons name="pencil" size={16} color="#000" />
                                        <Text style={s.actionBtnTxt}>Update Offer</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[s.actionBtn, s.deleteBtn]} 
                                        onPress={() => {
                                            if (Platform.OS === 'web') {
                                                if(window.confirm('Are you sure you want to delete this offer?')) {
                                                    deleteOffer(item._id || item.id);
                                                }
                                            } else {
                                                Alert.alert('Delete Offer', 'Are you sure you want to delete this offer?', [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    { text: 'Delete', style: 'destructive', onPress: () => deleteOffer(item._id || item.id) }
                                                ]);
                                            }
                                        }}
                                    >
                                        <Ionicons name="trash" size={16} color="#FFF" />
                                        <Text style={s.deleteBtnTxt}>Delete</Text>
                                    </TouchableOpacity>
                                </View>

                            </View>
                        </View>
                    )) : (
                        <Text style={s.pendingWarning}>No active offers found. Added offers will appear here.</Text>
                    )}
                        </View>
                    </View>
                </View>
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
                            <TouchableOpacity style={[s.submitBtn, isSavingStore && { opacity: 0.7 }]} onPress={handleSaveStore} disabled={isSavingStore}>
                                {isSavingStore ? <ActivityIndicator color="#000" /> : <Text style={s.submitBtnTxt}>{editingStore ? 'Update Store' : 'Add Store'}</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Offer Modal */}
            <Modal visible={showAddOffer} animationType="slide" transparent>
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>{editingOffer ? t('edit_offer') : t('add_new_offer')}</Text>
                            <TouchableOpacity onPress={() => { setShowAddOffer(false); resetForms(); }}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {/* Offer Image Picker */}
                            <View style={s.imgPickerWrapper}>
                                <TouchableOpacity style={s.imgPickerBox} onPress={handlePickOfferImage}>
                                    {offerImage ? (
                                        <Image source={{ uri: offerImage }} style={s.pickedImg} />
                                    ) : (
                                        <View style={{ alignItems: 'center' }}>
                                            <Ionicons name="image-outline" size={36} color="#F5C518" />
                                            <Text style={s.imgPickerTxt}>Tap to upload{`\n`}Offer Photo</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                {offerImage && (
                                    <TouchableOpacity style={s.deleteImgBtn} onPress={() => setOfferImage(null)}>
                                        <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                                        <Text style={s.deleteImgTxt}>Delete Photo</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={s.inputGrp}>
                                <Text style={s.label}>Store</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                                    {myStores.map(st => (
                                        <TouchableOpacity key={st._id || st.id} onPress={() => setSelectedStoreId(st._id || st.id)} style={[s.catChip, selectedStoreId === (st._id || st.id) && s.catChipAct]}>
                                            <Text style={[s.catChipTxt, selectedStoreId === (st._id || st.id) && s.catChipTxtAct]}>{st.storeName}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                            <View style={s.inputGrp}>
                                <Text style={s.label}>Offer Title</Text>
                                <TextInput style={s.input} value={offerTitle} onChangeText={setOfferTitle} placeholder="e.g. 50% End of Season Sale" placeholderTextColor="#555" />
                            </View>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={[s.inputGrp, { flex: 1.2 }]}>
                                    <Text style={s.label}>Orig. Price (₹)</Text>
                                    <TextInput style={s.input} value={offerOriginalPrice} onChangeText={setOfferOriginalPrice} keyboardType="numeric" placeholder="e.g. 5000" placeholderTextColor="#555" />
                                </View>
                                <View style={[s.inputGrp, { flex: 1 }]}>
                                    <Text style={s.label}>Discount %</Text>
                                    <TextInput style={s.input} value={offerDiscount} onChangeText={setOfferDiscount} keyboardType="numeric" placeholder="e.g. 50" placeholderTextColor="#555" />
                                </View>
                                <View style={[s.inputGrp, { flex: 1.6 }]}>
                                    <Text style={s.label}>Expires On (DD/MM/YYYY)</Text>
                                    <TextInput style={s.input} value={offerExpiry} onChangeText={setOfferExpiry} placeholder="e.g. 25/12/2026" placeholderTextColor="#555" />
                                </View>
                            </View>
                            <View style={s.inputGrp}>
                                <Text style={s.label}>Description</Text>
                                <TextInput style={[s.input, { height: 100, textAlignVertical: 'top', paddingTop: 15 }]} value={offerDesc} onChangeText={setOfferDesc} multiline placeholder="Tell customers about this exclusive offer..." placeholderTextColor="#555" />
                            </View>
                            <TouchableOpacity style={[s.submitBtn, isSavingOffer && { opacity: 0.7 }]} onPress={handleSaveOffer} disabled={isSavingOffer}>
                                {isSavingOffer ? <ActivityIndicator color="#000" /> : <Text style={s.submitBtnTxt}>{editingOffer ? 'Update Offer' : 'Launch Offer'}</Text>}
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
    pendingWarning: { color: '#D4AF37', textAlign: 'center', marginTop: -5, marginBottom: 15, fontSize: 12, fontStyle: 'italic' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
    sectionTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
    viewAll: { color: '#8E8E93', fontSize: 13, fontWeight: '700', marginBottom: 2 },
    gridList: { gap: 20 },
    storeCard: { backgroundColor: '#1A1A1A', borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
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
});

export default StoreOwnerDashboardScreen;
