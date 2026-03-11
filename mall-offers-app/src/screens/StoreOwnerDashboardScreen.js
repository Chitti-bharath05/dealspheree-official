import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, Modal, Platform, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';

const StoreOwnerDashboardScreen = () => {
    const { user, logout } = useAuth();
    const { stores, offers, getStoresByOwner, getOffersByStore, addOffer, updateOffer, updateStore, deleteOffer, registerStore, categories, isLoading } = useData();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('stores');
    
    // State management for refactored forms
    const [storeName, setStoreName] = useState('');
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState(categories[0] || 'Fashion');
    const [offerTitle, setOfferTitle] = useState('');
    const [offerDesc, setOfferDesc] = useState('');
    const [offerDiscount, setOfferDiscount] = useState('');
    const [offerOriginalPrice, setOfferOriginalPrice] = useState('');
    const [offerExpiry, setOfferExpiry] = useState('');
    const [selectedStoreId, setSelectedStoreId] = useState('');
    const [offerImage, setOfferImage] = useState(null);
    const [showAddOffer, setShowAddOffer] = useState(false);
    const [showAddStore, setShowAddStore] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [editingStore, setEditingStore] = useState(null);

    const myStores = useMemo(() => getStoresByOwner(user?._id || user?.id) || [], [stores, user]);
    const myOffers = useMemo(() => {
        return myStores.flatMap(store => {
            const storeId = store._id || store.id;
            return (getOffersByStore(storeId) || []).map(o => ({ ...o, storeName: store.storeName }));
        });
    }, [offers, myStores]);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });
        if (!result.canceled) setOfferImage(result.assets[0].uri);
    };

    const resetForms = () => {
        setStoreName(''); setLocation(''); setCategory(categories[0] || 'Fashion');
        setOfferTitle(''); setOfferDesc(''); setOfferDiscount(''); setOfferOriginalPrice(''); setOfferExpiry('');
        setOfferImage(null); setEditingOffer(null); setEditingStore(null);
    };

    const handleSaveStore = async () => {
        if (!storeName || !location) return Alert.alert('Error', 'Missing required fields');
        const storeData = { storeName, location, category, ownerId: user.id || user._id };
        try {
            if (editingStore) {
                await updateStore(editingStore._id || editingStore.id, storeData);
            } else {
                await registerStore(storeData);
            }
            setShowAddStore(false);
            resetForms();
        } catch (e) { Alert.alert('Error', 'Failed to save store'); }
    };

    const handleSaveOffer = async () => {
        if (!offerTitle || !offerDiscount || !offerOriginalPrice || !selectedStoreId || !offerExpiry) {
            return Alert.alert('Error', 'Missing required fields');
        }
        
        const selectedStore = myStores.find(s => (s._id || s.id) === selectedStoreId);
        const offerCategory = selectedStore ? selectedStore.category : (categories[0] || 'Fashion');
        
        const calculatedExpiry = new Date();
        calculatedExpiry.setDate(calculatedExpiry.getDate() + parseInt(offerExpiry));
        
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
        try {
            if (editingOffer) {
                await updateOffer(editingOffer._id || editingOffer.id, offerData);
            } else {
                await addOffer(offerData);
            }
            setShowAddOffer(false);
            resetForms();
        } catch (e) { Alert.alert('Error', 'Failed to save offer'); }
    };

    if (isLoading || !user) {
        return (
            <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LinearGradient colors={['#1a150d', '#000']} style={StyleSheet.absoluteFill} />
                <ActivityIndicator color="#D4AF37" size="large" />
            </View>
        );
    }

    return (
        <View style={s.container}>
            <LinearGradient colors={['#1a150d', '#000']} style={s.gradient}>
                <View style={s.header}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={s.headerTitle}>{t('store_dash')}</Text>
                            <Text style={s.headerSub}>{t('manage_stores_offers')}</Text>
                        </View>
                        <TouchableOpacity style={s.headerLogout} onPress={logout}>
                            <Ionicons name="log-out-outline" size={24} color="#D4AF37" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tabs */}
                <View style={s.tabRow}>
                    <TouchableOpacity onPress={() => setActiveTab('stores')} style={[s.tab, activeTab === 'stores' && s.tabAct]}>
                        <Ionicons name="storefront-outline" size={18} color={activeTab === 'stores' ? '#000' : '#D4AF37'} />
                        <Text style={[s.tabTxt, activeTab === 'stores' && s.tabTxtAct]}>{t('my_stores')}</Text>
                        <View style={s.badge}><Text style={s.badgeTxt}>{myStores.length}</Text></View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('offers')} style={[s.tab, activeTab === 'offers' && s.tabAct]}>
                        <Ionicons name="pricetags-outline" size={18} color={activeTab === 'offers' ? '#000' : '#D4AF37'} />
                        <Text style={[s.tabTxt, activeTab === 'offers' && s.tabTxtAct]}>{t('offers')}</Text>
                        <View style={s.badge}><Text style={s.badgeTxt}>{myOffers.length}</Text></View>
                    </TouchableOpacity>
                </View>

                {activeTab === 'stores' ? (
                    <FlatList
                        data={myStores}
                        keyExtractor={i => i._id || i.id}
                        contentContainerStyle={s.list}
                        renderItem={({ item }) => (
                            <View style={s.card}>
                                <View style={s.cardHeader}>
                                    <View style={s.storeIc}><Ionicons name="business" size={24} color="#D4AF37" /></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.cardTitle}>{item.storeName}</Text>
                                        <Text style={s.cardSub}>{item.location} • {item.category}</Text>
                                    </View>
                                    <View style={[s.statusBadge, { backgroundColor: item.approved ? 'rgba(78,205,196,0.1)' : 'rgba(212,175,55,0.1)' }]}>
                                        <Text style={[s.statusTxt, { color: item.approved ? '#4ECDC4' : '#D4AF37' }]}>{item.approved ? 'Approved' : 'Pending'}</Text>
                                    </View>
                                </View>
                                <View style={s.actionRow}>
                                    <TouchableOpacity style={s.editBtn} onPress={() => {
                                        setEditingStore(item); setStoreName(item.storeName); setLocation(item.location); setCategory(item.category); setShowAddStore(true);
                                    }}>
                                        <Ionicons name="create-outline" size={18} color="#D4AF37" /><Text style={s.editBtnTxt}>{t('edit')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.delBtn} onPress={() => Alert.alert('Delete Store', 'This feature is coming soon')}>
                                        <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={<View style={s.empty}><Ionicons name="storefront-outline" size={60} color="#333" /><Text style={s.emptyTxt}>No stores yet</Text></View>}
                    />
                ) : (
                    <FlatList
                        data={myOffers}
                        keyExtractor={i => i._id || i.id}
                        contentContainerStyle={s.list}
                        renderItem={({ item }) => (
                            <View style={s.card}>
                                <View style={s.cardHeader}>
                                    <View style={s.storeIc}><Ionicons name="pricetag" size={24} color="#D4AF37" /></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                                        <Text style={s.cardSub}>{item.discount}% OFF • {item.storeName}</Text>
                                    </View>
                                </View>
                                <View style={s.actionRow}>
                                    <TouchableOpacity style={s.editBtn} onPress={() => {
                                        setEditingOffer(item); setOfferTitle(item.title); setOfferDesc(item.description); setOfferDiscount(item.discount.toString()); setOfferOriginalPrice((item.originalPrice || 0).toString()); 
                                        
                                        // Approximate days from now to expiry for the form
                                        const daysLeft = item.expiryDate ? Math.max(1, Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))) : 7;
                                        setOfferExpiry(daysLeft.toString()); 
                                        setSelectedStoreId(item.storeId); setOfferImage(item.image); setShowAddOffer(true);
                                    }}>
                                        <Ionicons name="create-outline" size={18} color="#D4AF37" /><Text style={s.editBtnTxt}>{t('edit_offer')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.delBtn} onPress={() => deleteOffer(item._id || item.id)}>
                                        <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={<View style={s.empty}><Ionicons name="gift-outline" size={60} color="#333" /><Text style={s.emptyTxt}>No active offers</Text></View>}
                    />
                )}

                {/* FAB */}
                <TouchableOpacity style={s.fab} onPress={() => activeTab === 'stores' ? setShowAddStore(true) : setShowAddOffer(true)}>
                    <Ionicons name="add" size={32} color="#000" />
                </TouchableOpacity>

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
                                <View style={s.inputGrp}>
                                    <Text style={s.label}>Store Name</Text>
                                    <TextInput style={s.input} value={storeName} onChangeText={setStoreName} placeholder="e.g. Gucci Boutique" placeholderTextColor="#555" />
                                </View>
                                <View style={s.inputGrp}>
                                    <Text style={s.label}>Location</Text>
                                    <TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="e.g. Ground Floor, Block A" placeholderTextColor="#555" />
                                </View>
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
                                <TouchableOpacity style={s.submitBtn} onPress={handleSaveStore}>
                                    <Text style={s.submitBtnTxt}>{editingStore ? 'Update Store' : 'Add Store'}</Text>
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
                                <TouchableOpacity style={s.imgPicker} onPress={handlePickImage}>
                                    {offerImage ? <Image source={{ uri: offerImage }} style={s.pickedImg} /> : (
                                        <View style={{ alignItems: 'center' }}>
                                            <Ionicons name="image-outline" size={40} color="#D4AF37" />
                                            <Text style={s.imgPickerTxt}>Upload Offer Image</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

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
                                    <View style={[s.inputGrp, { flex: 1.2 }]}>
                                        <Text style={s.label}>Expires (Days)</Text>
                                        <TextInput style={s.input} value={offerExpiry} onChangeText={setOfferExpiry} keyboardType="numeric" placeholder="e.g. 7" placeholderTextColor="#555" />
                                    </View>
                                </View>

                                <View style={s.inputGrp}>
                                    <Text style={s.label}>Description</Text>
                                    <TextInput style={[s.input, { height: 100, textAlignVertical: 'top', paddingTop: 15 }]} value={offerDesc} onChangeText={setOfferDesc} multiline placeholder="Tell customers about this exclusive offer..." placeholderTextColor="#555" />
                                </View>

                                <TouchableOpacity style={s.submitBtn} onPress={handleSaveOffer}>
                                    <Text style={s.submitBtnTxt}>{editingOffer ? 'Update Offer' : 'Launch Offer'}</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </LinearGradient>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
    headerSub: { color: '#D4AF37', fontSize: 14, marginTop: 4, fontWeight: '600' },
    headerLogout: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center' },
    tabRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 20 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)' },
    tabAct: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
    tabTxt: { color: '#8E8E93', fontSize: 13, fontWeight: '700' },
    tabTxtAct: { color: '#000' },
    badge: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, minWidth: 20, paddingHorizontal: 6, height: 20, alignItems: 'center', justifyContent: 'center' },
    badgeTxt: { color: '#D4AF37', fontSize: 11, fontWeight: '800' },
    list: { paddingHorizontal: 24, paddingBottom: 100 },
    card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
    cardTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
    cardSub: { color: '#8E8E93', fontSize: 13, marginTop: 4 },
    storeIc: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusTxt: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    actionRow: { flexDirection: 'row', gap: 12 },
    editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(212,175,55,0.05)', paddingVertical: 12, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
    editBtnTxt: { color: '#D4AF37', fontSize: 14, fontWeight: '700' },
    delBtn: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,107,107,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,107,107,0.2)' },
    fab: { position: 'absolute', right: 24, bottom: 40, width: 64, height: 64, borderRadius: 32, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#111', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    modalTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
    inputGrp: { marginBottom: 20 },
    label: { color: '#D4AF37', fontSize: 14, fontWeight: '700', marginBottom: 10 },
    input: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, paddingHorizontal: 20, height: 56, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    catChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10, borderWidth: 1, borderColor: 'transparent' },
    catChipAct: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
    catChipTxt: { color: '#8E8E93', fontWeight: '700' },
    catChipTxtAct: { color: '#000' },
    imgPicker: { width: '100%', height: 180, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.04)', borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(212,175,55,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden' },
    pickedImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    imgPickerTxt: { color: '#555', marginTop: 10, fontWeight: '600' },
    submitBtn: { backgroundColor: '#D4AF37', height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 40 },
    submitBtnTxt: { color: '#000', fontSize: 18, fontWeight: '800' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyTxt: { color: '#333', fontSize: 18, fontWeight: '700', marginTop: 15 },
});

export default StoreOwnerDashboardScreen;
