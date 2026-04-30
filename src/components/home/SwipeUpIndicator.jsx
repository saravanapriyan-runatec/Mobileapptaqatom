import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';

const { height } = Dimensions.get('window');

export default function SwipeUpIndicator({ animatedValue }) {
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(0)).current;

  // Fade in as the dashboard reveal reaches 70% of its target height
  const indicatorOpacity = animatedValue.interpolate({
    inputRange: [height * 0.35, height * 0.5],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -5, // Move UP slightly
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    floatAnimation.start();

    return () => floatAnimation.stop();
  }, [translateY]);

  return (
    <Animated.View 
      style={[styles.container, { opacity: indicatorOpacity }]}
      pointerEvents="none" 
    >
      <Animated.View style={[styles.content, { transform: [{ translateY }] }]}>
        <Text style={styles.text}>{t(tokens.dashboard.swipeUpToClose)}</Text>
        
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20, 
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 13,
    color: '#395CC6',
    fontWeight: '500',
    fontFamily: 'System',
  },
});
