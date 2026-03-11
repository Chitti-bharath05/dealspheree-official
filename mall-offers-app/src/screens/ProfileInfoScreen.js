import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { useLanguage } from '../context/LanguageContext';

export default function ProfileInfoScreen({ navigation }) {
    const { user, updateProfile } = useAuth();
    const { t } = useLanguage();
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.mobileNumber || user?.phone || '');
    const [city, setCity] = useState(user?.city || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert(t('error'), t('name_required'));
            return;
        }

        setIsSaving(true);
        try {
            const response = await apiClient.put('/auth/profile', { name, phone, city });
            if (response.success) {
                await updateProfile({ name, mobileNumber: phone, phone, city });
                Alert.alert(t('success'), t('profile_updated_success'));
                navigation.goBack();
            } else {
                Alert.alert(t('error'), response.message || t('failed_update_profile'));
            }
        } catch (error) {
            Alert.alert(t('error'), t('error_updating_profile'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={s.container}>
            <LinearGradient colors={['#1a150d', '#000']} style={s.gradient}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>{t('prof_info')}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                    <View style={s.inputSection}>
                        <Text style={s.label}>{t('full_name')}</Text>
                        <TextInput 
                            style={s.input} 
                            value={name} 
                            onChangeText={setName} 
                            placeholder={t('full_name')}
                            placeholderTextColor="#555"
                        />
                    </View>

                    <View style={s.inputSection}>
                        <Text style={s.label}>{t('email_addr')}</Text>
                        <TextInput 
                            style={[s.input, s.disabledInput]} 
                            value={user?.email} 
                            editable={false}
                        />
                        <Text style={s.hint}>{t('email_no_change')}</Text>
                    </View>

                    <View style={s.inputSection}>
                        <Text style={s.label}>{t('phone_num')}</Text>
                        <TextInput 
                            style={s.input} 
                            value={phone} 
                            onChangeText={setPhone} 
                            placeholder="+91 0000000000"
                            placeholderTextColor="#555"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={s.inputSection}>
                        <Text style={s.label}>{t('city')}</Text>
                        <TextInput 
                            style={s.input} 
                            value={city} 
                            onChangeText={setCity} 
                            placeholder={t('city')}
                            placeholderTextColor="#555"
                        />
                    </View>

                    <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={s.saveBtnTxt}>{t('save_changes')}</Text>
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
    backBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
    scroll: { paddingHorizontal: 24, paddingBottom: 50 },
    inputSection: { marginBottom: 25 },
    label: { color: '#D4AF37', fontSize: 13, fontWeight: '800', letterSpacing: 1, marginBottom: 10, marginLeft: 5 },
    input: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 15, padding: 18, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    disabledInput: { color: '#555', backgroundColor: 'rgba(255,255,255,0.01)' },
    hint: { color: '#444', fontSize: 11, marginTop: 5, marginLeft: 5 },
    saveBtn: { backgroundColor: '#D4AF37', borderRadius: 20, height: 60, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    saveBtnTxt: { color: '#000', fontSize: 16, fontWeight: '800' },
});

