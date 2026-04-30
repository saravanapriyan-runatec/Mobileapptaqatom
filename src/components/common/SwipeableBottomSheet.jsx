import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Dimensions, Modal, Animated, PanResponder, KeyboardAvoidingView, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { height } = Dimensions.get('window');

const SwipeableBottomSheet = ({ visible, onClose, children, contentStyle, extraContent }) => {
  const [showModal, setShowModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(height);
      setShowModal(true);
      
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 180,
        mass: 0.8,
      }).start();
    } else if (showModal) {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => setShowModal(false));
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Capture swipe down more reliably but ALLOW child scrollviews to work
        return gestureState.dy > 12 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        slideAnim.stopAnimation((value) => {
          slideAnim.setOffset(value);
          slideAnim.setValue(0);
        });
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        slideAnim.flattenOffset();
        
        if (gestureState.dy > 100 || gestureState.vy > 0.6) {
          onClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            damping: 25,
            stiffness: 200,
          }).start();
        }
      },
    })
  ).current;

  if (!showModal && !visible) return null;

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={showModal}
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: slideAnim.interpolate({ inputRange: [0, height], outputRange: [1, 0] }) }]}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          <LinearGradient 
            colors={['rgba(30, 31, 36, 0.47)', 'rgba(30, 31, 36, 0.20)']}
            locations={[0.3, 1]}
            style={StyleSheet.absoluteFill} 
          />
        </Animated.View>
        
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          onPress={onClose} 
          activeOpacity={1} 
        />
        
        <Animated.View 
          style={[
            styles.modalContent, 
            contentStyle,
            { 
              transform: [{ translateY: slideAnim }],
            }
          ]}
          {...panResponder.panHandlers}
        >
          {children}
        </Animated.View>
        {/* Render extra content (like Toast) directly in Modal but outside animated content */}
        {extraContent && (
          <View 
            style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} 
            pointerEvents="box-none"
          >
            {extraContent}
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 8,
    overflow: 'hidden',
  },
});

export default SwipeableBottomSheet;
