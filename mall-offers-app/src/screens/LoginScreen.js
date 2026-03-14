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
    Image,
    ScrollView,
    Modal,
    Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';

import { useLanguage } from '../context/LanguageContext';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(false);
    const [pendingSocialData, setPendingSocialData] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    
    const { login, socialLogin } = useAuth();
    const { t } = useLanguage();

    const isExpoGo = Constants.appOwnership === 'expo';
    
    const redirectUri = makeRedirectUri({
        scheme: 'com.credora.malloffersapp',
        useProxy: isExpoGo // Proxy only for Expo Go
    });

    // Strategy:
    // - In Expo Go: Use the Web Client ID (Proxy works like a website)
    // - In Standalone APK: Use Native Client IDs
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: isExpoGo 
            ? '1014294657035-l76t57bls0gj12a1kcti54g4t52sll2e.apps.googleusercontent.com' 
            : undefined,
        androidClientId: '1014294657035-bpt2uqh58jbfgc8r7pn4kjorjum36b1a.apps.googleusercontent.com',
        iosClientId: '1014294657035-2util2uuslfmiqq5o4dmgkctf3biv67t.apps.googleusercontent.com',
        webClientId: '1014294657035-l76t57bls0gj12a1kcti54g4t52sll2e.apps.googleusercontent.com',
        redirectUri
    });

    // Debugging render state
    React.useEffect(() => {
        // These logs appear in the Browser Console (Press F12 on Web)
        console.log('[DEBUG] LoginScreen Loaded');
        console.log('[DEBUG] Platform:', Platform.OS);
        console.log('[DEBUG] Redirect URI:', redirectUri);
        
        if (response) {
            console.log('[DEBUG] OAuth Response:', response);
            
            // For Web, browser alerts are helpful
            if (Platform.OS === 'web') {
                console.log('%c --- GOOGLE RESPONSE RECEIVED --- ', 'background: #222; color: #bada55');
                console.log('Response Type:', response.type);
            }
        }
    }, [response]);

    // Google Auth handled via useEffect
    React.useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            if (Platform.OS !== 'web') Alert.alert('Success', 'Google Access Granted!');
            fetchGoogleInfo(authentication.accessToken);
        } else if (response?.type === 'error') {
            const errorMsg = response.error?.message || 'Unknown OAuth Error';
            Alert.alert('Auth Error', errorMsg);
            console.error('[DEBUG] OAuth Error Details:', response.error);
        }
    }, [response]);

    const fetchGoogleInfo = async (token) => {
        if (Platform.OS !== 'web') Alert.alert('Status', 'Step 1: Fetching User Info...');
        setSocialLoading(true);
        try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const googleUser = await res.json();
            
            if (Platform.OS !== 'web') Alert.alert('Status', `Step 2: Found ${googleUser.email}.\nCalling Backend...`);
            
            const socialData = {
                provider: 'google',
                id: googleUser.sub,
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture
            };

            // Attempt immediate login
            const result = await socialLogin('google', socialData);
            
            if (Platform.OS !== 'web') Alert.alert('Status', `Step 3: Backend Result: ${result.success}`);
            console.log('[DEBUG] result.requiresRole:', result.requiresRole);

            if (result.requiresRole) {
                setPendingSocialData(socialData);
                setShowRoleModal(true);
            } else if (!result.success) {
                Alert.alert('Error', result.message);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to fetch Google account info: ' + e.message);
        } finally {
            setSocialLoading(false);
        }
    };

    const handleRoleSelection = async (role) => {
        setShowRoleModal(false);
        setSocialLoading(true);
        
        const result = await socialLogin(pendingSocialData.provider, {
            ...pendingSocialData,
            role: role
        });
        
        setSocialLoading(false);
        if (!result.success) {
            Alert.alert('Login Failed', result.message);
        }
    };

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        const result = await login(email.trim().toLowerCase(), password);
        setLoading(false);
        if (!result.success) {
            Alert.alert('Login Failed', result.message);
        }
    };

    return (
        <View style={s.container}>
            <LinearGradient colors={['#1a150d', '#000000']} style={s.gradient}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                        {/* Header Image & Title */}
                        <View style={s.header}>
                            <View style={s.logoRow}>
                                <View style={s.logoCircle}>
                                    <Ionicons name="diamond" size={24} color="#D4AF37" />
                                </View>
                                <Text style={s.logoText}>Sizzling Valoris</Text>
                            </View>

                            <View style={s.heroWrapper}>
                                <Image 
                                    source={require('../../assets/luxury_login_bg.png')} 
                                    style={s.heroImage}
                                    resizeMode="cover"
                                />
                                <LinearGradient colors={['transparent', 'rgba(26,21,13,0.8)', '#1a150d']} style={s.heroFade} />
                            </View>

                            <Text style={s.title}>{t('welcome_back')}</Text>
                            <Text style={s.subtitle}>{t('luxury_shopping_sub')}</Text>
                        </View>

                        {/* Form */}
                        <View style={s.form}>
                            <Text style={s.label}>{t('email_addr')}</Text>
                            <View style={s.inputContainer}>
                                <Ionicons name="mail-outline" size={18} color="#D4AF37" style={s.inputIcon} />
                                <TextInput
                                    style={s.input}
                                    placeholder="name@example.com"
                                    placeholderTextColor="#555"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={s.labelRow}>
                                <Text style={s.label}>{t('password')}</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                    <Text style={s.forgotText}>{t('forgot_pass_q')}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={s.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={18} color="#D4AF37" style={s.inputIcon} />
                                <TextInput
                                    style={s.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#555"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#8E8E93" />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={s.loginBtn} onPress={handleLogin} disabled={loading}>
                                <LinearGradient colors={['#FFD700', '#D4AF37']} style={s.loginGradient}>
                                    {loading ? <ActivityIndicator color="#000" /> : <Text style={s.loginBtnText}>{t('login_btn')}</Text>}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={s.divider}>
                                <View style={s.line} />
                                <Text style={s.dividerText}>{t('or_continue_with')}</Text>
                                <View style={s.line} />
                            </View>

                            {/* Social Buttons */}
                            <View style={s.socialRow}>
                                <TouchableOpacity 
                                    style={[s.socialBtn, { backgroundColor: '#4285F4', elevation: 10, zIndex: 100 }]} 
                                    onPress={async () => {
                                        if (request) {
                                            promptAsync().catch(err => {
                                                console.error('Google Auth Error:', err);
                                                Alert.alert('Login Error', 'Failed to start Google Sign-In');
                                            });
                                        } else {
                                            Alert.alert('Configuration Error', 'Google Login not configured properly');
                                        }
                                    }}
                                >
                                    {socialLoading && pendingSocialData?.provider === 'google' ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
                                            <Text style={s.socialText}>Google</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={s.registerLink} onPress={() => navigation.navigate('Register')}>
                                <Text style={s.registerText}>
                                    {t('new_to_valoris')} <Text style={s.registerBold}>{t('create_acc')}</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>

            {/* Role Selection Modal */}
            <Modal
                transparent
                visible={showRoleModal}
                animationType="fade"
                onRequestClose={() => setShowRoleModal(false)}
            >
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <Text style={s.modalTitle}>Select your Role</Text>
                        <Text style={s.modalSubtitle}>How will you be using Sizzling Valoris?</Text>
                        
                        <TouchableOpacity 
                            style={s.roleOption} 
                            onPress={() => handleRoleSelection('customer')}
                        >
                            <View style={[s.roleIconCircle, { backgroundColor: '#4285F4' }]}>
                                <Ionicons name="person" size={24} color="#fff" />
                            </View>
                            <View>
                                <Text style={s.roleOptionTitle}>Customer</Text>
                                <Text style={s.roleOptionDesc}>I want to discover mall offers</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={s.roleOption} 
                            onPress={() => handleRoleSelection('store_owner')}
                        >
                            <View style={[s.roleIconCircle, { backgroundColor: '#D4AF37' }]}>
                                <Ionicons name="storefront" size={24} color="#fff" />
                            </View>
                            <View>
                                <Text style={s.roleOptionTitle}>Store Owner</Text>
                                <Text style={s.roleOptionDesc}>I want to manage my store offers</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={s.cancelBtn} 
                            onPress={() => setShowRoleModal(false)}
                        >
                            <Text style={s.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    scroll: { paddingBottom: 40 },
    header: { alignItems: 'center', paddingTop: 60 },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', paddingHorizontal: 24, marginBottom: 30 },
    logoCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' },
    logoText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    heroWrapper: { width: '100%', height: 260, position: 'relative' },
    heroImage: { width: '100%', height: '100%', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    heroFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
    title: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 10 },
    subtitle: { color: '#8E8E93', fontSize: 13, marginTop: 8 },
    form: { paddingHorizontal: 24, marginTop: 30 },
    label: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 10 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    forgotText: { color: '#D4AF37', fontSize: 12, fontWeight: '700' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingHorizontal: 16, height: 56, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)' },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, color: '#fff', fontSize: 15 },
    loginBtn: { borderRadius: 25, overflow: 'hidden', marginTop: 10, shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    loginGradient: { paddingVertical: 18, alignItems: 'center' },
    loginBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
    line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    dividerText: { color: '#555', marginHorizontal: 16, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    socialRow: { flexDirection: 'row', gap: 12 },
    socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    socialText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    registerLink: { marginTop: 30, alignItems: 'center' },
    registerText: { color: '#8E8E93', fontSize: 14 },
    registerBold: { color: '#D4AF37', fontWeight: '800' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#1a150d', borderRadius: 30, padding: 30, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
    modalTitle: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
    modalSubtitle: { color: '#8E8E93', fontSize: 14, textAlign: 'center', marginBottom: 30 },
    roleOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    roleIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    roleOptionTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    roleOptionDesc: { color: '#8E8E93', fontSize: 12 },
    cancelBtn: { marginTop: 10, padding: 15, alignItems: 'center' },
    cancelText: { color: '#8E8E93', fontSize: 14, fontWeight: '600' },
});

export default LoginScreen;
