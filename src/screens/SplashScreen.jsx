import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Image, Dimensions, Animated, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreenAsync from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from '../../assets/logo.png'; // Using the white wordmark logo as requested

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
    // Animation Values
    const logoScale = useRef(new Animated.Value(0.9)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Hide native splash once React logo is ready to animate
        SplashScreenAsync.hideAsync().catch(() => {});

        // Sequential Animation Flow
        Animated.parallel([
            // 1. Logo Reveal
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 15,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                })
            ]),
            // 2. Shimmer Loop
            Animated.loop(
                Animated.sequence([
                    Animated.timing(shimmerAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(shimmerAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    })
                ])
            )
        ]).start();

        // Total splash duration
        const timer = setTimeout(() => {
            // Exit Animation (Premium Fade Out)
            Animated.timing(logoOpacity, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true
            }).start(() => {
                if (onFinish) onFinish();
            });
        }, 3200);

        return () => clearTimeout(timer);
    }, []);

    const shimmerTranslate = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-width * 0.4, width * 0.4],
    });

    return (
        <View style={styles.container}>
            <StatusBar style="light" translucent backgroundColor="transparent" />
            
            <LinearGradient
                colors={['#395CC6', '#395CC6', '#244191']}
                locations={[0, 0.4, 1]}
                style={styles.background}
            />

            <View style={styles.content}>
                <Animated.View style={[
                    styles.logoContainer,
                    {
                        opacity: logoOpacity,
                        transform: [{ scale: logoScale }]
                    }
                ]}>
                    <Image
                        source={Logo}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>
            </View>

            {/* Bottom Loading Indicator & Version */}
            <View style={styles.footer}>
                <Text style={styles.versionText}>v1.0.1</Text>
                <View style={styles.loadingTrack}>
                    <Animated.View style={[
                        styles.shimmer,
                        { transform: [{ translateX: shimmerTranslate }] }
                    ]}>
                        <LinearGradient
                            colors={['transparent', 'rgba(255,255,255,0.8)', 'transparent']}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </Animated.View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#395CC6',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        width: width * 0.85,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '80%',
        height: '100%',
        objectFit: 'contain',
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    versionText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 12,
    },
    loadingTrack: {
        width: width * 0.5,
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    shimmer: {
        width: '60%',
        height: '100%',
        position: 'absolute',
    },
});
