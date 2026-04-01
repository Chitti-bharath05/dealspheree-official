import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform, Easing, Image } from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
    // Stage 1: Triangle Assembly
    const leftSlide = useRef(new Animated.Value(0)).current;
    const rightSlide = useRef(new Animated.Value(0)).current;
    const bottomSlide = useRef(new Animated.Value(0)).current;
    
    // Stage 2: Logo and Text Reveal
    const coreLogoFade = useRef(new Animated.Value(0)).current;
    const coreLogoScale = useRef(new Animated.Value(0.9)).current;
    
    const textFade = useRef(new Animated.Value(0)).current;
    const textSlide = useRef(new Animated.Value(20)).current;
    
    // Stage 3: Fade out app
    const finalFade = useRef(new Animated.Value(1)).current;

    const L = 200; // Side length of the equilateral triangle
    const H = L * 0.866; // Height of the triangle

    useEffect(() => {
        // Build the sequence
        Animated.sequence([
            // 1. Lower two parts slide in (Left and Right diagonals)
            Animated.parallel([
                Animated.timing(leftSlide, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.out(Easing.exp),
                    useNativeDriver: true,
                }),
                Animated.timing(rightSlide, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.out(Easing.exp),
                    useNativeDriver: true,
                })
            ]),
            // 2. Top part attaches. In our math, the bottom line completes the framework!
            Animated.timing(bottomSlide, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.exp),
                useNativeDriver: true,
            }),
            // 3. Middle Logo and Text simultaneous reveal
            Animated.parallel([
                Animated.timing(coreLogoFade, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(coreLogoScale, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.out(Easing.circ),
                    useNativeDriver: true,
                }),
                Animated.timing(textFade, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(textSlide, {
                    toValue: 0,
                    duration: 1000,
                    easing: Easing.out(Easing.back(1.5)),
                    useNativeDriver: true,
                })
            ]),
            // Hold for visual admiration
            Animated.delay(1200),
            // 4. Fade entire screen out
            Animated.timing(finalFade, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start(() => {
            if (onFinish) onFinish();
        });
    }, []);

    // Interpolations for the assembly
    // Left line slides from -150 to exact position
    const leftLineTransX = leftSlide.interpolate({
        inputRange: [0, 1],
        outputRange: [-150, -L/4] // -50 for L=200
    });
    const leftLineOpacity = leftSlide.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 1, 1]
    });

    // Right line slides from +150 to exact position
    const rightLineTransX = rightSlide.interpolate({
        inputRange: [0, 1],
        outputRange: [150, L/4] // 50 for L=200
    });
    const rightLineOpacity = rightSlide.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 1, 1]
    });

    // Bottom line reveals itself
    const bottomLineTransY = bottomSlide.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 0]
    });
    const bottomLineOpacity = bottomSlide.interpolate({
        inputRange: [0, 0.8, 1],
        outputRange: [0, 1, 1]
    });

    return (
        <Animated.View style={[s.container, { opacity: finalFade }]}>
            {/* The main triangle wrapper */}
            <View style={{ width: L, height: H + 80, alignItems: 'center', justifyContent: 'center' }}>
                
                {/* Mathematical Hollow Triangle */}
                <View style={{ width: L, height: H, position: 'relative' }}>
                    
                    {/* Left Line */}
                    <Animated.View style={[s.triangleLine, { 
                        width: L, 
                        opacity: leftLineOpacity,
                        transform: [
                            { translateX: leftLineTransX },
                            { translateY: -H/2 },
                            { rotate: '-60deg' }
                        ] 
                    }]} />

                    {/* Right Line */}
                    <Animated.View style={[s.triangleLine, { 
                        width: L, 
                        opacity: rightLineOpacity,
                        transform: [
                            { translateX: rightLineTransX },
                            { translateY: -H/2 },
                            { rotate: '60deg' }
                        ] 
                    }]} />

                    {/* Bottom Line */}
                    <Animated.View style={[s.triangleLine, { 
                        width: L,
                        bottom: 0,
                        opacity: bottomLineOpacity,
                        transform: [
                            { translateY: bottomLineTransY }
                        ] 
                    }]} />
                    
                    {/* Core Logo Image Extracted (Cropping the outer PNG triangle to rely solely on our dynamic lines) */}
                    <Animated.View style={[s.coreLogoWrapper, {
                        opacity: coreLogoFade,
                        transform: [{ scale: coreLogoScale }]
                    }]}>
                        <Image 
                            source={require('../../assets/official_logo.png')}
                            style={{ 
                                width: 260, 
                                height: 260, 
                                position: 'absolute', 
                                left: -85, 
                                top: -85 
                            }}
                            resizeMode="contain"
                        />
                    </Animated.View>
                </View>

                {/* DEALSPHEREE Text Area */}
                <Animated.View style={[s.textContainer, {
                    opacity: textFade,
                    transform: [{ translateY: textSlide }]
                }]}>
                    <Text style={s.brandTitle}>DEALSPHEREE</Text>
                    <View style={s.brandUnderline} />
                </Animated.View>

            </View>
        </Animated.View>
    );
};

const s = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    triangleLine: {
        position: 'absolute',
        height: 2,
        backgroundColor: '#D4AF37', // Premium Gold
        shadowColor: '#F5C518',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 10,
    },
    coreLogoWrapper: {
        position: 'absolute',
        top: 41.6, // Centered vertically in 173.2 height
        left: 55,  // Centered horizontally out of 200
        width: 90,
        height: 90,
        borderRadius: 45,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    textContainer: {
        alignItems: 'center',
        marginTop: 30,
    },
    brandTitle: {
        color: '#D4AF37',
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
    brandUnderline: {
        width: '80%',
        height: 1,
        backgroundColor: '#D4AF37',
        marginTop: 10,
        opacity: 0.5,
    }
});

export default SplashScreen;
