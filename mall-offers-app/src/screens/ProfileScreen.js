import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, ScrollView, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';

import { useLanguage } from '../context/LanguageContext';
import NavigationControls from '../components/NavigationControls';

const ProfileScreen = ({ navigation }) => {
    const { user, logout, updateProfileImage } = useAuth();
    const { t } = useLanguage();

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            updateProfileImage(result.assets[0].uri);
        }
    };

    const menuItems = [
        { icon: 'receipt-outline', label: t('my_orders') || 'My Orders', badge: '0' },
        { icon: 'heart-outline', label: t('deals'), badge: '12', onPress: () => navigation.navigate('Deals') },
        { icon: 'notifications-outline', label: t('push_notif') },
        { 
            icon: 'settings-outline', 
            label: t('settings'), 
            onPress: () => navigation.navigate('Settings') 
        },
        { 
            icon: 'help-circle-outline', 
            label: t('support'), 
            onPress: () => navigation.navigate('HelpSupport') 
        },
    ];

    return (
        <View style={s.container}>
            <LinearGradient colors={['#1a150d', '#000']} style={s.gradient}>
                <View style={s.header}>
                    <View style={s.headerLeft}>
                        <Text style={s.headerTitle}>{t('profile')}</Text>
                        <NavigationControls />
                    </View>
                    <TouchableOpacity style={s.headerBtn} onPress={() => navigation.navigate('Settings')}>
                        <Ionicons name="settings-sharp" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                    <View style={s.profileCard}>
                        <View style={s.avatarWrapper}>
                            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                                <Image 
                                    style={s.avatar} 
                                    source={{ uri: user?.profileImage || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop' }} 
                                />
                                <View style={s.editIcon}>
                                    <Ionicons name="camera" size={16} color="#000" />
                                </View>
                            </TouchableOpacity>
                        </View>
                        <Text style={s.userName}>{user?.name}</Text>
                        <Text style={s.userEmail}>{user?.email}</Text>
                        
                        <View style={s.roleBadge}>
                            <Text style={s.roleTxt}>{user?.role?.toUpperCase() || 'MEMBER'}</Text>
                        </View>
                    </View>

                    <View style={s.menuSection}>
                        {menuItems.map((item, i) => (
                            <TouchableOpacity key={i} style={s.menuItem} onPress={item.onPress}>
                                <View style={s.menuLeft}>
                                    <View style={s.menuIconBox}>
                                        <Ionicons name={item.icon} size={20} color="#D4AF37" />
                                    </View>
                                    <Text style={s.menuLabel}>{item.label}</Text>
                                </View>
                                <View style={s.menuRight}>
                                    {item.badge && item.badge !== '0' && <View style={s.badge}><Text style={s.badgeTxt}>{item.badge}</Text></View>}
                                    <Ionicons name="chevron-forward" size={18} color="#4A4A5A" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity 
                        style={s.logoutBtn} 
                        onPress={() => {
                            if (Platform.OS === 'web') {
                                if (window.confirm('Are you sure you want to sign out?')) {
                                    logout();
                                }
                            } else {
                                Alert.alert(t('sign_out'), 'Are you sure you want to sign out?', [
                                    { text: t('cancel'), style: 'cancel' },
                                    { text: t('sign_out'), style: 'destructive', onPress: () => logout() }
                                ]);
                            }
                        }}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
                        <Text style={s.logoutText}>{t('sign_out')}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </LinearGradient>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 15 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
    headerBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingBottom: 120 },
    profileCard: { alignItems: 'center', marginTop: 20 },
    avatarWrapper: { position: 'relative', marginBottom: 20 },
    avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#D4AF37' },
    editIcon: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', borderWeight: 2, borderColor: '#000' },
    userName: { color: '#fff', fontSize: 24, fontWeight: '800' },
    userEmail: { color: '#8E8E93', fontSize: 14, marginTop: 4 },
    roleBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 12 },
    roleTxt: { color: '#8E8E93', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    menuSection: { paddingHorizontal: 24, marginTop: 40, gap: 12 },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    menuIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center' },
    menuLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
    menuRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    badge: { backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    badgeTxt: { color: '#000', fontSize: 11, fontWeight: '900' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 24, marginTop: 40, height: 60, borderRadius: 24, borderWidth: 1.5, borderColor: 'rgba(255,107,107,0.3)' },
    logoutText: { color: '#FF6B6B', fontSize: 15, fontWeight: '800' },
});

export default ProfileScreen;
