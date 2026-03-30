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
    ScrollView,
    ActivityIndicator,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

import { useLanguage } from '../context/LanguageContext';

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [role, setRole] = useState('customer');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const { register } = useAuth();
    const { t } = useLanguage();

    const showError = (msg) => {
        setErrorMsg(msg);
        setTimeout(() => setErrorMsg(''), 5000);
    };

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !password.trim()) {
            showError('Please fill in all required fields.');
            return;
        }
        if (!email.includes('@')) {
            showError('Please enter a valid email address.');
            return;
        }
        if (password !== confirmPassword) {
            showError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            showError('Password must be at least 6 characters.');
            return;
        }
        setErrorMsg('');
        setLoading(true);
        try {
            const result = await register(name.trim(), email.trim().toLowerCase(), password, role, mobileNumber.trim());
            if (!result.success) {
                showError(result.message || 'Registration failed. Please try again.');
            }
        } catch (e) {
            showError('Could not connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const RoleButton = ({ value, label, icon }) => (
        <TouchableOpacity
            style={[styles.roleButton, role === value && styles.roleButtonActive]}
            onPress={() => setRole(value)}
        >
            <Ionicons
                name={icon}
                size={22}
                color={role === value ? '#F5C518' : '#8E8E93'}
            />
            <Text
                style={[styles.roleButtonText, role === value && styles.roleButtonTextActive]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a150d', '#000000']}
                style={styles.gradient}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.headerContainer}>
                            <Text style={styles.headerTitle}>{t('create_acc')}</Text>
                            <Text style={styles.headerSubtitle}>
                                {t('luxury_shopping_sub')}
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.formContainer}>
                            {/* Inline error banner */}
                            {errorMsg ? (
                                <View style={styles.errorBanner}>
                                    <Ionicons name="alert-circle" size={16} color="#FF6B6B" style={{ marginRight: 8 }} />
                                    <Text style={styles.errorBannerText}>{errorMsg}</Text>
                                </View>
                            ) : null}
                            {/* Role Selection */}
                            <Text style={styles.sectionLabel}>I am a</Text>
                            <View style={styles.roleContainer}>
                                <RoleButton value="customer" label="Customer" icon="person-outline" />
                                <RoleButton value="store_owner" label="Store Owner" icon="storefront-outline" />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#F5C518" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('full_name')}
                                    placeholderTextColor="#555"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#F5C518" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('email_addr')}
                                    placeholderTextColor="#555"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="call-outline" size={20} color="#F5C518" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('phone_num')}
                                    placeholderTextColor="#555"
                                    value={mobileNumber}
                                    onChangeText={setMobileNumber}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#F5C518" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('password')}
                                    placeholderTextColor="#555"
                                    value={password}
                                    onChangeText={setPassword}
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
                                <Ionicons name="shield-checkmark-outline" size={20} color="#F5C518" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm Password"
                                    placeholderTextColor="#555"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
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

                            <TouchableOpacity
                                style={styles.registerBtn}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#FFD700', '#F5C518']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.registerGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#000" />
                                    ) : (
                                        <Text style={styles.registerBtnText}>{t('create_acc_btn')}</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.loginLink}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.loginLinkText}>
                                    {t('already_have_acc')}{' '}
                                    <Text style={styles.loginLinkBold}>{t('login_here')}</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </ScrollView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,107,107,0.12)', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,107,107,0.4)' },
    errorBannerText: { color: '#FF6B6B', fontSize: 13, fontWeight: '600', flex: 1 },
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContainer: {
        marginBottom: 30,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#A0A0B0',
    },
    formContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.07)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    sectionLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    roleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    roleButtonActive: {
        borderColor: '#F5C518',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
    },
    roleButtonText: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '600',
    },
    roleButtonTextActive: {
        color: '#F5C518',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 14,
        paddingHorizontal: 16,
        marginBottom: 14,
        height: 52,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#FFFFFF',
    },
    registerBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 8,
    },
    registerGradient: {
        paddingVertical: 15,
        alignItems: 'center',
        borderRadius: 14,
    },
    registerBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    loginLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    loginLinkText: {
        color: '#A0A0B0',
        fontSize: 14,
    },
    loginLinkBold: {
        color: '#FF6B6B',
        fontWeight: '700',
    },
});

export default RegisterScreen;
