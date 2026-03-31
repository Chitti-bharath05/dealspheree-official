import React, { useState, useMemo } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    Modal, TextInput, Alert, Image, ActivityIndicator, 
    Dimensions, Platform, useWindowDimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';

const StoreOffersScreen = ({ route, navigation }) => {
    const { storeId } = route.params;
    const { user } = useAuth();
    const { stores, offers, getOffersByStore, addOffer, updateOffer, deleteOffer, categories, isLoading } = useData();
    const { t } = useLanguage();
    const { width } = useWindowDimensions();

    const currentStore = useMemo(() => stores.find(s => (s._id || s.id) === storeId), [stores, storeId]);
    const storeOffers = useMemo(() => getOffersByStore(storeId) || [], [offers, storeId]);

    // Form States
    const [offerTitle, setOfferTitle] = useState('');
    const [offerDesc, setOfferDesc] = useState('');
    const [offerDiscount, setOfferDiscount] = useState('');
    const [offerOriginalPrice, setOfferOriginalPrice] = useState('');
    const [offerExpiry, setOfferExpiry] = useState('');
    const [offerImage, setOfferImage] = useState(null);
    const [showAddOffer, setShowAddOffer] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [isSavingOffer, setIsSavingOffer] = useState(false);

    const resetForm = () => {
        setOfferTitle(''); setOfferDesc(''); setOfferDiscount(''); setOfferOriginalPrice(''); setOfferExpiry('');
        setOfferImage(null); setEditingOffer(null);
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });
        if (!result.canceled) setOfferImage(result.assets[0].uri);
    };

    const handleSaveOffer = async () => {
        if (!offerTitle || !offerDiscount || !offerOriginalPrice || !offerExpiry) {
            return Alert.alert('Error', 'Missing required fields');
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
                title: offerTitle, 
                description: offerDesc, 
                discount: parseInt(offerDiscount), 
                originalPrice: parseInt(offerOriginalPrice),
                expiryDate: calculatedExpiry.toISOString(), 
                category: currentStore?.category || categories[0],
                storeId, 
                image: offerImage 
            };

            if (editingOffer) {
                await updateOffer(editingOffer._id || editingOffer.id, offerData);
            } else {
                await addOffer(offerData);
            }
            setShowAddOffer(false);
            resetForm();
        } catch (e) {
            Alert.alert('Error', 'Failed to save offer');
        } finally {
            setIsSavingOffer(false);
        }
    };

    const handleDeleteOffer = (id) => {
        const performDelete = () => deleteOffer(id);
        if (Platform.OS === 'web') {
            if (window.confirm('Delete this offer?')) performDelete();
        } else {
            Alert.alert('Delete Offer', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: performDelete }
            ]);
        }
    };

    if (!currentStore || isLoading) {
        return <View style={s.loading}><ActivityIndicator color="#F5C518" size="large" /></View>;
    }

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#F5C518" />
                </TouchableOpacity>
                <View>
                    <Text style={s.headerTitle}>{currentStore.storeName}</Text>
                    <Text style={s.headerSub}>{storeOffers.length} {storeOffers.length === 1 ? 'Offer' : 'Offers'} Active</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={s.scroll}>
                {storeOffers.length === 0 ? (
                    <View style={s.emptyContainer}>
                        <View style={s.emptyIconCircle}>
                            <Ionicons name="pricetag-outline" size={80} color="#333" />
                        </View>
                        <Text style={s.emptyTitle}>No Offers Yet</Text>
                        <Text style={s.emptyDesc}>Get started by launching your first exclusive deal for your customers store-wide.</Text>
                        <TouchableOpacity style={s.centerAddBtn} onPress={() => { resetForm(); setShowAddOffer(true); }}>
                            <Ionicons name="add" size={24} color="#000" />
                            <Text style={s.centerAddBtnTxt}>Launch First Offer</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={s.offerGrid}>
                        {storeOffers.map((item) => (
                            <View key={item._id || item.id} style={[s.offerCard, { width: width > 768 ? '48%' : '100%' }]}>
                                <Image source={{ uri: item.image || 'https://via.placeholder.com/600x300' }} style={s.offerImg} />
                                <View style={s.offerInfo}>
                                    <View style={s.offerHeader}>
                                        <Text style={s.offerTitle} numberOfLines={1}>{item.title}</Text>
                                        <View style={s.discountBadge}>
                                            <Text style={s.discountBadgeTxt}>{item.discount}% OFF</Text>
                                        </View>
                                    </View>
                                    <Text style={s.offerDesc} numberOfLines={2}>{item.description}</Text>
                                    <View style={s.offerFooter}>
                                        <View>
                                            <Text style={s.priceTxt}>₹{(item.originalPrice * (1 - item.discount/100)).toLocaleString()}</Text>
                                            <Text style={s.oldPriceTxt}>₹{item.originalPrice.toLocaleString()}</Text>
                                        </View>
                                        <View style={s.actionRow}>
                                            <TouchableOpacity 
                                                style={s.iconActionBtn} 
                                                onPress={() => {
                                                    setEditingOffer(item);
                                                    setOfferTitle(item.title);
                                                    setOfferDesc(item.description);
                                                    setOfferDiscount(item.discount.toString());
                                                    setOfferOriginalPrice(item.originalPrice.toString());
                                                    const ex = new Date(item.expiryDate);
                                                    setOfferExpiry(`${String(ex.getDate()).padStart(2, '0')}/${String(ex.getMonth()+1).padStart(2, '0')}/${ex.getFullYear()}`);
                                                    setOfferImage(item.image);
                                                    setShowAddOffer(true);
                                                }}
                                            >
                                                <Ionicons name="pencil" size={18} color="#F5C518" />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={s.iconActionBtn} onPress={() => handleDeleteOffer(item._id || item.id)}>
                                                <Ionicons name="trash" size={18} color="#FF3B30" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {storeOffers.length > 0 && (
                <View style={s.bottomAction}>
                    <TouchableOpacity style={s.floatAddBtn} onPress={() => { resetForm(); setShowAddOffer(true); }}>
                        <Ionicons name="add" size={24} color="#000" />
                        <Text style={s.floatAddBtnTxt}>Add New Offer</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Offer Modal */}
            <Modal visible={showAddOffer} animationType="slide" transparent>
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>{editingOffer ? 'Update' : 'Launch'} Offer</Text>
                            <TouchableOpacity onPress={() => setShowAddOffer(false)}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <TouchableOpacity style={s.imgPicker} onPress={handlePickImage}>
                                {offerImage ? (
                                    <Image source={{ uri: offerImage }} style={s.pickedImg} />
                                ) : (
                                    <View style={{ alignItems: 'center' }}>
                                        <Ionicons name="image-outline" size={40} color="#F5C518" />
                                        <Text style={s.imgPickerTxt}>Tap to upload photo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={s.inputGrp}>
                                <Text style={s.label}>Offer Title</Text>
                                <TextInput style={s.input} value={offerTitle} onChangeText={setOfferTitle} placeholder="e.g. 50% Off Everything" placeholderTextColor="#555" />
                            </View>

                            <View style={s.row}>
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
                                onPress={handleSaveOffer}
                                disabled={isSavingOffer}
                            >
                                {isSavingOffer ? <ActivityIndicator color="#000" /> : <Text style={s.submitBtnTxt}>{editingOffer ? 'Update' : 'Launch'} Offer</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: Platform.OS === 'web' ? 24 : 60, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    backBtn: { marginRight: 16 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
    headerSub: { color: '#8E8E93', fontSize: 13, fontWeight: '500' },
    scroll: { padding: 24, paddingBottom: 100 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
    emptyIconCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(245,197,24,0.03)', alignItems: 'center', justifyContent: 'center', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(245,197,24,0.1)' },
    emptyTitle: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 12 },
    emptyDesc: { color: '#8E8E93', fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 40, marginBottom: 32 },
    centerAddBtn: { backgroundColor: '#F5C518', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 18, borderRadius: 20, gap: 10 },
    centerAddBtnTxt: { color: '#000', fontSize: 16, fontWeight: '900' },
    offerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    offerCard: { backgroundColor: '#111', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    offerImg: { width: '100%', height: 180, resizeMode: 'cover' },
    offerInfo: { padding: 16 },
    offerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    offerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', flex: 1, marginRight: 10 },
    discountBadge: { backgroundColor: '#F5C518', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    discountBadgeTxt: { color: '#000', fontSize: 11, fontWeight: '900' },
    offerDesc: { color: '#8E8E93', fontSize: 14, lineHeight: 20, marginBottom: 16 },
    offerFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    priceTxt: { color: '#F5C518', fontSize: 22, fontWeight: '900' },
    oldPriceTxt: { color: '#555', fontSize: 12, textDecorationLine: 'line-through' },
    actionRow: { flexDirection: 'row', gap: 12 },
    iconActionBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' },
    bottomAction: { position: 'absolute', bottom: 32, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 24 },
    floatAddBtn: { backgroundColor: '#F5C518', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 18, borderRadius: 25, gap: 10, shadowColor: '#F5C518', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
    floatAddBtnTxt: { color: '#000', fontSize: 16, fontWeight: '900' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#111', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
    imgPicker: { width: '100%', height: 200, backgroundColor: '#1A1A1A', borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(245,197,24,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, overflow: 'hidden' },
    pickedImg: { width: '100%', height: '100%' },
    imgPickerTxt: { color: '#555', fontSize: 14, fontWeight: '600', marginTop: 10 },
    inputGrp: { marginBottom: 20 },
    label: { color: '#F5C518', fontSize: 12, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: '#1A1A1A', borderRadius: 12, height: 55, paddingHorizontal: 16, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    row: { flexDirection: 'row', gap: 12 },
    submitBtn: { backgroundColor: '#F5C518', height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 40 },
    submitBtnTxt: { color: '#000', fontSize: 18, fontWeight: '950' },
});

export default StoreOffersScreen;
