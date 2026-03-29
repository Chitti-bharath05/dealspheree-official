import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, ScrollView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';

import { useLanguage } from '../context/LanguageContext';

const ProfileScreen = ({ navigation }) => {
    const { user, logout, updateProfileImage, favorites } = useAuth();
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

    const deletePhoto = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Remove your profile photo?')) {
                updateProfileImage(null);
            }
        } else {
            Alert.alert('Remove Photo', 'Are you sure you want to remove your profile photo?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => updateProfileImage(null) }
            ]);
        }
    };

    const menuItems = [
        { 
            icon: 'heart-outline', 
            label: t('deals') || 'My Deals', 
            badge: favorites?.length?.toString() || '0', 
            onPress: () => navigation.navigate('Favorites') 
        },
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
            {/* Global Header is provided by AppNavigator */}
            <View style={{ height: Platform.OS === 'web' ? 70 : 0 }} />


            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                <View style={s.profileCard}>
                        <View style={s.avatarSection}>
                            <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={s.avatarWrapper}>
                                {user?.profileImage ? (
                                    <Image 
                                        style={s.avatar} 
                                        source={{ uri: user.profileImage }} 
                                    />
                                ) : (
                                    <View style={s.avatarDefault}>
                                        <Ionicons name="person" size={52} color="#F5C518" />
                                    </View>
                                )}
                                <View style={s.editIcon}>
                                    <Ionicons name="camera" size={16} color="#000" />
                                </View>
                            </TouchableOpacity>
                            {user?.profileImage && (
                                <TouchableOpacity style={s.deletePhotoBtn} onPress={deletePhoto}>
                                    <Ionicons name="trash-outline" size={13} color="#FF6B6B" />
                                    <Text style={s.deletePhotoTxt}>Delete Photo</Text>
                                </TouchableOpacity>
                            )}
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
                                        <Ionicons name={item.icon} size={20} color="#F5C518" />
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
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D0D0D' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 15 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
    headerBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    scroll: { 
        paddingBottom: 120,
        ...Platform.select({
            web: { width: '100%', maxWidth: 1000, alignSelf: 'center' }
        })
    },
    profileCard: { alignItems: 'center', marginTop: 20 },
    avatarSection: { alignItems: 'center', marginBottom: 20 },
    avatarWrapper: { position: 'relative' },
    avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#F5C518' },
    avatarDefault: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#F5C518', backgroundColor: 'rgba(245,197,24,0.1)', alignItems: 'center', justifyContent: 'center' },
    editIcon: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5C518', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' },
    deletePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)', backgroundColor: 'rgba(255,107,107,0.08)' },
    deletePhotoTxt: { color: '#FF6B6B', fontSize: 12, fontWeight: '700' },
    userName: { color: '#fff', fontSize: 24, fontWeight: '800' },
    userEmail: { color: '#8E8E93', fontSize: 14, marginTop: 4 },
    roleBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 12 },
    roleTxt: { color: '#8E8E93', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    menuSection: { paddingHorizontal: 24, marginTop: 40, gap: 12 },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1A1A1A', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    menuIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(245,197,24,0.1)', alignItems: 'center', justifyContent: 'center' },
    menuLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
    menuRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    badge: { backgroundColor: '#F5C518', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    badgeTxt: { color: '#000', fontSize: 11, fontWeight: '900' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 24, marginTop: 40, height: 60, borderRadius: 24, borderWidth: 1.5, borderColor: 'rgba(255,107,107,0.3)' },
    logoutText: { color: '#FF6B6B', fontSize: 15, fontWeight: '800' },
});

export default ProfileScreen;
