import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing, Platform } from 'react-native';
import Svg, { Line, Circle, Rect, Defs, LinearGradient, Stop, G, Path, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');
const AnimatedLine = Animated.createAnimatedComponent(Line);

const SplashScreen = ({ onFinish }) => {
    // Stage 1: Triangle Paths
    const leftLineLength = 165; 
    const rightLineLength = 165;
    const bottomLineLength = 160;

    const leftDraw = useRef(new Animated.Value(leftLineLength)).current;
    const rightDraw = useRef(new Animated.Value(rightLineLength)).current;
    const bottomDraw = useRef(new Animated.Value(bottomLineLength)).current;

    // Stage 2: Icons
    const iconScale = useRef(new Animated.Value(0.85)).current;
    const iconOpacity = useRef(new Animated.Value(0)).current;

    // Stage 3: Title and Letter Spacing
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const letterSpacing = useRef(new Animated.Value(15)).current; // starts wide

    // Stage 4: Thin line + Tagline
    const subOpacity = useRef(new Animated.Value(0)).current;
    const subSlide = useRef(new Animated.Value(10)).current;

    // Progress Bar + Exit
    const progressFill = useRef(new Animated.Value(0)).current;
    const exitScale = useRef(new Animated.Value(1)).current;
    const exitOpacity = useRef(new Animated.Value(1)).current;

    // Web Fallback injection for SVG drawing (since RNW doesn't fully support strokeDashoffset interpolated strings)
    const isWeb = Platform.OS === 'web';

    useEffect(() => {
        // Master Sequence
        Animated.parallel([
            // 1. Progress Bar completely filling over 4.5 seconds
            Animated.timing(progressFill, {
                toValue: 1,
                duration: 4500,
                useNativeDriver: false, // width animation
                easing: Easing.linear
            }),
            
            // 2. Main Timeline Execution
            Animated.sequence([
                // Triangle Sequence (~1.8s)
                Animated.timing(leftDraw, { toValue: 0, duration: 600, useNativeDriver: false, easing: Easing.out(Easing.ease) }),
                Animated.timing(rightDraw, { toValue: 0, duration: 600, useNativeDriver: false, easing: Easing.out(Easing.ease) }),
                Animated.timing(bottomDraw, { toValue: 0, duration: 600, useNativeDriver: false, easing: Easing.out(Easing.ease) }),
                
                // Icon Pop (~0.8s)
                Animated.parallel([
                    Animated.spring(iconScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
                    Animated.timing(iconOpacity, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.quad) })
                ]),

                // Title Reveal (~0.9s)
                Animated.parallel([
                    Animated.timing(titleOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
                    Animated.timing(letterSpacing, { toValue: 4, duration: 900, useNativeDriver: false, easing: Easing.out(Easing.quad) }) 
                    // Note: letterSpacing uses false driver
                ]),

                // Tagline Reveal (~0.5s)
                Animated.parallel([
                    Animated.timing(subOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(subSlide, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) })
                ]),

                // Slight delay to admire, completing exactly to ~4.5s
                Animated.delay(300),

                // Exit Animation
                Animated.parallel([
                    Animated.timing(exitScale, { toValue: 1.1, duration: 400, useNativeDriver: true }),
                    Animated.timing(exitOpacity, { toValue: 0, duration: 400, useNativeDriver: true })
                ])
            ])
        ]).start();

        // Hard unmount / callback redirect strictly at 4.5 seconds
        const timer = setTimeout(() => {
            if (onFinish) onFinish();
        }, 4500);
        return () => clearTimeout(timer);
    }, []);

    // Width interpolation for bottom bar
    const barWidth = progressFill.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
    });

    return (
        <Animated.View style={[s.container, { opacity: exitOpacity, transform: [{ scale: exitScale }] }]}>
            <View style={s.contentWrapper}>
                
                {/* Master SVG Canvas */}
                <View style={s.svgContainer}>
                    <Svg viewBox="0 0 200 200" width="100%" height="100%">
                        <Defs>
                            <LinearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0" stopColor="#F5E27A" />
                                <Stop offset="0.5" stopColor="#C9A84C" />
                                <Stop offset="1" stopColor="#8B6914" />
                            </LinearGradient>
                        </Defs>

                        {/* Triangle Drawing Lines */}
                        <AnimatedLine 
                            x1="100" y1="20" x2="20" y2="160" 
                            stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round"
                            strokeDasharray={leftLineLength}
                            strokeDashoffset={isWeb ? 0 : leftDraw} // Web falls back or processes via state if needed
                        />
                        <AnimatedLine 
                            x1="100" y1="20" x2="180" y2="160" 
                            stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round"
                            strokeDasharray={rightLineLength}
                            strokeDashoffset={isWeb ? 0 : rightDraw} 
                        />
                        <AnimatedLine 
                            x1="20" y1="160" x2="180" y2="160" 
                            stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round"
                            strokeDasharray={bottomLineLength}
                            strokeDashoffset={isWeb ? 0 : bottomDraw} 
                        />
                    </Svg>

                    {/* Internally Layered Icon Group (Ensures NativeDriver Scale works flawlessly) */}
                    <Animated.View style={[s.iconOverlay, {
                        opacity: iconOpacity,
                        transform: [{ scale: iconScale }]
                    }]}>
                        <Svg viewBox="0 0 200 200" width="100%" height="100%">
                            <G>
                                {/* Dollar coin */}
                                <Circle cx="85" cy="100" r="22" stroke="#C9A84C" strokeWidth="2" fill="none" />
                                <SvgText x="85" y="106" fill="#C9A84C" fontSize="16" fontWeight="bold" textAnchor="middle">$</SvgText>
                                {/* Emulated SVG Text using pure path or native mapping is better, but since it's an icon: */}
                                <Line x1="85" y1="85" x2="85" y2="115" stroke="#C9A84C" strokeWidth="2" />
                                <Path d="M92 95 Q85 85 78 95 T85 105 T92 110 Q85 115 78 105" fill="none" stroke="#C9A84C" strokeWidth="2" />
                                
                                {/* Mouse Rect */}
                                <Rect x="107" y="84" width="20" height="30" rx="10" stroke="#C9A84C" strokeWidth="2" fill="none" />
                                <Line x1="117" y1="84" x2="117" y2="99" stroke="#C9A84C" strokeWidth="2" />
                                <Rect x="115" y="88" width="4" height="8" rx="2" fill="#C9A84C" />
                            </G>
                        </Svg>
                    </Animated.View>
                </View>

                {/* DEALSPHEREE Title Component */}
                <Animated.View style={[s.titleBlock, { opacity: titleOpacity }]}>
                    <Animated.Text style={[s.brandTitle, { letterSpacing }]}>
                        DEALSPHEREE
                    </Animated.Text>
                </Animated.View>

                {/* Subtext and Line component */}
                <Animated.View style={[s.subBlock, {
                    opacity: subOpacity,
                    transform: [{ translateY: subSlide }]
                }]}>
                    <View style={s.goldUnderline} />
                    <Text style={s.tagline}>discover  ·  save  ·  explore</Text>
                </Animated.View>

            </View>

            {/* Bottom Global Progress Bar */}
            <View style={s.progressContainer}>
                <Animated.View style={[s.progressBarFill, { width: barWidth }]} />
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
    contentWrapper: {
        alignItems: 'center',
        width: Math.min(width * 0.9, 400),
        height: Math.min(width * 0.9, 400) + 120, // Add space for text
    },
    svgContainer: {
        width: '100%',
        aspectRatio: 1, // 200x200 mapping mapping
        position: 'relative'
    },
    iconOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleBlock: {
        marginTop: -30, // Pull text up slightly under triangle
        height: 40,
        justifyContent: 'center',
    },
    brandTitle: {
        color: '#C9A84C',
        fontSize: 26,
        fontWeight: '800',
        textTransform: 'uppercase',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    subBlock: {
        width: '80%',
        alignItems: 'center',
        marginTop: 5,
    },
    goldUnderline: {
        width: '100%',
        height: 1,
        backgroundColor: '#C9A84C',
        opacity: 0.6,
        marginBottom: 10,
    },
    tagline: {
        color: '#8B6914',
        fontSize: 12,
        letterSpacing: 3,
        fontWeight: '600',
        textTransform: 'lowercase',
    },
    progressContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: 'rgba(201, 168, 76, 0.1)',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#F5E27A',
    }
});

export default SplashScreen;
