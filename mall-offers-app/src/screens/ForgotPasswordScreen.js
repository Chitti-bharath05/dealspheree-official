import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/apiClient';
import { useLanguage } from '../context/LanguageContext';

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const { t } = useLanguage();

    const showError = (msg) => { setSuccessMsg(''); setErrorMsg(msg); };
    const showSuccess = (msg) => { setErrorMsg(''); setSuccessMsg(msg); };

    const handleRequestReset = async () => {
        if (!email.trim() || !email.includes('@')) {
            showError('Please enter a valid email address.');
            return;
        }
        setErrorMsg('');
        setSuccessMsg('');
        setLoading(true);
        try {
            const response = await apiClient.post('/auth/forgotpassword', { 
                email: email.trim().toLowerCase() 
            });
            setLoading(false);
            if (response.success) {
                showSuccess('OTP sent! Check your email inbox.');
                setTimeout(() => {
                    navigation.navigate('ResetPassword', { email: email.trim().toLowerCase() });
                }, 1500);
            } else {
                showError(response.message || 'Failed to send OTP. User might not exist.');
            }
        } catch (error) {
            setLoading(false);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to send OTP. Please try again.';
            showError(errorMessage);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1a150d', '#000']} style={styles.gradient}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>

                        <View style={styles.headerContainer}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="lock-open-outline" size={40} color="#D4AF37" />
                            </View>
                            <Text style={styles.title}>{t('forgot_pass_q')}</Text>
                            <Text style={styles.subtitle}>{t('subtitle_forgot_pass')}</Text>
                        </View>

                        <View style={styles.formContainer}>
                            {errorMsg ? (
                                <View style={[styles.msgBanner, { borderColor: 'rgba(255,107,107,0.4)', backgroundColor: 'rgba(255,107,107,0.08)' }]}>
                                    <Ionicons name="alert-circle" size={16} color="#FF6B6B" style={{ marginRight: 8 }} />
                                    <Text style={[styles.msgText, { color: '#FF6B6B' }]}>{errorMsg}</Text>
                                </View>
                            ) : null}
                            {successMsg ? (
                                <View style={[styles.msgBanner, { borderColor: 'rgba(78,205,196,0.4)', backgroundColor: 'rgba(78,205,196,0.08)' }]}>
                                    <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" style={{ marginRight: 8 }} />
                                    <Text style={[styles.msgText, { color: '#4ECDC4' }]}>{successMsg}</Text>
                                </View>
                            ) : null}
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('email_addr')}
                                    placeholderTextColor="#8E8E93"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={handleRequestReset}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#D4AF37', '#B8860B']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.resetGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#000" />
                                    ) : (
                                        <Text style={styles.resetButtonText}>{t('send_otp')}</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.cancelText}>{t('back_to_login')}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    keyboardView: { flex: 1 },
    msgBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1 },
    msgText: { fontSize: 13, fontWeight: '600', flex: 1 },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 0,
        padding: 10,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#A0A0B0',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    formContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 14,
        paddingHorizontal: 16,
        marginBottom: 20,
        height: 52,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: '#FFFFFF' },
    resetButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    resetGradient: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    resetButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '800',
    },
    cancelButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    cancelText: {
        color: '#D4AF37',
        fontSize: 14,
        fontWeight: '700',
    },
});

export default ForgotPasswordScreen;
