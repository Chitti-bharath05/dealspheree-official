import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, Platform, Modal, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';

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
    const { logout, user, saveSecureCredentials, clearSecureCredentials } = useAuth();
    const { t, currentLanguage, changeLanguage } = useLanguage();
    const [notifications, setNotifications] = useState(true);
    const [biometrics, setBiometrics] = useState(false);
    const [showLangModal, setShowLangModal] = useState(false);
    const [showPassModal, setShowPassModal] = useState(false);
    const [password, setPassword] = useState('');
    const [isVerifyingPass, setIsVerifyingPass] = useState(false);

    useEffect(() => {
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
        if (key === 'biometrics' && value === true) {
            handleEnableBiometrics();
            return;
        }

        if (key === 'biometrics' && value === false) {
            await clearSecureCredentials();
        }

        setter(value);
        try {
            await AsyncStorage.setItem(`settings_${key}`, JSON.stringify(value));
        } catch (e) {
            console.error('Failed to save setting', e);
        }
    };

    const handleEnableBiometrics = async () => {
        if (Platform.OS === 'web') {
            Alert.alert(t('not_supported') || 'Not Supported', 'Biometric login is currently only available on mobile devices.');
            return;
        }

        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                Alert.alert(t('not_available') || 'Not Available', 'Your device does not support biometrics or no fingerprints/face are enrolled.');
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: t('bio_verify_msg') || 'Verify your identity to enable biometric login',
                fallbackLabel: t('use_passcode') || 'Use Passcode',
            });

            if (result.success) {
                setShowPassModal(true);
            }
        } catch (e) {
            Alert.alert(t('error') || 'Error', 'Failed to initialize biometric hardware.');
        }
    };

    const handleConfirmPassword = async () => {
        if (!password) return;
        setIsVerifyingPass(true);
        try {
            // In a real app, you'd verify this password with the backend first
            // For now, we follow the existing pattern of saving it.
            await saveSecureCredentials(user.email, password);
            setBiometrics(true);
            await AsyncStorage.setItem('settings_biometrics', 'true');
            setShowPassModal(false);
            setPassword('');
            Alert.alert(t('success') || "Success", t('bio_active_msg') || "Biometric login is now active!");
        } catch (e) {
            Alert.alert(t('error') || 'Error', 'Failed to save credentials.');
        } finally {
            setIsVerifyingPass(false);
        }
    };

    const handleLanguageChange = () => {
        setShowLangModal(true);
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

                {/* Language Selection Modal */}
                <Modal
                    visible={showLangModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowLangModal(false)}
                >
                    <Pressable style={s.modalOverlay} onPress={() => setShowLangModal(false)}>
                        <View style={s.modalContent}>
                            <Text style={s.modalTitle}>{t('language')}</Text>
                            <Text style={s.modalSub}>Select your preferred language / अपनी पसंदीदा भाषा चुनें / మీ ప్రాధాన్య భాషను ఎంచుకోండి</Text>
                            
                            <TouchableOpacity 
                                style={[s.langOption, currentLanguage === 'en' && s.langOptionActive]} 
                                onPress={() => { changeLanguage('en'); setShowLangModal(false); }}
                            >
                                <Text style={[s.langText, currentLanguage === 'en' && s.langTextActive]}>English</Text>
                                {currentLanguage === 'en' && <Ionicons name="checkmark-circle" size={20} color="#D4AF37" />}
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[s.langOption, currentLanguage === 'hi' && s.langOptionActive]} 
                                onPress={() => { changeLanguage('hi'); setShowLangModal(false); }}
                            >
                                <Text style={[s.langText, currentLanguage === 'hi' && s.langTextActive]}>हिन्दी (Hindi)</Text>
                                {currentLanguage === 'hi' && <Ionicons name="checkmark-circle" size={20} color="#D4AF37" />}
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[s.langOption, currentLanguage === 'te' && s.langOptionActive]} 
                                onPress={() => { changeLanguage('te'); setShowLangModal(false); }}
                            >
                                <Text style={[s.langText, currentLanguage === 'te' && s.langTextActive]}>తెలుగు (Telugu)</Text>
                                {currentLanguage === 'te' && <Ionicons name="checkmark-circle" size={20} color="#D4AF37" />}
                            </TouchableOpacity>

                            <TouchableOpacity style={s.modalCancel} onPress={() => setShowLangModal(false)}>
                                <Text style={s.modalCancelTxt}>{t('cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Modal>

                {/* Password Prompt Modal for Biometrics */}
                <Modal
                    visible={showPassModal}
                    transparent={true}
                    animationType="slide"
                >
                    <View style={s.modalOverlay}>
                        <View style={s.modalContent}>
                            <View style={s.modalHeader}>
                                <Ionicons name="shield-checkmark" size={32} color="#D4AF37" />
                                <Text style={s.modalTitle}>{t('secure_setup') || 'Secure Setup'}</Text>
                            </View>
                            <Text style={s.modalSub}>{t('bio_pass_msg') || 'Please enter your current account password to enable biometric login on this device.'}</Text>
                            
                            <TextInput
                                style={s.input}
                                placeholder={t('password')}
                                placeholderTextColor="#666"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                autoFocus
                            />

                            <View style={s.modalBtns}>
                                <TouchableOpacity 
                                    style={[s.modalBtn, s.modalBtnSecondary]} 
                                    onPress={() => { setShowPassModal(false); setPassword(''); }}
                                >
                                    <Text style={s.modalBtnTxtSecondary}>{t('cancel')}</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[s.modalBtn, s.modalBtnPrimary, !password && { opacity: 0.5 }]} 
                                    onPress={handleConfirmPassword}
                                    disabled={!password || isVerifyingPass}
                                >
                                    {isVerifyingPass ? (
                                        <ActivityIndicator color="#000" size="small" />
                                    ) : (
                                        <Text style={s.modalBtnTxtPrimary}>{t('verify_enable') || 'Verify & Enable'}</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
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
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#1C1C1E', borderRadius: 30, padding: 30, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalHeader: { alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
    modalSub: { color: '#8E8E93', fontSize: 14, textAlign: 'center', marginBottom: 25, lineHeight: 20 },
    langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 20, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: 10 },
    langOptionActive: { backgroundColor: 'rgba(212,175,55,0.1)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
    langText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    langTextActive: { color: '#D4AF37' },
    modalCancel: { marginTop: 15, paddingVertical: 15, alignItems: 'center' },
    modalCancelTxt: { color: '#8E8E93', fontSize: 16, fontWeight: '600' },
    input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 18, color: '#fff', fontSize: 16, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalBtns: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, height: 55, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    modalBtnPrimary: { backgroundColor: '#D4AF37' },
    modalBtnSecondary: { backgroundColor: 'rgba(255,255,255,0.05)' },
    modalBtnTxtPrimary: { color: '#000', fontSize: 16, fontWeight: '700' },
    modalBtnTxtSecondary: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
