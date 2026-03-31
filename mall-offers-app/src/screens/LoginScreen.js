import React, { useState, useEffect } from 'react';
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
    Image,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const LoginScreen = ({ navigation }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [biometricSupported, setBiometricSupported] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const { width, height } = useWindowDimensions();

    const { login, loginWithBiometrics, pendingDeepLink, setPendingDeepLink } = useAuth();

    useEffect(() => {
        checkBiometrics();
    }, []);

    const checkBiometrics = async () => {
        if (Platform.OS === 'web') return;
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const enabled = await AsyncStorage.getItem('settings_biometrics');
        
        setBiometricSupported(hasHardware && isEnrolled);
        setBiometricEnabled(enabled === 'true');
        
        // Auto-trigger biometrics if enabled for a smooth flow
        if (hasHardware && isEnrolled && enabled === 'true') {
            handleBiometricLogin();
        }
    };

    const handleBiometricLogin = async () => {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Login to Dealspheree',
            fallbackLabel: 'Use Password',
        });

        if (result.success) {
            setLoading(true);
            const loginRes = await loginWithBiometrics();
            setLoading(false);
            if (loginRes.success) {
                if (pendingDeepLink) {
                    const offerId = pendingDeepLink;
                    setPendingDeepLink(null);
                    navigation.navigate('OfferDetails', { offerId });
                }
            } else {
                showError(loginRes.message || 'Biometric login failed. Please use your password.');
            }
        }
    };
    const showError = (msg) => {
        if (Platform.OS === 'web') {
            window.alert(msg);
        } else {
            Alert.alert('Login Error', msg);
        }
        setErrorMsg(msg);
        setTimeout(() => setErrorMsg(''), 5000);
    };

    const { t } = useLanguage();

    const handleLogin = async () => {
        if (!identifier.trim() || !password.trim()) {
            showError("Please enter your email or partner ID and your password.");
            return;
        }
        
        setLoading(true);
        setErrorMsg('');
        try {
            const result = await login(identifier.trim().toLowerCase(), password, rememberMe);
            if (result.success) {
                if (pendingDeepLink) {
                    const offerId = pendingDeepLink;
                    setPendingDeepLink(null);
                    // Small delay to ensure navigator has switched stacks
                    setTimeout(() => {
                        navigation.navigate('OfferDetails', { offerId });
                    }, 500);
                }
            } else {
                showError(result.message || 'Invalid credentials. Please try again.');
            }
        } catch (e) {
            showError('Could not reach the server. Please wait a moment and try again.');
        } finally {
            setLoading(false);
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
                        <View style={s.centerContainer}>
                            {/* Premium Card */}
                            <View style={[s.card, { width: cardWidth }]}>
                                {/* Header */}
                                <View style={s.cardHeader}>
                                    <View style={s.logoCircle}>
                                        <Ionicons name="flash" size={32} color="#F5C518" />
                                    </View>
                                    <Text style={s.logoText}>Dealspheree</Text>
                                    <Text style={s.welcomeText}>Welcome back to excellence</Text>
                                </View>

                                {/* Inputs */}
                                <View style={s.inputContainer}>
                                    <View style={s.inputGroup}>
                                        <Text style={s.label}>SECURE IDENTIFIER</Text>
                                        <View style={s.inputWrapper}>
                                            <Ionicons name="person-outline" size={20} color="#F5C518" style={s.inputIcon} />
                                            <TextInput
                                                style={s.cardInput}
                                                placeholder="Email or Partner ID"
                                                placeholderTextColor="#555"
                                                value={identifier}
                                                onChangeText={setIdentifier}
                                                autoCapitalize="none"
                                            />
                                        </View>
                                    </View>

                                    <View style={s.inputGroup}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            <Text style={s.label}>ACCESS KEY</Text>
                                            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                                <Text style={s.forgotTxtSmall}>Forgot?</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={s.inputWrapper}>
                                            <Ionicons name="lock-closed-outline" size={20} color="#F5C518" style={s.inputIcon} />
                                            <TextInput
                                                style={s.cardInput}
                                                placeholder="••••••••"
                                                placeholderTextColor="#555"
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry={!showPassword}
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
                                </View>

                                {/* Action Button */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -15, marginBottom: 20 }}>
                                        {Platform.OS === 'web' ? (
                                            <TouchableOpacity 
                                                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                                                onPress={() => setRememberMe(!rememberMe)}
                                            >
                                                <View style={{ 
                                                    width: 18, 
                                                    height: 18, 
                                                    borderRadius: 4, 
                                                    borderWidth: 1, 
                                                    borderColor: rememberMe ? '#F5C518' : '#333',
                                                    backgroundColor: rememberMe ? '#F5C518' : 'transparent',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {rememberMe && <Ionicons name="checkmark" size={12} color="#000" />}
                                                </View>
                                                <Text style={{ color: '#888', fontSize: 13, fontWeight: '500' }}>Remember Me</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View />
                                        )}
                                        
                                        {biometricSupported && biometricEnabled && (
                                            <TouchableOpacity 
                                                onPress={handleBiometricLogin}
                                                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                                            >
                                                <Ionicons name="finger-print" size={24} color="#F5C518" />
                                                <Text style={{ color: '#F5C518', fontSize: 12, fontWeight: '700' }}>Biometric</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <TouchableOpacity 
                                        style={s.loginBtn} 
                                        onPress={() => handleLogin()}
                                        disabled={loading}
                                    >
                                        <LinearGradient 
                                            colors={['#F5C518', '#F5C518', '#E5C05B']} 
                                            style={s.loginGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            {loading ? (
                                                <ActivityIndicator color="#000" />
                                            ) : (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                    <Text style={s.loginBtnText}>SIGN IN</Text>
                                                    <Ionicons name="arrow-forward" size={18} color="#000" />
                                                </View>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>

                                {/* Footer / Alternative Actions */}
                                <View style={s.cardFooter}>
                                    <Text style={s.noAccountText}>New to Dealspheree?</Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                        <Text style={s.registerLink}>Create Private Access</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* External Footer */}
                            <View style={s.externalFooter}>
                                <Text style={s.copyrightText}>© 2026 DEALSPHEREE SECURE PORTAL</Text>
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
    logoText: { color: '#F5C518', fontSize: 28, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
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
    forgotTxtSmall: { color: '#F5C518', fontSize: 10, fontWeight: '700', opacity: 0.6 },
    loginBtn: { height: 56, borderRadius: 12, overflow: 'hidden', shadowColor: '#F5C518', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, marginBottom: 32 },
    loginGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loginBtnText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
    cardFooter: { alignItems: 'center', gap: 8 },
    noAccountText: { color: '#666', fontSize: 13, fontWeight: '500' },
    registerLink: { color: '#F5C518', fontSize: 14, fontWeight: '700' },
    externalFooter: { marginTop: 40, alignItems: 'center' },
    copyrightText: { color: '#333', fontSize: 9, fontWeight: '800', letterSpacing: 2 },
});

export default LoginScreen;

