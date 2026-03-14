import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import NavigationControls from '../components/NavigationControls';

const SettingItem = ({ icon, label, right, onPress }) => (
    <TouchableOpacity 
        style={s.item} 
        onPress={onPress} 
        activeOpacity={0.7} 
        disabled={!onPress}
    >
        <View style={s.itemLeft}>
            <View style={s.iconBox}><Ionicons name={icon} size={20} color="#D4AF37" /></View>
            <Text style={s.label}>{label}</Text>
        </View>
        <View style={s.itemRight}>
            {right || <Ionicons name="chevron-forward" size={18} color="#4A4A5A" />}
        </View>
    </TouchableOpacity>
);

import { useLanguage } from '../context/LanguageContext';

export default function SettingsScreen({ navigation }) {
    const { logout, user } = useAuth();
    const { t, currentLanguage, changeLanguage } = useLanguage();
    const [notifications, setNotifications] = useState(true);
    const [biometrics, setBiometrics] = useState(false);

    useEffect(() => {
        console.log('SettingsScreen Mounted');
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const notif = await AsyncStorage.getItem('settings_notifications');
            const bio = await AsyncStorage.getItem('settings_biometrics');
            if (notif !== null) setNotifications(JSON.parse(notif));
            if (bio !== null) setBiometrics(JSON.parse(bio));
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    };

    const toggleSwitch = async (key, value, setter) => {
        console.log(`Toggling ${key} to ${value}`);
        setter(value);
        try {
            await AsyncStorage.setItem(`settings_${key}`, JSON.stringify(value));
        } catch (e) {
            console.error('Failed to save setting', e);
        }
    };

    const handleLanguageChange = () => {
        Alert.alert(
            t('language'),
            'Select your preferred language / अपनी पसंदीदा भाषा चुनें / మీ ప్రాధాన్య భాషను ఎంచుకోండి',
            [
                { text: 'English', onPress: () => changeLanguage('en') },
                { text: 'हिन्दी (Hindi)', onPress: () => changeLanguage('hi') },
                { text: 'తెలుగు (Telugu)', onPress: () => changeLanguage('te') },
                { text: t('cancel'), style: 'cancel' }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            t('delete_acc'),
            'Are you sure you want to delete your account? This action is permanent and cannot be undone.',
            [
                { text: t('cancel'), style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive', 
                    onPress: async () => {
                        try {
                            const res = await apiClient.delete('/auth/account');
                            if (res.success) {
                                Alert.alert('Account Deleted', 'Your account has been successfully removed.');
                                logout();
                            }
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete account. Please try again later.');
                        }
                    } 
                }
            ]
        );
    };

    const getLangDisplay = () => {
        if (currentLanguage === 'hi') return 'हिन्दी';
        if (currentLanguage === 'te') return 'తెలుగు';
        return 'English';
    };

    return (
        <View style={s.container}>
            <LinearGradient colors={['#1a150d', '#000']} style={s.gradient}>
                <View style={s.header}>
                    <View style={s.headerLeft}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <NavigationControls />
                    </View>
                    <Text style={s.headerTitle}>{t('settings')}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                    <Text style={s.sectionTitle}>{t('acc_security')}</Text>
                    <View style={s.section}>
                        <SettingItem 
                            icon="person" 
                            label={t('prof_info')} 
                            onPress={() => {
                                console.log('DEBUG: Clicking ProfileInfo');
                                navigation.navigate('ProfileInfo');
                            }} 
                        />
                        <SettingItem 
                            icon="lock-closed" 
                            label={t('change_pass')} 
                            onPress={() => {
                                console.log('DEBUG: Clicking ChangePassword');
                                navigation.navigate('ChangePassword');
                            }} 
                        />
                        <SettingItem 
                            icon="finger-print" 
                            label={t('bio_login')} 
                            right={
                                <Switch 
                                    value={biometrics} 
                                    onValueChange={(val) => toggleSwitch('biometrics', val, setBiometrics)} 
                                    trackColor={{ false: '#333', true: '#D4AF37' }} 
                                    thumbColor="#fff" 
                                />
                            }
                        />
                    </View>

                    <Text style={s.sectionTitle}>{t('preferences')}</Text>
                    <View style={s.section}>
                        <SettingItem 
                            icon="notifications" 
                            label={t('push_notif')} 
                            right={
                                <Switch 
                                    value={notifications} 
                                    onValueChange={(val) => toggleSwitch('notifications', val, setNotifications)} 
                                    trackColor={{ false: '#333', true: '#D4AF37' }} 
                                    thumbColor="#fff" 
                                />
                            }
                        />
                        <SettingItem 
                            icon="language" 
                            label={t('language')} 
                            onPress={handleLanguageChange}
                            right={<Text style={s.valTxt}>{getLangDisplay()}</Text>} 
                        />
                        <SettingItem 
                            icon="color-palette" 
                            label={t('appearance')} 
                            right={<Text style={s.valTxt}>{t('luxury_dark')}</Text>} 
                        />
                    </View>

                    <Text style={s.sectionTitle}>{t('privacy_legal')}</Text>
                    <View style={s.section}>
                        <SettingItem 
                            icon="shield-checkmark" 
                            label={t('priv_policy')} 
                            onPress={() => {
                                console.log('DEBUG: Clicking Privacy Policy');
                                navigation.navigate('Legal', { title: t('priv_policy') });
                            }}
                        />
                        <SettingItem 
                            icon="document-text" 
                            label={t('tos')} 
                            onPress={() => {
                                console.log('DEBUG: Clicking Terms of Service');
                                navigation.navigate('Legal', { title: t('tos') });
                            }}
                        />
                    </View>

                    <TouchableOpacity style={s.dangerBtn} onPress={handleDeleteAccount}>
                        <Text style={s.dangerBtnTxt}>{t('delete_acc')}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
    scroll: { paddingHorizontal: 24, paddingBottom: 50 },
    sectionTitle: { color: '#D4AF37', fontSize: 13, fontWeight: '800', letterSpacing: 1, marginTop: 30, marginBottom: 15, marginLeft: 10 },
    section: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    itemRight: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center' },
    label: { color: '#fff', fontSize: 16, fontWeight: '600' },
    valTxt: { color: '#8E8E93', fontSize: 14, fontWeight: '600' },
    dangerBtn: { marginTop: 40, alignItems: 'center', paddingVertical: 20 },
    dangerBtnTxt: { color: '#FF6B6B', fontSize: 15, fontWeight: '800' },
});
