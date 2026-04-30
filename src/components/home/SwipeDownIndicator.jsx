import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';

const { height } = Dimensions.get('window');

export default function SwipeDownIndicator({ onPress, animatedValue, isOpen }) {
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(0)).current;

  // Create a synchronized transition value based on the dashboard's physical position
  const syncAnim = animatedValue ? animatedValue.interpolate({
    inputRange: [0, height * 0.3, height * 0.4, height * 0.7],
    outputRange: [0, 0, 1, 1], // Quick transition in the middle of the swipe
    extrapolate: 'clamp'
  }) : new Animated.Value(isOpen ? 1 : 0);

  // When opening, we don't fade out completely, we just transition to the new state
  const indicatorOpacity = animatedValue ? animatedValue.interpolate({
    inputRange: [0, 50, height * 0.6, height * 0.7],
    outputRange: [1, 0.8, 0.8, 1],
    extrapolate: 'clamp'
  }) : 1;

  const rotateX = syncAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 5,
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
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={[styles.content, { 
        transform: [{ translateY }],
        opacity: indicatorOpacity 
      }]}>
        <Animated.View style={{ transform: [{ rotate: rotateX }] }}>
          <Ionicons 
            name="chevron-down-outline" 
            size={16} 
            color="#395CC6" 
          />
        </Animated.View>
        <View style={styles.textContainer}>
          <Animated.Text style={[styles.text, {
            opacity: syncAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 0, 0] }),
            position: 'absolute',
            width: '100%',
          }]}>
            {t(tokens.dashboard.swipeDown)}
          </Animated.Text>
          <Animated.Text style={[styles.text, {
            opacity: syncAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] }),
            position: 'relative',
            width: '100%',
          }]}>
            {t(tokens.dashboard.swipeUpToClose)}
          </Animated.Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 180, // Prevent jumping
  },
  text: {
    fontSize: 13,
    color: '#395CC6', 
    fontWeight: '600',
    textAlign: 'center',
  },
});
