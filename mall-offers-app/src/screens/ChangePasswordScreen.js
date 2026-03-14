import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/apiClient';
import { useLanguage } from '../context/LanguageContext';
import NavigationControls from '../components/NavigationControls';

export default function ChangePasswordScreen({ navigation }) {
    const { t } = useLanguage();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleUpdate = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert(t('error'), t('missing_fields'));
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert(t('error'), t('passwords_not_match'));
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert(t('error'), t('password_too_short'));
            return;
        }

        setIsSaving(true);
        try {
            const response = await apiClient.put('/auth/change-password', {
                currentPassword,
                newPassword
            });
            if (response.success) {
                Alert.alert(t('success'), t('password_reset_success'));
                navigation.goBack();
            } else {
                Alert.alert(t('error'), response.message || t('failed_reset_password'));
            }
        } catch (error) {
            Alert.alert(t('error'), t('error_current_password'));
        } finally {
            setIsSaving(false);
        }
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
                    <Text style={s.headerTitle}>{t('acc_security')}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                    <Text style={s.sectionTitle}>{t('change_pass').toUpperCase()}</Text>
                    
                    <View style={s.inputSection}>
                        <Text style={s.label}>{t('password')}</Text>
                        <TextInput 
                            style={s.input} 
                            secureTextEntry 
                            value={currentPassword} 
                            onChangeText={setCurrentPassword}
                            placeholder="••••••••"
                            placeholderTextColor="#555"
                        />
                    </View>

                    <View style={s.inputSection}>
                        <Text style={s.label}>{t('new_password')}</Text>
                        <TextInput 
                            style={s.input} 
                            secureTextEntry 
                            value={newPassword} 
                            onChangeText={setNewPassword}
                            placeholder={t('password_too_short')}
                            placeholderTextColor="#555"
                        />
                    </View>

                    <View style={s.inputSection}>
                        <Text style={s.label}>{t('confirm_password')}</Text>
                        <TextInput 
                            style={s.input} 
                            secureTextEntry 
                            value={confirmPassword} 
                            onChangeText={setConfirmPassword}
                            placeholder={t('confirm_password')}
                            placeholderTextColor="#555"
                        />
                    </View>

                    <TouchableOpacity style={s.saveBtn} onPress={handleUpdate} disabled={isSaving}>
                        {isSaving ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={s.saveBtnTxt}>{t('update_pass')}</Text>
                        )}
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
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
    scroll: { paddingHorizontal: 24, paddingBottom: 50 },
    sectionTitle: { color: '#D4AF37', fontSize: 13, fontWeight: '800', letterSpacing: 1, marginTop: 20, marginBottom: 25 },
    inputSection: { marginBottom: 20 },
    label: { color: '#8E8E93', fontSize: 12, fontWeight: '700', marginBottom: 10, marginLeft: 5 },
    input: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 15, padding: 18, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    saveBtn: { backgroundColor: '#D4AF37', borderRadius: 20, height: 60, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
    saveBtnTxt: { color: '#000', fontSize: 16, fontWeight: '800' },
});

