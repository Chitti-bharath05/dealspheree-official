import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, Modal, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const StoreOwnerDashboardScreen = () => {
    const { user, logout } = useAuth();
    const { getStoresByOwner, getOffersByStore, addOffer, updateOffer, updateStore, deleteOffer, registerStore, categories, isLoading } = useData();
    const [activeTab, setActiveTab] = useState('offers');
    const [showAddOffer, setShowAddOffer] = useState(false);
    const [showAddStore, setShowAddStore] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [offerTitle, setOfferTitle] = useState('');
    const [offerDesc, setOfferDesc] = useState('');
    const [offerDiscount, setOfferDiscount] = useState('');
    const [offerPrice, setOfferPrice] = useState('');
    const [offerExpiry, setOfferExpiry] = useState('');
    const [offerCategory, setOfferCategory] = useState('Fashion');
    const [offerIsOnline, setOfferIsOnline] = useState(false);
    const [storeName, setStoreName] = useState('');
    const [storeLocation, setStoreLocation] = useState('');
    const [storeAddress, setStoreAddress] = useState('');
    const [storeCategory, setStoreCategory] = useState('Fashion');
    const [storeHasDelivery, setStoreHasDelivery] = useState(false);
    const [storeLogo, setStoreLogo] = useState(null);
    const [storeBanner, setStoreBanner] = useState(null);
    const [offerImage, setOfferImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingStoreAsset, setIsUploadingStoreAsset] = useState(false);
    const [editingStore, setEditingStore] = useState(null);
    const [selectedStoreId, setSelectedStoreId] = useState('');
    const [analytics, setAnalytics] = useState([]);
    const { getStoreAnalytics } = useData();

    const myStores = getStoresByOwner(user._id || user.id) || [];
    const approvedStores = myStores.filter(s => s && s.approved);

    React.useEffect(() => {
        const fetchAnalytics = async () => {
            if (approvedStores.length > 0) {
                try {
                    const results = await Promise.all(approvedStores.map(s => getStoreAnalytics(s._id || s.id)));
                    setAnalytics(results.flat());
                } catch (err) {
                    console.error('Analytics fetch error:', err);
                }
            }
        };
        fetchAnalytics();
    }, [approvedStores.length]);

    if (isLoading || !user) {
        return (
            <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
                <Text style={{ color: '#fff', fontSize: 18 }}>Loading Dashboard...</Text>
            </View>
        );
    }

    const allMyOffers = myStores.flatMap(store => {
        const storeId = store._id || store.id;
        return (getOffersByStore(storeId) || []).map(o => ({ ...o, storeName: store.storeName }));
    });

    const resetForm = () => { 
        setOfferTitle(''); setOfferDesc(''); setOfferDiscount(''); setOfferPrice(''); 
        setOfferExpiry(''); setOfferCategory('Fashion'); setOfferIsOnline(false); 
        setEditingOffer(null); setOfferImage(null);
        if (approvedStores.length > 0) setSelectedStoreId(approvedStores[0]._id || approvedStores[0].id);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0]);
        }
    };

    const uploadImage = async (asset) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            const uri = asset.uri;
            const name = asset.fileName || uri.split('/').pop();
            const type = asset.mimeType || `image/${name.split('.').pop()}`;

            if (Platform.OS === 'web') {
                // On web, we need to fetch the local URI and convert it to a Blob
                const response = await fetch(uri);
                const blob = await response.blob();
                formData.append('image', blob, name);
            } else {
                formData.append('image', {
                    uri: uri.replace('file://', ''),
                    name: name,
                    type: type,
                });
            }

            const response = await apiClient.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.success) {
                setOfferImage(response.imageUrl);
            } else {
                throw new Error(response.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error details:', error);
            const msg = error.response?.data?.message || error.message || 'Image upload failed';
            Alert.alert('Upload Error', msg);
        } finally {
            setIsUploading(false);
        }
    };

    const uploadStoreAsset = async (asset, type) => {
        setIsUploadingStoreAsset(true);
        try {
            const formData = new FormData();
            const uri = asset.uri;
            const name = asset.fileName || uri.split('/').pop();

            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();
                formData.append('image', blob, name);
            } else {
                formData.append('image', {
                    uri: uri.replace('file://', ''),
                    name: name,
                    type: asset.mimeType || `image/${name.split('.').pop()}`,
                });
            }

            const response = await apiClient.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.success) {
                if (type === 'logo') setStoreLogo(response.imageUrl);
                else setStoreBanner(response.imageUrl);
            }
        } catch (error) {
            Alert.alert('Upload Error', 'Asset upload failed');
        } finally {
            setIsUploadingStoreAsset(false);
        }
    };

    const handleAddOffer = async () => {
        if (!offerTitle.trim() || offerDiscount === '' || offerPrice === '') { 
            Alert.alert('Error', 'Please fill in Title, Discount, and Price'); 
            return; 
        }
        
        if (approvedStores.length === 0) { 
            Alert.alert('Error', 'You need an approved store to add offers'); 
            return; 
        }

        const discountNum = parseInt(offerDiscount);
        const priceNum = parseInt(offerPrice);

        if (isNaN(discountNum) || isNaN(priceNum)) {
            Alert.alert('Error', 'Discount and Price must be valid numbers');
            return;
        }

        const data = { 
            title: offerTitle.trim(), 
            description: offerDesc.trim(), 
            discount: discountNum, 
            originalPrice: priceNum, 
            storeId: selectedStoreId || (approvedStores[0] ? (approvedStores[0]._id || approvedStores[0].id) : null), 
            expiryDate: offerExpiry || '2026-12-31', 
            category: offerCategory, 
            isOnline: !!offerIsOnline, 
            image: offerImage 
        };

        try {
            if (editingOffer) { 
                await updateOffer(editingOffer._id || editingOffer.id, data); 
                Alert.alert('Success', 'Offer updated successfully!'); 
            }
            else { 
                await addOffer(data); 
                Alert.alert('Success', 'Offer added successfully!'); 
            }
            resetForm(); 
            setShowAddOffer(false);
        } catch (e) {
            console.error('Save offer error:', e);
            const errorMsg = e.response?.data?.errors?.join('\n') || e.response?.data?.message || e.message || 'Failed to save offer';
            Alert.alert('Error', errorMsg);
        }
    };

    const handleEditOffer = (offer) => {
        setOfferTitle(offer.title); setOfferDesc(offer.description); setOfferDiscount(String(offer.discount));
        setOfferPrice(String(offer.originalPrice)); setOfferExpiry(offer.expiryDate ? new Date(offer.expiryDate).toISOString().split('T')[0] : ''); setOfferCategory(offer.category);
        setOfferIsOnline(offer.isOnline); setEditingOffer(offer); setOfferImage(offer.image); 
        
        const sId = offer.storeId?._id || offer.storeId?.id || offer.storeId;
        setSelectedStoreId(typeof sId === 'string' ? sId : ''); 
        setShowAddOffer(true);
    };

    const handleDeleteOffer = async (id) => {
        const doDelete = async () => {
            try {
                await deleteOffer(id);
                Alert.alert('Deleted', 'Offer removed');
            } catch (e) {
                Alert.alert('Error', 'Failed to delete offer');
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete this offer?')) {
                await doDelete();
            }
        } else {
            Alert.alert('Delete?', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: doDelete }]);
        }
    };

    const handleAddStore = async () => {
        if (!storeName.trim() || !storeLocation.trim()) { Alert.alert('Error', 'Fill all fields'); return; }
        try {
            if (editingStore) {
                await updateStore(editingStore._id || editingStore.id, {
                    storeName: storeName.trim(),
                    location: storeLocation.trim(),
                    address: storeAddress.trim(),
                    category: storeCategory,
                    logoUrl: storeLogo,
                    bannerUrl: storeBanner,
                    hasDeliveryPartner: storeHasDelivery
                });
                Alert.alert('Success', 'Store updated successfully');
            } else {
                await registerStore(storeName.trim(), user._id || user.id, storeLocation.trim(), storeAddress.trim(), storeCategory, storeLogo, storeBanner, storeHasDelivery);
                Alert.alert('Success', 'Store submitted for approval');
            }
            setStoreName(''); setStoreLocation(''); setStoreAddress(''); setStoreLogo(null); setStoreBanner(null); setStoreHasDelivery(false); setEditingStore(null); setShowAddStore(false);
        } catch (e) {
            Alert.alert('Error', 'Failed to save store');
        }
    };

    const handleEditStore = (store) => {
        setStoreName(store.storeName);
        setStoreLocation(store.location);
        setStoreAddress(store.address || '');
        setStoreCategory(store.category);
        setStoreLogo(store.logoUrl);
        setStoreBanner(store.bannerUrl);
        setStoreHasDelivery(!!store.hasDeliveryPartner);
        setEditingStore(store);
        setShowAddStore(true);
    };

    return (
        <View style={s.container}>
            <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={s.gradient}>
                <View style={s.header}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={s.headerTitle}>Store Dashboard</Text>
                            <Text style={s.headerSub}>Manage your stores & offers</Text>
                        </View>
                        <TouchableOpacity
                            style={s.headerLogout}
                            onPress={() => {
                                const doLogout = () => logout();
                                if (Platform.OS === 'web') {
                                    try {
                                        if (window.confirm('Sign out?')) doLogout();
                                    } catch (e) {
                                        doLogout();
                                    }
                                } else {
                                    Alert.alert('Sign Out', 'Are you sure?', [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Sign Out', style: 'destructive', onPress: doLogout }
                                    ]);
                                }
                            }}
                        >
                            <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={s.statsRow}>
                    {[
                        { v: myStores.length, l: 'Stores', c: '#FF8E53' },
                        { v: allMyOffers.length, l: 'Offers', c: '#A18CD1' },
                        { v: analytics.length, l: 'Orders', c: '#4ECDC4' },
                        { v: `₹${analytics.reduce((s, o) => s + o.storeRevenue, 0).toLocaleString()}`, l: 'Revenue', c: '#FF6B6B' }
                    ].map((st, i) => (
                        <View key={i} style={s.statCard}>
                            <Text style={[s.statVal, { color: st.c }]}>{st.v}</Text>
                            <Text style={s.statLbl}>{st.l}</Text>
                        </View>
                    ))}
                </View>
                <View style={s.tabRow}>
                    {['offers', 'stores'].map(t => (
                        <TouchableOpacity key={t} style={[s.tab, activeTab === t && s.tabAct]} onPress={() => setActiveTab(t)}>
                            <Text style={[s.tabTxt, activeTab === t && s.tabTxtAct]}>{t === 'offers' ? 'Offers' : 'My Stores'}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity style={s.addBtn} onPress={() => activeTab === 'offers' ? (resetForm(), setShowAddOffer(true)) : setShowAddStore(true)}>
                    <LinearGradient colors={activeTab === 'offers' ? ['#FF6B6B', '#FF8E53'] : ['#4ECDC4', '#44B39D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.addBtnG}>
                        <Ionicons name="add-circle-outline" size={20} color="#fff" />
                        <Text style={s.addBtnTxt}>{activeTab === 'offers' ? 'Add New Offer' : 'Register Store'}</Text>
                    </LinearGradient>
                </TouchableOpacity>
                {activeTab === 'offers' ? (
                    <FlatList data={allMyOffers} keyExtractor={i => i._id || i.id} contentContainerStyle={s.list} showsVerticalScrollIndicator={Platform.OS !== 'web'}
                        renderItem={({ item }) => (
                            <View style={s.card}>
                                <View style={s.cardTop}>
                                    <View style={{ flex: 1 }}><Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text><Text style={s.cardSub}>{item.storeName}</Text></View>
                                    <View style={s.discBadge}><Text style={s.discTxt}>{item.discount}% OFF</Text></View>
                                </View>
                                <View style={s.cardBot}>
                                    <Text style={s.expTxt}>Expires: {new Date(item.expiryDate).toLocaleDateString()}</Text>
                                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 8 }}>
                                            <Ionicons name="eye-outline" size={16} color="#8E8E93" />
                                            <Text style={{ color: '#8E8E93', fontSize: 13, fontWeight: '600' }}>{item.views || 0}</Text>
                                        </View>
                                        <TouchableOpacity style={s.editB} onPress={() => handleEditOffer(item)}><Ionicons name="create-outline" size={18} color="#4ECDC4" /></TouchableOpacity>
                                        <TouchableOpacity style={s.delB} onPress={() => handleDeleteOffer(item._id || item.id)}><Ionicons name="trash-outline" size={18} color="#FF6B6B" /></TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={<View style={s.empty}><Ionicons name="pricetags-outline" size={48} color="#4A4A5A" /><Text style={s.emptyTxt}>No offers yet</Text></View>}
                    />
                ) : (
                    <FlatList data={myStores} keyExtractor={i => i._id || i.id} contentContainerStyle={s.list} showsVerticalScrollIndicator={Platform.OS !== 'web'}
                        renderItem={({ item }) => (
                            <View style={s.card}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        {item.logoUrl ? (
                                            <Image source={{ uri: item.logoUrl }} style={s.storeLogoPreview} />
                                        ) : (
                                            <View style={s.storeIc}><Ionicons name="storefront" size={20} color="#FF8E53" /></View>
                                        )}
                                        <View>
                                            <Text style={s.cardTitle}>{item.storeName}</Text>
                                            <Text style={s.cardSub}>{item.location}</Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={[s.statusB, { backgroundColor: item.approved ? 'rgba(78,205,196,0.15)' : 'rgba(255,142,83,0.15)' }]}>
                                            <Text style={{ color: item.approved ? '#4ECDC4' : '#FF8E53', fontSize: 12, fontWeight: '700' }}>{item.approved ? 'Approved' : 'Pending'}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleEditStore(item)}>
                                            <Ionicons name="create-outline" size={20} color="#4ECDC4" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={<View style={s.empty}><Ionicons name="storefront-outline" size={48} color="#4A4A5A" /><Text style={s.emptyTxt}>No stores</Text></View>}
                    />
                )}
                {/* Add Offer Modal */}
                <Modal visible={showAddOffer} animationType="slide" transparent>
                    <View style={s.modalOv}><View style={s.modalC}><LinearGradient colors={['#1a1a2e', '#16213e']} style={s.modalG}>
                        <ScrollView 
                            showsVerticalScrollIndicator={true} 
                            persistentScrollbar={true}
                            contentContainerStyle={{ paddingBottom: 60 }}
                        >
                            <View style={s.modalH}><Text style={s.modalT}>{editingOffer ? 'Edit Offer' : 'Add Offer'}</Text><TouchableOpacity onPress={() => setShowAddOffer(false)}><Ionicons name="close-circle" size={28} color="#8E8E93" /></TouchableOpacity></View>
                            <TextInput style={s.mInput} placeholder="Title *" placeholderTextColor="#8E8E93" value={offerTitle} onChangeText={setOfferTitle} />
                            <TextInput style={[s.mInput, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Description" placeholderTextColor="#8E8E93" value={offerDesc} onChangeText={setOfferDesc} multiline />
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TextInput style={[s.mInput, { flex: 1 }]} placeholder="Discount %" placeholderTextColor="#8E8E93" value={offerDiscount} onChangeText={setOfferDiscount} keyboardType="numeric" />
                                <TextInput style={[s.mInput, { flex: 1 }]} placeholder="Price ₹" placeholderTextColor="#8E8E93" value={offerPrice} onChangeText={setOfferPrice} keyboardType="numeric" />
                            </View>
                             <TextInput style={s.mInput} placeholder="Expiry (YYYY-MM-DD)" placeholderTextColor="#8E8E93" value={offerExpiry} onChangeText={setOfferExpiry} />
                            
                            {approvedStores.length > 1 && (
                                <>
                                    <Text style={s.mLabel}>Select Store</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                                        {approvedStores.map(st => (
                                            <TouchableOpacity 
                                                key={st._id || st.id} 
                                                style={[s.chip, selectedStoreId === (st._id || st.id) && s.chipA]} 
                                                onPress={() => setSelectedStoreId(st._id || st.id)}
                                            >
                                                <Text style={[s.chipT, selectedStoreId === (st._id || st.id) && s.chipTA]}>{st.storeName}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View></ScrollView>
                                </>
                            )}

                            <Text style={s.mLabel}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                                {categories.filter(c => c !== 'All').map(c => <TouchableOpacity key={c} style={[s.chip, offerCategory === c && s.chipA]} onPress={() => setOfferCategory(c)}><Text style={[s.chipT, offerCategory === c && s.chipTA]}>{c}</Text></TouchableOpacity>)}
                            </View></ScrollView>
                            <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 }} onPress={() => setOfferIsOnline(!offerIsOnline)}>
                                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Available Online</Text>
                                <Ionicons name={offerIsOnline ? 'toggle' : 'toggle-outline'} size={36} color={offerIsOnline ? '#4ECDC4' : '#8E8E93'} />
                            </TouchableOpacity>

                            <Text style={s.mLabel}>Offer Image</Text>
                            <TouchableOpacity 
                                style={[s.uploadContainer, offerImage && s.uploadContainerActive]} 
                                onPress={pickImage} 
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <View style={s.uploadPlaceholder}>
                                        <Text style={s.uploadText}>Uploading to cloud...</Text>
                                    </View>
                                ) : offerImage ? (
                                    <View style={s.previewContainer}>
                                        <Ionicons name="checkmark-circle" size={32} color="#4ECDC4" />
                                        <Text style={s.previewText}>Photo Uploaded!</Text>
                                        <Text style={s.changeText}>Tap to change photo</Text>
                                    </View>
                                ) : (
                                    <View style={s.uploadPlaceholder}>
                                        <LinearGradient 
                                            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)']} 
                                            style={s.uploadBtnInner}
                                        >
                                            <Ionicons name="cloud-upload-outline" size={32} color="#FF8E53" />
                                            <Text style={s.uploadBtnText}>Upload Offer Photo</Text>
                                            <Text style={s.uploadBtnSub}>Best size: 16:9 aspect ratio</Text>
                                        </LinearGradient>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[s.mSubmit, { marginBottom: 40 }]} 
                                onPress={handleAddOffer}
                            >
                                <LinearGradient colors={['#FF6B6B', '#FF8E53']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.mSubmitG}>
                                    <Text style={s.mSubmitT}>{editingOffer ? 'Update Offer' : 'Add New Offer'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </LinearGradient></View></View>
                </Modal>
                {/* Add/Edit Store Modal */}
                <Modal visible={showAddStore} animationType="slide" transparent>
                    <View style={s.modalOv}><View style={s.modalC}><LinearGradient colors={['#1a1a2e', '#16213e']} style={s.modalG}>
                        <ScrollView showsVerticalScrollIndicator={true} persistentScrollbar={true}>
                            <View style={s.modalH}>
                                <Text style={s.modalT}>{editingStore ? 'Edit Store' : 'Register Store'}</Text>
                                <TouchableOpacity onPress={() => { setShowAddStore(false); setEditingStore(null); }}><Ionicons name="close-circle" size={28} color="#8E8E93" /></TouchableOpacity>
                            </View>
                            <TextInput style={s.mInput} placeholder="Store Name *" placeholderTextColor="#8E8E93" value={storeName} onChangeText={setStoreName} />
                            <TextInput style={s.mInput} placeholder="Area/Location *" placeholderTextColor="#8E8E93" value={storeLocation} onChangeText={setStoreLocation} />
                            <TextInput style={[s.mInput, { height: 80 }]} placeholder="Detailed Address (Optional)" placeholderTextColor="#8E8E93" value={storeAddress} onChangeText={setStoreAddress} multiline />
                            
                            <TouchableOpacity 
                                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }} 
                                onPress={() => setStoreHasDelivery(!storeHasDelivery)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Ionicons name="bicycle" size={20} color="#FF6B6B" />
                                    <View>
                                        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Delivery Partner</Text>
                                        <Text style={{ color: '#8E8E93', fontSize: 12 }}>Does this store offer delivery?</Text>
                                    </View>
                                </View>
                                <Ionicons name={storeHasDelivery ? 'toggle' : 'toggle-outline'} size={36} color={storeHasDelivery ? '#4ECDC4' : '#8E8E93'} />
                            </TouchableOpacity>

                            <Text style={s.mLabel}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                                {categories.filter(c => c !== 'All').map(c => <TouchableOpacity key={c} style={[s.chip, storeCategory === c && s.chipA]} onPress={() => setStoreCategory(c)}><Text style={[s.chipT, storeCategory === c && s.chipTA]}>{c}</Text></TouchableOpacity>)}
                            </View></ScrollView>

                            <Text style={s.mLabel}>Store Branding</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                                <TouchableOpacity 
                                    style={[s.brandingUpload, { flex: 1 }, storeLogo && { borderColor: '#4ECDC4' }]} 
                                    onPress={async () => {
                                        const res = await ImagePicker.launchImageLibraryAsync({ aspect: [1, 1], allowsEditing: true, quality: 0.6 });
                                        if (!res.canceled) uploadStoreAsset(res.assets[0], 'logo');
                                    }}
                                >
                                    {storeLogo ? <Image source={{ uri: storeLogo }} style={s.brandingFill} /> : <View style={s.brandingEmpty}><Ionicons name="image-outline" size={24} color="#8E8E93" /><Text style={s.brandingTxt}>Logo</Text></View>}
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[s.brandingUpload, { flex: 2 }, storeBanner && { borderColor: '#4ECDC4' }]}
                                    onPress={async () => {
                                        const res = await ImagePicker.launchImageLibraryAsync({ aspect: [16, 9], allowsEditing: true, quality: 0.7 });
                                        if (!res.canceled) uploadStoreAsset(res.assets[0], 'banner');
                                    }}
                                >
                                    {storeBanner ? <Image source={{ uri: storeBanner }} style={s.brandingFill} /> : <View style={s.brandingEmpty}><Ionicons name="images-outline" size={24} color="#8E8E93" /><Text style={s.brandingTxt}>Banner</Text></View>}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={s.mSubmit} onPress={handleAddStore}>
                                <LinearGradient colors={['#4ECDC4', '#44B39D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.mSubmitG}>
                                    <Text style={s.mSubmitT}>{editingStore ? 'Save Changes' : 'Submit for Approval'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </LinearGradient></View></View>
                </Modal>
            </LinearGradient>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1 }, gradient: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
    headerTitle: { color: '#fff', fontSize: 26, fontWeight: '800' }, headerSub: { color: '#A0A0B0', fontSize: 14, marginTop: 2 },
    headerLogout: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,107,107,0.15)', alignItems: 'center', justifyContent: 'center' },
    statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 12 },
    statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    statVal: { color: '#FF8E53', fontSize: 24, fontWeight: '900' }, statLbl: { color: '#8E8E93', fontSize: 12, marginTop: 4 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 }, tabAct: { backgroundColor: '#FF6B6B' },
    tabTxt: { color: '#8E8E93', fontSize: 14, fontWeight: '600' }, tabTxtAct: { color: '#fff' },
    addBtn: { marginHorizontal: 20, marginTop: 16, borderRadius: 14, overflow: 'hidden' },
    addBtnG: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14 },
    addBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
    list: { padding: 20, paddingBottom: 100 },
    card: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' }, cardSub: { color: '#A0A0B0', fontSize: 12, marginTop: 2 },
    discBadge: { backgroundColor: 'rgba(255,107,107,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    discTxt: { color: '#FF6B6B', fontSize: 12, fontWeight: '700' },
    cardBot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    expTxt: { color: '#8E8E93', fontSize: 12 },
    editB: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(78,205,196,0.15)', alignItems: 'center', justifyContent: 'center' },
    delB: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,107,107,0.15)', alignItems: 'center', justifyContent: 'center' },
    storeIc: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,142,83,0.15)', alignItems: 'center', justifyContent: 'center' },
    statusB: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    empty: { alignItems: 'center', paddingTop: 40 }, emptyTxt: { color: '#8E8E93', fontSize: 16, marginTop: 12 },
    modalOv: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
    modalC: { width: '100%', maxWidth: 500, alignSelf: 'center', height: '90%', borderRadius: 28, overflow: 'hidden' },
    modalG: { flex: 1, padding: 24 },
    modalH: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalT: { color: '#fff', fontSize: 22, fontWeight: '800' },
    mInput: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    mLabel: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 4 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    chipA: { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' }, chipT: { color: '#8E8E93', fontSize: 13, fontWeight: '600' }, chipTA: { color: '#fff' },
    mSubmit: { borderRadius: 14, overflow: 'hidden', marginTop: 10 },
    mSubmitG: { paddingVertical: 15, alignItems: 'center', borderRadius: 14 }, mSubmitT: { color: '#fff', fontSize: 16, fontWeight: '700' },
    uploadContainer: { borderRadius: 18, height: 130, borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginBottom: 20 },
    uploadContainerActive: { borderColor: '#4ECDC4', backgroundColor: 'rgba(78,205,196,0.05)' },
    uploadBtnInner: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
    uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 8 },
    uploadBtnSub: { color: '#8E8E93', fontSize: 12, marginTop: 4 },
    uploadPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    uploadText: { color: '#FF8E53', fontSize: 14, fontWeight: '600' },
    previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    previewText: { color: '#4ECDC4', fontSize: 16, fontWeight: '800', marginTop: 8 },
    changeText: { color: '#8E8E93', fontSize: 13, marginTop: 4 },
    storeLogoPreview: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#000' },
    brandingUpload: { height: 80, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
    brandingFill: { width: '100%', height: '100%', resizeMode: 'cover' },
    brandingEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    brandingTxt: { color: '#8E8E93', fontSize: 11, marginTop: 4, fontWeight: '600' },
});

export default StoreOwnerDashboardScreen;
