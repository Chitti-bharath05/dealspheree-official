import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const AdminDashboardScreen = () => {
    const { user, users, deleteUser, logout, isLoading: authLoading } = useAuth();
    const { stores, offers, getPendingStores, approveStore, rejectStore, deleteOffer, getAdminStats, isLoading: dataLoading } = useData();
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
                <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
                <Text style={{ color: '#fff', fontSize: 18 }}>Loading Admin Panel...</Text>
            </View>
        );
    }

    const pendingStores = getPendingStores() || [];

    const handleApprove = (id) => { approveStore(id); Alert.alert('Approved', 'Store has been approved'); };
    const handleReject = (id) => {
        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to reject this store?')) {
                rejectStore(id);
                Alert.alert('Rejected', 'Store removed');
            }
        } else {
            Alert.alert('Reject?', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Reject', style: 'destructive', onPress: () => { rejectStore(id); Alert.alert('Rejected', 'Store removed'); } }]);
        }
    };
    const handleDeleteUser = (id) => {
        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete this user? This cannot be undone.')) {
                deleteUser(id);
            }
        } else {
            Alert.alert('Delete User?', 'This cannot be undone', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteUser(id) }]);
        }
    };
    const handleDeleteOffer = (id) => {
        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to remove this offer?')) {
                deleteOffer(id);
            }
        } else {
            Alert.alert('Remove Offer?', 'This will remove the offer', [{ text: 'Cancel' }, { text: 'Remove', style: 'destructive', onPress: () => deleteOffer(id) }]);
        }
    };

    const getRoleBadge = (role) => {
        const map = { customer: { color: '#4ECDC4', label: 'Customer' }, store_owner: { color: '#FF8E53', label: 'Store Owner' }, admin: { color: '#A18CD1', label: 'Admin' } };
        return map[role] || { color: '#8E8E93', label: role };
    };

    return (
        <View style={s.container}>
            <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={s.gradient}>
                <View style={s.header}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={s.headerTitle}>Admin Panel</Text>
                            <Text style={s.headerSub}>Manage your platform</Text>
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
                {/* Stats */}
                <View style={s.statsRow}>
                    {[
                        { v: adminStats?.totalUsers || (users || []).length, l: 'Users', c: '#4ECDC4' },
                        { v: adminStats?.totalStores || (stores || []).length, l: 'Stores', c: '#FF8E53' },
                        { v: `₹${(adminStats?.platformRevenue || 0).toLocaleString()}`, l: 'Revenue', c: '#FF6B6B' },
                        { v: adminStats?.activeUsersCount || 0, l: 'Active (24h)', c: '#A18CD1' }
                    ].map((st, i) => (
                        <View key={i} style={s.statCard}>
                            <Text style={[s.statVal, { color: st.c }]}>{st.v}</Text>
                            <Text style={s.statLbl}>{st.l}</Text>
                        </View>
                    ))}
                </View>
                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabContent}>
                    {[{ k: 'approvals', l: 'Approvals', ic: 'checkmark-circle-outline' }, { k: 'users', l: 'Users', ic: 'people-outline' }, { k: 'offers', l: 'Offers', ic: 'pricetags-outline' }].map(t => (
                        <TouchableOpacity key={t.k} style={[s.tab, activeTab === t.k && s.tabAct]} onPress={() => setActiveTab(t.k)}>
                            <Ionicons name={t.ic} size={16} color={activeTab === t.k ? '#fff' : '#8E8E93'} />
                            <Text style={[s.tabTxt, activeTab === t.k && s.tabTxtAct]}>{t.l}</Text>
                            {t.k === 'approvals' && pendingStores.length > 0 && <View style={s.badge}><Text style={s.badgeTxt}>{pendingStores.length}</Text></View>}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {activeTab === 'approvals' && (
                    <FlatList data={pendingStores} keyExtractor={i => i._id || i.id} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View style={s.card}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <View style={s.storeIc}><Ionicons name="storefront" size={20} color="#FF8E53" /></View>
                                    <View style={{ flex: 1 }}><Text style={s.cardTitle}>{item.storeName}</Text><Text style={s.cardSub}>{item.location}</Text><Text style={s.cardSub}>Category: {item.category}</Text></View>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity style={{ flex: 1 }} onPress={() => handleApprove(item._id || item.id)}>
                                        <LinearGradient colors={['#4ECDC4', '#44B39D']} style={s.actionBtn}><Ionicons name="checkmark" size={18} color="#fff" /><Text style={s.actionTxt}>Approve</Text></LinearGradient>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ flex: 1 }} onPress={() => handleReject(item._id || item.id)}>
                                        <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={s.actionBtn}><Ionicons name="close" size={18} color="#fff" /><Text style={s.actionTxt}>Reject</Text></LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={<View style={s.empty}><Ionicons name="checkmark-done-circle-outline" size={48} color="#4ECDC4" /><Text style={s.emptyTxt}>No pending approvals</Text></View>}
                    />
                )}
                {activeTab === 'users' && (
                    <FlatList data={users} keyExtractor={i => i._id || i.id} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => {
                            const rb = getRoleBadge(item.role);
                            return (
                                <View style={s.card}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                            <View style={s.avatarBg}><Ionicons name="person" size={20} color="#A18CD1" /></View>
                                            <View style={{ flex: 1 }}><Text style={s.cardTitle}>{item.name}</Text><Text style={s.cardSub}>{item.email}</Text></View>
                                        </View>
                                        <View style={{ alignItems: 'flex-end', gap: 8 }}>
                                            <View style={[s.roleBadge, { backgroundColor: `${rb.color}20` }]}><Text style={{ color: rb.color, fontSize: 11, fontWeight: '700' }}>{rb.label}</Text></View>
                                            {item.role !== 'admin' && <TouchableOpacity onPress={() => handleDeleteUser(item._id || item.id)}><Ionicons name="trash-outline" size={18} color="#FF6B6B" /></TouchableOpacity>}
                                        </View>
                                    </View>
                                </View>
                            );
                        }}
                    />
                )}
                {activeTab === 'offers' && (
                    <FlatList data={offers} keyExtractor={i => i._id || i.id} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View style={s.card}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                                        <Text style={s.cardSub}>{item.category} • {item.discount}% off</Text>
                                    </View>
                                    <TouchableOpacity style={s.delBtn} onPress={() => handleDeleteOffer(item._id || item.id)}>
                                        <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
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
    container: { flex: 1 }, gradient: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
    headerTitle: { color: '#fff', fontSize: 26, fontWeight: '800' }, headerSub: { color: '#A0A0B0', fontSize: 14, marginTop: 2 },
    headerLogout: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,107,107,0.15)', alignItems: 'center', justifyContent: 'center' },
    statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginTop: 12 },
    statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    statVal: { fontSize: 22, fontWeight: '900' }, statLbl: { color: '#8E8E93', fontSize: 11, marginTop: 2 },
    tabScroll: { marginTop: 20, maxHeight: 44 }, tabContent: { paddingHorizontal: 20, gap: 8 },
    tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    tabAct: { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' }, tabTxt: { color: '#8E8E93', fontSize: 13, fontWeight: '600' }, tabTxtAct: { color: '#fff' },
    badge: { backgroundColor: '#FF6B6B', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    badgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
    list: { padding: 20, paddingBottom: 100 },
    card: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' }, cardSub: { color: '#A0A0B0', fontSize: 12, marginTop: 2 },
    storeIc: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,142,83,0.15)', alignItems: 'center', justifyContent: 'center' },
    avatarBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(161,140,209,0.15)', alignItems: 'center', justifyContent: 'center' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
    actionTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
    roleBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
    delBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,107,107,0.15)', alignItems: 'center', justifyContent: 'center' },
    empty: { alignItems: 'center', paddingTop: 40 }, emptyTxt: { color: '#8E8E93', fontSize: 16, marginTop: 12 },
});

export default AdminDashboardScreen;
