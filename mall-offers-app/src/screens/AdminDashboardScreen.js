import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, ActivityIndicator, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';

const AdminDashboardScreen = () => {
    const { user, users, deleteUser, logout, fetchUsers, isLoading: authLoading } = useAuth();
    const { stores, offers, getPendingStores, approveStore, rejectStore, deleteOffer, getAdminStats, verifyStoreProof, isLoading: dataLoading } = useData();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('overview');
    const [adminStats, setAdminStats] = useState(null);
    const [systemAlerts, setSystemAlerts] = useState([]);
    
    // 🛡️ AI Verification State
    const [scanResults, setScanResults] = useState({});
    const [scanningId, setScanningId] = useState(null);

    const handleRunScan = async (storeId) => {
        setScanningId(storeId);
        try {
            const res = await verifyStoreProof(storeId);
            if (res.success) {
                setScanResults(prev => ({ ...prev, [storeId]: res.analysis }));
            }
        } catch (e) {
            console.error('Scan error:', e);
            Alert.alert('Scan Failed', 'The AI Verifier engine is currently under maintenance or offline.');
        } finally {
            setScanningId(null);
        }
    };

    React.useEffect(() => {
        if (user && user.role === 'admin') {
            if (getAdminStats) {
                getAdminStats().then(setAdminStats).catch(console.error);
            }
            if (fetchUsers) fetchUsers();
            
            // Fetch real system alerts
            apiClient.get('/admin/alerts')
                .then(res => { if (res.success) setSystemAlerts(res.logs); })
                .catch(console.error);
        }
    }, [getAdminStats, fetchUsers, user]);

    const isLoading = authLoading || dataLoading;

    if (isLoading || !user) {
        return (
            <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color="#F5C518" size="large" />
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

    const StatCard = ({ label, value, icon, badge, badgeColor }) => (
        <View style={s.statCard}>
            <View style={s.statHeader}>
                <Text style={s.statLabel}>{label}</Text>
                <Ionicons name={icon} size={18} color="#8E8E93" />
            </View>
            <Text style={s.statValue}>{value}</Text>
            <View style={[s.statBadge, { backgroundColor: badgeColor }]}>
                <Text style={s.statBadgeTxt}>{badge}</Text>
            </View>
        </View>
    );

    return (
        <View style={s.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                    {/* Global Header is provided by AppNavigator */}
                    <View style={{ height: Platform.OS === 'web' ? 70 : 0 }} />


                {/* Main Heading */}
                <View style={s.mainHeading}>
                    <Text style={s.mainHeadingTitle}>Platform <Text style={s.italicGold}>Overview.</Text></Text>
                </View>

                {/* Action Buttons */}
                <View style={s.actionRow}>
                    <TouchableOpacity 
                        style={[s.secondaryAction, activeTab === 'overview' && s.activeTabBtn]} 
                        onPress={() => setActiveTab('overview')}
                    >
                        <Ionicons name="stats-chart" size={20} color={activeTab === 'overview' ? "#000" : "#fff"} style={{ marginRight: 8 }} />
                        <Text style={[s.secondaryActionTxt, activeTab === 'overview' && s.activeTabTxt]}>Overview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[s.secondaryAction, activeTab === 'approvals' && s.activeTabBtn]} 
                        onPress={() => setActiveTab('approvals')}
                    >
                        <Ionicons name="storefront" size={20} color={activeTab === 'approvals' ? "#000" : "#fff"} style={{ marginRight: 8 }} />
                        <Text style={[s.secondaryActionTxt, activeTab === 'approvals' && s.activeTabTxt]}>Approvals</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[s.secondaryAction, activeTab === 'users' && s.activeTabBtn]} 
                        onPress={() => setActiveTab('users')}
                    >
                        <Ionicons name="people" size={20} color={activeTab === 'users' ? "#000" : "#fff"} style={{ marginRight: 8 }} />
                        <Text style={[s.secondaryActionTxt, activeTab === 'users' && s.activeTabTxt]}>Users</Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'overview' && (
                    <>
                        {/* Stats Grid */}
                        <View style={s.statsGrid}>
                            <StatCard 
                                label="TOTAL USERS" 
                                value={adminStats?.totalUsers || '0'} 
                                icon="people-outline" 
                                badge="+12%" 
                                badgeColor="rgba(76,175,80,0.15)" 
                            />
                            <StatCard 
                                label="TOTAL STORES" 
                                value={adminStats?.totalStores || '0'} 
                                icon="business-outline" 
                                badge="+5%" 
                                badgeColor="rgba(76,175,80,0.15)" 
                            />
                            <StatCard 
                                label="ACTIVE OFFERS" 
                                value={adminStats?.totalOffers || '0'} 
                                icon="pricetag-outline" 
                                badge="Live" 
                                badgeColor="rgba(76,175,80,0.15)" 
                            />
                            <StatCard 
                                label="PENDING REQUESTS" 
                                value={adminStats?.pendingStores || pendingStores.length.toString()} 
                                icon="alert-circle-outline" 
                                badge="Urgent" 
                                badgeColor="rgba(255,59,48,0.15)" 
                            />
                        </View>

                        {/* Analytics Section */}
                        <View style={s.section}>
                            <View style={s.sectionHeader}>
                                <View style={s.accentBar} />
                                <View>
                                    <Text style={s.sectionTitle}>New Store Registrations</Text>
                                    <Text style={s.sectionSub}>Activity over the last 7 days</Text>
                                </View>
                            </View>
                            
                            <View style={s.chartArea}>
                                {(adminStats?.chartData || [0,0,0,0,0,0,0]).map((item, i) => {
                                    // Calculate height (max is 100 for simplicity)
                                    const maxCount = Math.max(...(adminStats?.chartData?.map(d => d.count) || [1]));
                                    const height = maxCount > 0 ? (item.count / maxCount) * 100 : 2;
                                    return (
                                        <View key={i} style={s.chartCol}>
                                            <View style={[s.chartBar, { height: Math.max(height, 5) }, i === 6 && { backgroundColor: '#F5C518' }]} />
                                            <Text style={s.chartDay}>{item.day || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][i]}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Alerts Section */}
                        <View style={s.section}>
                            <View style={s.sectionHeader}>
                                <View style={s.accentBar} />
                                <Text style={s.sectionTitle}>System Alerts</Text>
                            </View>
                            
                            <View style={s.alertList}>
                                {systemAlerts.map((alert, i) => (
                                    <View key={alert._id || i} style={s.alertItem}>
                                        <View style={[s.alertDot, { backgroundColor: alert.color || '#F5C518' }]} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.alertTitle}>{alert.title}</Text>
                                            <Text style={s.alertSub}>{alert.message}</Text>
                                            <Text style={s.alertTime}>{new Date(alert.createdAt).toLocaleString()}</Text>
                                        </View>
                                    </View>
                                ))}
                                {systemAlerts.length === 0 && <Text style={s.emptyMsg}>No system alerts at this time.</Text>}
                            </View>
                        </View>
                    </>
                )}

                {activeTab === 'approvals' && (
                    <View style={s.listWrapper}>
                        <Text style={s.listHeader}>Pending Registrations ({pendingStores.length})</Text>
                        {pendingStores.map((item) => (
                            <View key={item._id || item.id} style={s.listItem}>
                                <View style={s.listInfo}>
                                    <Text style={s.listItemTitle}>{item.storeName}</Text>
                                    <Text style={s.listItemSub}>{item.location}</Text>
                                    <Text style={s.listItemSub}>Category: {item.category}</Text>
                                    
                                    {/* 🛡️ Ownership Proof Review */}
                                    {item.businessProofUrl && (
                                        <View style={s.proofContainer}>
                                            <Text style={s.proofLabel}>OWNERSHIP PROOF:</Text>
                                            <TouchableOpacity 
                                                style={s.proofImageWrapper}
                                                onPress={() => {
                                                    if (Platform.OS === 'web') window.open(item.businessProofUrl, '_blank');
                                                    else Alert.alert('Proof URL', item.businessProofUrl);
                                                }}
                                            >
                                                <Image source={{ uri: item.businessProofUrl }} style={s.proofImage} />
                                                <View style={s.viewOverlay}>
                                                    <Ionicons name="expand-outline" size={16} color="#fff" />
                                                    <Text style={s.viewTxt}>VIEW FULL</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {/* 🛡️ AI VERIFICATION SCAN RESULTS */}
                                    {scanResults[item._id || item.id] ? (
                                        <View style={s.scanResultContainer}>
                                            <View style={s.scanHeader}>
                                                <Ionicons name="shield-checkmark" size={16} color="#F5C518" />
                                                <Text style={s.scanTitle}>AI TRUST ANALYSIS</Text>
                                                <View style={[s.trustBadge, { backgroundColor: scanResults[item._id || item.id].trustScore > 70 ? 'rgba(76,175,80,0.15)' : 'rgba(255,59,48,0.15)' }]}>
                                                    <Text style={[s.trustBadgeTxt, { color: scanResults[item._id || item.id].trustScore > 70 ? '#4CAF50' : '#FF3B30' }]}>
                                                        {scanResults[item._id || item.id].trustScore}% TRUST
                                                    </Text>
                                                </View>
                                            </View>
                                            
                                            {scanResults[item._id || item.id].warnings.map((w, idx) => (
                                                <Text key={idx} style={s.scanWarning}>⚠️ {w}</Text>
                                            ))}
                                            
                                            <View style={s.checkGrid}>
                                                {scanResults[item._id || item.id].checks.map(c => (
                                                    <View key={c.id} style={s.checkItem}>
                                                        <Text style={s.checkLabel}>{c.label.toUpperCase()}</Text>
                                                        <View style={[s.statusDot, { backgroundColor: c.status === 'PASS' ? '#4CAF50' : c.status === 'WARN' ? '#F5C518' : '#FF3B30' }]} />
                                                        <Text style={[s.checkStatusTxt, { color: c.status === 'PASS' ? '#4CAF50' : c.status === 'WARN' ? '#F5C518' : '#FF3B30' }]}>
                                                            {c.status}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    ) : (
                                        <TouchableOpacity 
                                            style={s.scanBtn} 
                                            onPress={() => handleRunScan(item._id || item.id)}
                                            disabled={scanningId === (item._id || item.id)}
                                        >
                                            {scanningId === (item._id || item.id) ? (
                                                <ActivityIndicator size="small" color="#000" />
                                            ) : (
                                                <>
                                                    <Ionicons name="shield-outline" size={14} color="#000" />
                                                    <Text style={s.scanBtnTxt}>RUN AI VERIFICATION SCAN</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <View style={s.listActions}>
                                    <TouchableOpacity style={s.approveBtn} onPress={() => handleApprove(item._id || item.id)}>
                                        <Ionicons name="checkmark" size={18} color="#000" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.rejectBtn} onPress={() => handleReject(item._id || item.id)}>
                                        <Ionicons name="close" size={18} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                        {pendingStores.length === 0 && <Text style={s.emptyMsg}>No pending stores to approve.</Text>}
                    </View>
                )}

                {activeTab === 'users' && (
                    <View style={s.listWrapper}>
                        <Text style={s.listHeader}>Platform Users ({users.length})</Text>
                        {users.map((u) => (
                            <View key={u._id || u.id} style={s.listItem}>
                                <View style={s.listInfo}>
                                    <Text style={s.listItemTitle}>{u.name || 'Anonymous'}</Text>
                                    <Text style={s.listItemSub}>{u.email}</Text>
                                    <View style={s.roleBadge}>
                                        <Text style={s.roleText}>{u.role.toUpperCase()}</Text>
                                    </View>
                                </View>
                                <View style={s.listActions}>
                                    {u._id !== user.id && (
                                        <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteUser(u._id || u.id)}>
                                            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Bottom Promo */}
                <View style={s.promoCard}>
                    <Text style={s.promoTitle}>Optimize Platform <Text style={s.italicGold}>Performance.</Text></Text>
                    <Text style={s.promoDesc}>
                        The admin core now includes real-time telemetry and advanced fraud detection for all store offers. Ensure every deal published meets the Dealspheree quality benchmark.
                    </Text>
                    <View style={s.tagRow}>
                        <View style={s.promoTag}><Text style={s.promoTagTxt}>ENGINE V1.2</Text></View>
                        <View style={s.promoTag}><Text style={s.promoTagTxt}>LIVE TELEMETRY</Text></View>
                    </View>
                </View>
            </ScrollView>
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
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 6 },
    statusText: { color: '#4CAF50', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    adminAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    mainHeading: { paddingHorizontal: 24, marginBottom: 24 },
    mainHeadingTitle: { color: '#FFFFFF', fontSize: 32, fontWeight: '900' },
    italicGold: { color: '#F5C518', fontStyle: 'italic' },
    actionRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 32 },
    primaryAction: { flex: 1, height: 56, backgroundColor: '#F5C518', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    primaryActionTxt: { color: '#000', fontWeight: '900', fontSize: 14 },
    secondaryAction: { flex: 1, height: 56, backgroundColor: '#1A1A1A', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    secondaryActionTxt: { color: '#fff', fontWeight: '900', fontSize: 14 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 16, marginBottom: 32 },
    statCard: { width: (Dimensions ? Dimensions.get('window').width - 64 : 330) / 2, backgroundColor: '#1A1A1A', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    statHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    statLabel: { color: '#8E8E93', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    statValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginBottom: 8 },
    statBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statBadgeTxt: { color: '#8E8E93', fontSize: 10, fontWeight: '700' },
    section: { backgroundColor: '#1A1A1A', marginHorizontal: 24, borderRadius: 28, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    accentBar: { width: 4, height: 24, backgroundColor: '#F5C518', marginRight: 12, borderRadius: 2 },
    sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
    sectionSub: { color: '#555555', fontSize: 12, fontWeight: '400', marginTop: 2 },
    chartArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingTop: 20 },
    chartCol: { alignItems: 'center', gap: 12 },
    chartBar: { width: 12, backgroundColor: '#222', borderRadius: 6 },
    chartDay: { color: '#555555', fontSize: 9, fontWeight: '800' },
    chartLegend: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendTxt: { color: '#8E8E93', fontSize: 9, fontWeight: '800' },
    alertList: { gap: 20 },
    alertItem: { flexDirection: 'row', gap: 16 },
    alertDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
    alertTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    alertSub: { color: '#8E8E93', fontSize: 13, marginTop: 2 },
    alertTime: { color: '#555555', fontSize: 11, fontWeight: '600', marginTop: 4 },
    auditBtn: { marginTop: 24, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
    auditBtnTxt: { color: '#8E8E93', fontSize: 13, fontWeight: '700' },
    promoCard: { backgroundColor: '#0D0D0D', marginHorizontal: 24, borderRadius: 28, padding: 24, marginBottom: 40, borderWidth: 1, borderColor: 'rgba(255,197,24,0.1)' },
    promoTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginBottom: 12 },
    promoDesc: { color: '#8E8E93', fontSize: 14, lineHeight: 22, marginBottom: 20 },
    tagRow: { flexDirection: 'row', gap: 10 },
    promoTag: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10 },
    promoTagTxt: { color: '#555555', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    activeTabBtn: { backgroundColor: '#F5C518', borderColor: '#F5C518' },
    activeTabTxt: { color: '#000' },
    listWrapper: { paddingHorizontal: 24, marginBottom: 40 },
    listHeader: { color: '#F5C518', fontSize: 20, fontWeight: '900', marginBottom: 20 },
    listItem: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    listInfo: { flex: 1 },
    listItemTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    listItemSub: { color: '#8E8E93', fontSize: 13, marginTop: 2 },
    listActions: { flexDirection: 'row', gap: 10 },
    approveBtn: { width: 36, height: 36, backgroundColor: '#F5C518', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rejectBtn: { width: 36, height: 36, backgroundColor: '#FF3B30', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    deleteBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,59,48,0.2)' },
    roleBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(245,197,24,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 6 },
    roleText: { color: '#F5C518', fontSize: 10, fontWeight: '800' },
    emptyMsg: { color: '#555', fontSize: 16, textAlign: 'center', marginTop: 40 },
    proofContainer: { marginTop: 15, padding: 12, backgroundColor: 'rgba(245,197,24,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245,197,24,0.1)' },
    proofLabel: { color: '#F5C518', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    proofImageWrapper: { width: '100%', height: 120, borderRadius: 10, overflow: 'hidden', position: 'relative' },
    proofImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    viewOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
    viewTxt: { color: '#fff', fontSize: 10, fontWeight: '900' },
    
    // AI Scan Styles
    scanBtn: { 
        height: 36, 
        backgroundColor: '#F5C518', 
        borderRadius: 10, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8, 
        marginTop: 15,
        paddingHorizontal: 12
    },
    scanBtnTxt: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    scanResultContainer: { 
        marginTop: 15, 
        padding: 15, 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: 'rgba(255,255,255,0.08)' 
    },
    scanHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    scanTitle: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1, flex: 1 },
    trustBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    trustBadgeTxt: { fontSize: 10, fontWeight: '900' },
    scanWarning: { color: '#FF3B30', fontSize: 11, fontWeight: '700', lineHeight: 16, marginBottom: 8, backgroundColor: 'rgba(255,59,48,0.1)', padding: 8, borderRadius: 6 },
    checkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
    checkItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    checkLabel: { color: '#8E8E93', fontSize: 9, fontWeight: '800' },
    checkStatusTxt: { fontSize: 9, fontWeight: '900' }
});

export default AdminDashboardScreen;
