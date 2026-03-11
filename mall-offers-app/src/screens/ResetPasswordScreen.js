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

const ResetPasswordScreen = ({ route, navigation }) => {
    const { email } = route.params || {};
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    const handleResetPassword = async () => {
        if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
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

        setLoading(true);
        try {
            const response = await apiClient.put('/auth/resetpassword', {
                otp: otp.trim(),
                password: newPassword,
                email: email
            });
            setLoading(false);

            if (response.success) {
                const message = t('password_reset_success');
                if (Platform.OS === 'web') {
                    alert(message);
                    navigation.navigate('Login');
                } else {
                    Alert.alert(t('success'), message, [
                        { text: t('login_here'), onPress: () => navigation.navigate('Login') }
                    ]);
                }
            }
        } catch (error) {
            setLoading(false);
            const message = error.response?.data?.message || t('failed_reset_password');
            Alert.alert(t('error'), message);
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
                                <Ionicons name="shield-checkmark-outline" size={40} color="#D4AF37" />
                            </View>
                            <Text style={styles.title}>{t('reset_password')}</Text>
                            <Text style={styles.subtitle}>{t('otp_sent_to_email')}</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <Ionicons name="key-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('otp_code')}
                                    placeholderTextColor="#8E8E93"
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('new_password')}
                                    placeholderTextColor="#8E8E93"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color="#8E8E93"
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('confirm_password')}
                                    placeholderTextColor="#8E8E93"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={handleResetPassword}
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
                                        <Text style={styles.resetButtonText}>{t('update_pass')}</Text>
                                    )}
                                </LinearGradient>
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
        marginBottom: 30,
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
        fontSize: 15,
        color: '#A0A0B0',
        textAlign: 'center',
        paddingHorizontal: 10,
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
        marginBottom: 14,
        height: 52,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: '#FFFFFF' },
    resetButton: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 10,
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
});

export default ResetPasswordScreen;
