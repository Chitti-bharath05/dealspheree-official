import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const finalFade = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Sequence: Glow -> Reveal -> Scale -> Fade Out
        Animated.sequence([
            // 1. Initial Glow & Slow Reveal
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 2500,
                    easing: Easing.out(Easing.exp),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 2500,
                    easing: Easing.out(Easing.exp),
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ]),
            // 2. Hold for a bit
            Animated.delay(1000),
            // 3. Final Fade Out of the entire splash
            Animated.timing(finalFade, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (onFinish) onFinish();
        });
    }, []);

    return (
        <Animated.View style={[s.container, { opacity: finalFade }]}>
            <View style={s.background}>
                {/* Subtle Gold Background Radial Glow */}
                <Animated.View style={[s.glowCircle, { 
                    opacity: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.15]
                    }),
                    transform: [{ scale: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 2]
                    }) }]
                }]} />
                
                <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                    <View style={s.logoWrapper}>
                        <Animated.Image 
                            source={require('../../assets/official_logo.png')} 
                            style={{
                                width: Math.min(width * 0.8, 400),
                                height: Math.min(width * 0.8, 400),
                            }}
                            resizeMode="contain"
                        />
                    </View>
                    
                    <View style={s.footer}>
                        <View style={s.loadingBarContainer}>
                            <Animated.View style={[s.loadingBar, {
                                width: glowAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%']
                                })
                            }]} />
                        </View>
                        <Text style={s.version}>v2.0.4 • SECURE ACCESS</Text>
                    </View>
                </Animated.View>
            </View>
        </Animated.View>
    );
};

const s = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    background: {
        flex: 1,
        width: '100%',
        backgroundColor: '#0D0D0D',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    glowCircle: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#F5C518',
        shadowColor: '#F5C518',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 100,
        elevation: 20,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoWrapper: {
        alignItems: 'center',
    },
    imageBadge: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(245,197,24,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 25,
        shadowColor: '#F5C518',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        padding: 20,
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    title: {
        color: '#F5C518',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 8,
        textShadowColor: 'rgba(245,197,24,0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    tagline: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 4,
        marginTop: 10,
    },
    footer: {
        position: 'absolute',
        bottom: Platform.OS === 'web' ? -height * 0.3 : -200,
        alignItems: 'center',
        width: 300,
    },
    loadingBarContainer: {
        width: '100%',
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 1,
        overflow: 'hidden',
        marginBottom: 12,
    },
    loadingBar: {
        height: '100%',
        backgroundColor: '#F5C518',
    },
    version: {
        color: '#333',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    }
});

export default SplashScreen;
