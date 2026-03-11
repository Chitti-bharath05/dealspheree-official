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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

import { useLanguage } from '../context/LanguageContext';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { t } = useLanguage();

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
                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        
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
                                <TouchableOpacity style={s.socialBtn}>
                                    <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={s.socialText}>Google</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={s.socialBtn}>
                                    <Ionicons name="logo-apple" size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={s.socialText}>Apple</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={s.registerLink} onPress={() => navigation.navigate('Register')}>
                                <Text style={s.registerText}>
                                    {t('new_to_valoris')} <Text style={s.registerBold}>{t('create_acc')}</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </ScrollView>
            </LinearGradient>
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
});

export default LoginScreen;
