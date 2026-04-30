import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const StaggeredEntrance = ({ children, delay = 100, duration = 500, index = 0, disabled = false }) => {
  const fadeAnim = useRef(new Animated.Value(disabled ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(disabled ? 0 : 20)).current;

  useEffect(() => {
    if (disabled) return;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: duration,
        delay: index * delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        delay: index * delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, delay, duration, disabled]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
};

export default StaggeredEntrance;
