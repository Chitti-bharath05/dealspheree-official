import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/apiClient';
import { useLanguage } from '../context/LanguageContext';

const ResetPasswordScreen = ({ route, navigation }) => {
    const { email } = route.params || {};
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const { t } = useLanguage();
    const { width, height } = useWindowDimensions();

    const showError = (msg) => { setSuccessMsg(''); setErrorMsg(msg); };
    const showSuccess = (msg) => { setErrorMsg(''); setSuccessMsg(msg); };

    const handleResetPassword = async () => {
        if (!otp || !newPassword || !confirmPassword) {
            showError('Please fill in all fields.');
            return;
        }
        if (newPassword !== confirmPassword) {
            showError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            showError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const response = await apiClient.post('/auth/resetpassword', {
                email,
                otp,
                newPassword
            });
            setLoading(false);
            if (response.success) {
                showSuccess('Password reset successful!');
                setTimeout(() => {
                    navigation.navigate('Login');
                }, 2000);
            } else {
                showError(response.message || 'Reset failed. Check your OTP.');
            }
        } catch (error) {
            setLoading(false);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to reset password.';
            showError(errorMessage);
        }
    };

    const isDesktop = width > 768;
    const cardWidth = isDesktop ? 480 : width * 0.9;

    return (
        <View style={s.container}>
            <LinearGradient colors={['#000000', '#1a1a1a']} style={s.gradient}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView 
                        contentContainerStyle={[s.scroll, { minHeight: height }]} 
                        showsVerticalScrollIndicator={false}
                    >
                        <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="#F5C518" />
                        </TouchableOpacity>

                        <View style={s.centerContainer}>
                            <View style={[s.card, { width: cardWidth }]}>
                                {/* Header */}
                                <View style={s.cardHeader}>
                                    <View style={s.logoCircle}>
                                        <Ionicons name="refresh-outline" size={32} color="#F5C518" />
                                    </View>
                                    <Text style={s.logoText}>{t('reset_pass')}</Text>
                                    <Text style={s.welcomeText}>Set your new access credentials</Text>
                                </View>

                                {/* Error/Success Banners */}
                                {errorMsg ? (
                                    <View style={[s.msgBanner, { borderColor: 'rgba(255,107,107,0.4)', backgroundColor: 'rgba(255,107,107,0.08)' }]}>
                                        <Ionicons name="alert-circle" size={16} color="#FF6B6B" style={{ marginRight: 8 }} />
                                        <Text style={[s.msgText, { color: '#FF6B6B' }]}>{errorMsg}</Text>
                                    </View>
                                ) : null}
                                {successMsg ? (
                                    <View style={[s.msgBanner, { borderColor: 'rgba(78,205,196,0.4)', backgroundColor: 'rgba(78,205,196,0.08)' }]}>
                                        <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" style={{ marginRight: 8 }} />
                                        <Text style={[s.msgText, { color: '#4ECDC4' }]}>{successMsg}</Text>
                                    </View>
                                ) : null}

                                {/* Inputs */}
                                <View style={s.inputContainer}>
                                    <View style={s.inputGroup}>
                                        <Text style={s.label}>6-DIGIT OTP CODE</Text>
                                        <View style={s.inputWrapper}>
                                            <Ionicons name="keypad-outline" size={20} color="#F5C518" style={s.inputIcon} />
                                            <TextInput
                                                style={s.cardInput}
                                                placeholder="Enter OTP"
                                                placeholderTextColor="#555"
                                                value={otp}
                                                onChangeText={setOtp}
                                                keyboardType="number-pad"
                                                maxLength={6}
                                            />
                                        </View>
                                    </View>

                                    <View style={s.inputGroup}>
                                        <Text style={s.label}>NEW ACCESS KEY</Text>
                                        <View style={s.inputWrapper}>
                                            <Ionicons name="lock-closed-outline" size={20} color="#F5C518" style={s.inputIcon} />
                                            <TextInput
                                                style={s.cardInput}
                                                placeholder="New Password"
                                                placeholderTextColor="#555"
                                                secureTextEntry={!showPassword}
                                                value={newPassword}
                                                onChangeText={setNewPassword}
                                            />
                                            <TouchableOpacity 
                                                onPress={() => setShowPassword(!showPassword)}
                                                style={{ paddingHorizontal: 16 }}
                                            >
                                                <Ionicons 
                                                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                                                    size={20} 
                                                    color="#8E8E93" 
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={s.inputGroup}>
                                        <Text style={s.label}>CONFIRM ACCESS KEY</Text>
                                        <View style={s.inputWrapper}>
                                            <Ionicons name="shield-checkmark-outline" size={20} color="#F5C518" style={s.inputIcon} />
                                            <TextInput
                                                style={s.cardInput}
                                                placeholder="Confirm New Password"
                                                placeholderTextColor="#555"
                                                secureTextEntry={!showPassword}
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                            />
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={s.actionBtn}
                                    onPress={handleResetPassword}
                                    disabled={loading}
                                >
                                    <LinearGradient
                                        colors={['#F5C518', '#D4AF37', '#E5C05B']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={s.actionGradient}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#000" />
                                        ) : (
                                            <Text style={s.actionBtnText}>{t('reset_pass')}</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            {/* External Footer */}
                            <View style={s.externalFooter}>
                                <Text style={s.copyrightText}>© 2026 DEALSPHERE SECURE PORTAL</Text>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    gradient: { flex: 1 },
    scroll: { flexGrow: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        padding: 10,
    },
    card: { 
        backgroundColor: '#121212', 
        borderRadius: 24, 
        padding: 40, 
        borderWidth: 1, 
        borderColor: 'rgba(245, 197, 24, 0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 20
    },
    cardHeader: { alignItems: 'center', marginBottom: 40 },
    logoCircle: { 
        width: 72, 
        height: 72, 
        borderRadius: 36, 
        backgroundColor: 'rgba(245, 197, 24, 0.1)', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(245, 197, 24, 0.2)'
    },
    logoText: { color: '#F5C518', fontSize: 24, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center' },
    welcomeText: { color: '#888', fontSize: 13, fontWeight: '500', marginTop: 8 },
    inputContainer: { gap: 24, marginBottom: 32 },
    inputGroup: { gap: 10 },
    label: { color: '#F5C518', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginLeft: 4, opacity: 0.8 },
    inputWrapper: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#1A1A1A', 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden'
    },
    inputIcon: { marginLeft: 16 },
    cardInput: { 
        flex: 1, 
        height: 56, 
        paddingHorizontal: 12, 
        color: '#FFFFFF', 
        fontSize: 15, 
        fontWeight: '500' 
    },
    actionBtn: { height: 56, borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
    actionGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    actionBtnText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
    msgBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 24, borderWidth: 1 },
    msgText: { fontSize: 12, fontWeight: '600', flex: 1 },
    externalFooter: { marginTop: 40, alignItems: 'center' },
    copyrightText: { color: '#333', fontSize: 9, fontWeight: '800', letterSpacing: 2 },
});

export default ResetPasswordScreen;
