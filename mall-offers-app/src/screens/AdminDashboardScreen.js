import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';

const AdminDashboardScreen = () => {
    const { user, users, deleteUser, logout, isLoading: authLoading } = useAuth();
    const { stores, offers, getPendingStores, approveStore, rejectStore, deleteOffer, getAdminStats, isLoading: dataLoading } = useData();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('approvals');
    const [adminStats, setAdminStats] = useState(null);

    React.useEffect(() => {
        if (getAdminStats) {
            getAdminStats().then(setAdminStats).catch(console.error);
        }
    }, [getAdminStats]);

    const isLoading = authLoading || dataLoading;

    if (isLoading || !user) {
        return (
            <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LinearGradient colors={['#1a150d', '#000']} style={StyleSheet.absoluteFill} />
                <ActivityIndicator color="#D4AF37" size="large" />
            </View>
        );
    }

    const pendingStores = getPendingStores() || [];

    const handleApprove = (id) => { approveStore(id); Alert.alert('Approved', 'Store has been approved'); };
    const handleReject = (id) => {
        const confirmMsg = t('delete_confirm');
        if (Platform.OS === 'web') {
            if (window.confirm(confirmMsg)) {
                rejectStore(id);
            }
        } else {
            Alert.alert(t('reject'), confirmMsg, [{ text: t('cancel') }, { text: t('reject'), style: 'destructive', onPress: () => rejectStore(id) }]);
        }
    };
    const handleDeleteUser = (id) => {
        const confirmMsg = t('delete_confirm');
        if (Platform.OS === 'web') {
            if (window.confirm(confirmMsg)) {
                deleteUser(id);
            }
        } else {
            Alert.alert(t('delete_acc'), confirmMsg, [{ text: t('cancel') }, { text: t('confirm'), style: 'destructive', onPress: () => deleteUser(id) }]);
        }
    };
    const handleDeleteOffer = (id) => {
        const confirmMsg = t('delete_confirm');
        if (Platform.OS === 'web') {
            if (window.confirm(confirmMsg)) {
                deleteOffer(id);
            }
        } else {
            Alert.alert(t('offers'), confirmMsg, [{ text: t('cancel') }, { text: t('confirm'), style: 'destructive', onPress: () => deleteOffer(id) }]);
        }
    };

    const getRoleBadge = (role) => {
        const map = { 
            customer: { color: '#4ECDC4', label: 'Customer' }, 
            store_owner: { color: '#D4AF37', label: 'Store Owner' }, 
            admin: { color: '#A18CD1', label: 'Admin' } 
        };
        return map[role] || { color: '#8E8E93', label: role };
    };

    return (
        <View style={s.container}>
            <LinearGradient colors={['#1a150d', '#000']} style={s.gradient}>
                <View style={s.header}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={s.headerTitle}>{t('admin_panel')}</Text>
                            <Text style={s.headerSub}>{t('manage_platform')}</Text>
                        </View>
                        <TouchableOpacity
                            style={s.headerLogout}
                            onPress={() => {
                                const doLogout = () => logout();
                                if (Platform.OS === 'web') {
                                    if (window.confirm(t('sign_out') + '?')) doLogout();
                                } else {
                                    Alert.alert(t('sign_out'), t('delete_confirm'), [
                                        { text: t('cancel'), style: 'cancel' },
                                        { text: t('confirm'), style: 'destructive', onPress: doLogout }
                                    ]);
                                }
                            }}
                        >
                            <Ionicons name="log-out-outline" size={24} color="#D4AF37" />
                        </TouchableOpacity>
                    </View>
                </View>
                
                {/* Stats Grid */}
                <View style={s.statsRow}>
                    <View style={s.statCard}>
                        <Text style={[s.statVal, { color: '#D4AF37' }]}>{adminStats?.totalUsers || (users || []).length}</Text>
                        <Text style={s.statLbl}>{t('users')}</Text>
                    </View>
                    <View style={s.statCard}>
                        <Text style={[s.statVal, { color: '#D4AF37' }]}>{adminStats?.totalStores || (stores || []).length}</Text>
                        <Text style={s.statLbl}>{t('my_stores')}</Text>
                    </View>
                    <View style={s.statCard}>
                        <Text style={[s.statVal, { color: '#D4AF37' }]}>₹{(adminStats?.platformRevenue || 0).toLocaleString()}</Text>
                        <Text style={s.statLbl}>{t('revenue')}</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={s.tabWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabContent}>
                        {[
                            { k: 'approvals', l: t('approvals'), ic: 'checkmark-circle-outline' }, 
                            { k: 'users', l: t('users'), ic: 'people-outline' }, 
                            { k: 'offers', l: t('offers'), ic: 'pricetags-outline' }
                        ].map(tab => (
                            <TouchableOpacity 
                                key={tab.k} 
                                style={[s.tab, activeTab === tab.k && s.tabAct]} 
                                onPress={() => setActiveTab(tab.k)}
                            >
                                <Ionicons name={tab.ic} size={18} color={activeTab === tab.k ? '#000' : '#D4AF37'} />
                                <Text style={[s.tabTxt, activeTab === tab.k && s.tabTxtAct]}>{tab.l}</Text>
                                {tab.k === 'approvals' && pendingStores.length > 0 && (
                                    <View style={s.badge}><Text style={s.badgeTxt}>{pendingStores.length}</Text></View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {activeTab === 'approvals' && (
                    <FlatList 
                        data={pendingStores} 
                        keyExtractor={i => i._id || i.id} 
                        contentContainerStyle={s.list} 
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View style={s.card}>
                                <View style={s.cardHeader}>
                                    <View style={s.storeIc}><Ionicons name="storefront" size={24} color="#D4AF37" /></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.cardTitle}>{item.storeName}</Text>
                                        <Text style={s.cardSub}>{item.location}</Text>
                                    </View>
                                </View>
                                <View style={s.actionRow}>
                                    <TouchableOpacity style={s.approveBtn} onPress={() => handleApprove(item._id || item.id)}>
                                        <Text style={s.approveBtnTxt}>{t('approve')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.rejectBtn} onPress={() => handleReject(item._id || item.id)}>
                                        <Text style={s.rejectBtnTxt}>{t('reject')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={s.empty}>
                                <Ionicons name="checkmark-done-circle-outline" size={60} color="#333" />
                                <Text style={s.emptyTxt}>{t('no_pending')}</Text>
                            </View>
                        }
                    />
                )}

                {activeTab === 'users' && (
                    <FlatList 
                        data={users} 
                        keyExtractor={i => i._id || i.id} 
                        contentContainerStyle={s.list} 
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => {
                            const rb = getRoleBadge(item.role);
                            return (
                                <View style={s.card}>
                                    <View style={s.cardContent}>
                                        <View style={s.avatarBg}><Ionicons name="person" size={20} color="#D4AF37" /></View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.cardTitle}>{item.name}</Text>
                                            <Text style={s.cardSub}>{item.email}</Text>
                                        </View>
                                        <View style={[s.roleBadge, { backgroundColor: 'rgba(212,175,55,0.1)' }]}>
                                            <Text style={s.roleText}>{rb.label}</Text>
                                        </View>
                                    </View>
                                    {item.role !== 'admin' && (
                                        <TouchableOpacity 
                                            style={s.deleteUserBtn} 
                                            onPress={() => handleDeleteUser(item._id || item.id)}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        }}
                    />
                )}

                {activeTab === 'offers' && (
                    <FlatList 
                        data={offers} 
                        keyExtractor={i => i._id || i.id} 
                        contentContainerStyle={s.list} 
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View style={s.card}>
                                <View style={s.cardContent}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                                        <Text style={s.cardSub}>{item.category} • {item.discount}% OFF</Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={s.delBtn} 
                                        onPress={() => handleDeleteOffer(item._id || item.id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />
                )}
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
    headerLogout: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)' },
    statVal: { fontSize: 20, fontWeight: '900', color: '#D4AF37' },
    statLbl: { color: '#8E8E93', fontSize: 12, marginTop: 4, fontWeight: '600' },
    tabWrapper: { marginBottom: 10 },
    tabContent: { paddingHorizontal: 24, gap: 12 },
    tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', gap: 8, borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)' },
    tabAct: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
    tabTxt: { color: '#8E8E93', fontSize: 14, fontWeight: '700' },
    tabTxtAct: { color: '#000' },
    badge: { backgroundColor: '#FF6B6B', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, position: 'absolute', top: -5, right: -5 },
    badgeTxt: { color: '#fff', fontSize: 10, fontWeight: '900' },
    list: { padding: 24, paddingBottom: 100 },
    card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
    cardContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    cardTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
    cardSub: { color: '#8E8E93', fontSize: 13, marginTop: 4 },
    storeIc: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center' },
    avatarBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center' },
    actionRow: { flexDirection: 'row', gap: 12 },
    approveBtn: { flex: 1, backgroundColor: '#D4AF37', paddingVertical: 14, borderRadius: 15, alignItems: 'center' },
    approveBtnTxt: { color: '#000', fontSize: 14, fontWeight: '800' },
    rejectBtn: { flex: 1, backgroundColor: 'rgba(255,107,107,0.1)', paddingVertical: 14, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,107,107,0.2)' },
    rejectBtnTxt: { color: '#FF6B6B', fontSize: 14, fontWeight: '800' },
    roleBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
    roleText: { color: '#D4AF37', fontSize: 11, fontWeight: '800' },
    deleteUserBtn: { position: 'absolute', top: 20, right: 20 },
    delBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,107,107,0.1)', alignItems: 'center', justifyContent: 'center' },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyTxt: { color: '#333', fontSize: 18, fontWeight: '700', marginTop: 15 },
});

export default AdminDashboardScreen;
