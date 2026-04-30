import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * A reusable Skeleton Loader component with a shimmer effect.
 * Perfect for showing placeholders while content is loading.
 */
export default function SkeletonLoader({ width, height, borderRadius = 8, style }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Handle percentage widths for animations
  const numericWidth = typeof width === 'number' ? width : SCREEN_WIDTH;
  const numericHeight = typeof height === 'number' ? height : 50;

  useEffect(() => {
    const startShimmer = () => {
      shimmerAnim.setValue(0);
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };

    startShimmer();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-numericWidth * 1.5, numericWidth * 1.5],
  });

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            width: numericWidth * 0.8,
            height: numericHeight * 2.5, // Taller to account for rotation
            opacity,
            transform: [
              { translateX },
              { rotate: '25deg' }, // Modern diagonal shimmer
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F4F7', // Softer bone color
    overflow: 'hidden',
  },
  shimmer: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    position: 'absolute',
    top: -50,
    left: 0,
  },
});
