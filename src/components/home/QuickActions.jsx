import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';
import { useUser } from '../../context/UserContext';
import { FEATURE_CODES } from '../../utils/feature-constants';
import SkeletonLoader from './SkeletonLoader';

const ACTIONS = (t) => [
  {
    id: 'request',
    label: t(tokens.nav.request),
    image: require('../../../assets/Sketchbook 1.png'),
  },
  {
    id: 'loan',
    label: t(tokens.nav.loan),
    image: require('../../../assets/loan 1.png'),
  },
  {
    id: 'payslip',
    label: t(tokens.nav.paySlip),
    image: require('../../../assets/Cashflow 1.png'),
    featureCode: FEATURE_CODES.PAYROLL
  },
  {
    id: 'approvals',
    label: t(tokens.nav.approvals),
    image: require('../../../assets/Approved 3 1.png'),
  },
  {
    id: 'expenses',
    label: t(tokens.nav.expense),
    image: require('../../../assets/Bar Chart 5 1.png'),
  },
];

const AnimatedCard = ({ action, index, onPress, loading }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100, // Staggered entry
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }).start();
    }
  }, [loading, index, fadeAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <SkeletonLoader width={32} height={32} borderRadius={16} />
        <SkeletonLoader width={60} height={12} borderRadius={4} />
      </View>
    );
  }

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { scale: scaleAnim },
          {
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(action.id)}
      >
        <Image source={action.image} style={styles.icon} resizeMode="contain" />
        <Text style={styles.label}>{action.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

import * as Haptics from 'expo-haptics';

export default function QuickActions({ onNavigate }) {
  const { userFeatures, loading } = useUser();

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const localizedActions = ACTIONS(t).filter((action) => {
    if (!action.featureCode) return true;
    return userFeatures.includes(action.featureCode);
  });

  const handlePress = (id) => {
    // Professional Haptic Feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const routeMap = {
      request: 'request',
      loan: 'loan',
      payslip: 'payslip',
      approvals: 'approvals',
      expenses: 'expense',
    };
    if (routeMap[id] && onNavigate) {
      onNavigate(routeMap[id]);
    }
  };

  return (
    <View style={[styles.container, isArabic && { marginTop:45 }]}>
      <Text style={styles.sectionTitle}>{t(tokens.dashboard.quickActions)}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          // Show 4 skeletons while loading features
          [1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.card}>
              <SkeletonLoader width={32} height={32} borderRadius={16} />
              <SkeletonLoader width={60} height={12} borderRadius={4} />
            </View>
          ))
        ) : (
          localizedActions.map((action, index) => (
            <AnimatedCard
              key={action.id}
              action={action}
              index={index}
              onPress={handlePress}
              loading={false}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24, // Increased spacing from dashboard card
    // marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1F24',
    marginBottom: 16,
  },
  scrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFF0F3',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    minWidth: 110,
  },
  icon: {
    width: 32,
    height: 32,
  },
  label: {
    fontSize: 12,
    color: '#1E1F24',
    fontWeight: '500',
  },
});
