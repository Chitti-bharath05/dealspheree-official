import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { refetchOrders } = useData();

    const getRoleLabel = (role) => {
        const map = { customer: 'Customer', store_owner: 'Store Owner', admin: 'Administrator' };
        return map[role] || role;
    };

    const getRoleColor = (role) => {
        const map = { customer: '#4ECDC4', store_owner: '#FF8E53', admin: '#A18CD1' };
        return map[role] || '#8E8E93';
    };

    const menuItems = [
        { icon: 'receipt-outline', label: 'My Orders', color: '#FF6B6B', onPress: () => {
            refetchOrders();
            navigation.navigate('OrderHistory');
        }},
        { icon: 'person-outline', label: 'Edit Profile', color: '#4ECDC4' },
        { icon: 'notifications-outline', label: 'Notifications', color: '#FF8E53' },
        { icon: 'settings-outline', label: 'Settings', color: '#A18CD1' },
        { icon: 'help-circle-outline', label: 'Help & Support', color: '#667EEA' },
    ];

    return (
        <View style={s.container}>
            <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={s.gradient}>
                <View style={s.header}><Text style={s.headerTitle}>Profile</Text></View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    <View style={s.profileCard}>
                        <View style={s.avatarContainer}>
                            <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={s.avatar}>
                                <Text style={s.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
                            </LinearGradient>
                        </View>
                        <Text style={s.userName}>{user?.name}</Text>
                        <Text style={s.userEmail}>{user?.email}</Text>
                        <View style={[s.roleBadge, { backgroundColor: `${getRoleColor(user?.role)}20` }]}>
                            <Text style={[s.roleText, { color: getRoleColor(user?.role) }]}>{getRoleLabel(user?.role)}</Text>
                        </View>
                    </View>
                    <View style={s.menuSection}>
                        {menuItems.map((item, i) => (
                            <TouchableOpacity 
                                key={i} 
                                style={s.menuItem}
                                onPress={item.onPress}
                            >
                                <View style={[s.menuIcon, { backgroundColor: `${item.color}15` }]}>
                                    <Ionicons name={item.icon} size={20} color={item.color} />
                                </View>
                                <Text style={s.menuLabel}>{item.label}</Text>
                                <Ionicons name="chevron-forward" size={18} color="#4A4A5A" />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity
                        style={s.logoutBtn}
                        onPress={() => {
                            const doLogout = () => {
                                console.log('Executing logout...');
                                logout();
                            };

                            if (Platform.OS === 'web') {
                                // Direct logout if confirm is not available or handled
                                try {
                                    if (window.confirm('Sign out from Mall Offers?')) {
                                        doLogout();
                                    }
                                } catch (e) {
                                    console.log('Confirm failed, forcing logout');
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
                        <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
                        <Text style={s.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </ScrollView>
            </LinearGradient>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1 }, gradient: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
    headerTitle: { color: '#fff', fontSize: 26, fontWeight: '800' },
    profileCard: { alignItems: 'center', paddingVertical: 24, marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    avatarContainer: { marginBottom: 14 },
    avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
    userName: { color: '#fff', fontSize: 22, fontWeight: '700' },
    userEmail: { color: '#8E8E93', fontSize: 14, marginTop: 4 },
    roleBadge: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 6, marginTop: 12 },
    roleText: { fontSize: 13, fontWeight: '700' },
    menuSection: { marginHorizontal: 20, marginTop: 24 },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    menuLabel: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#FF6B6B' },
    logoutText: { color: '#FF6B6B', fontSize: 15, fontWeight: '700' },
});

export default ProfileScreen;
