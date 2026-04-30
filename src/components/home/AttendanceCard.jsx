import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Dimensions, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAttendance } from '../../context/AttendanceContext';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';
import Svg, { Path } from 'react-native-svg';
import WorkDurationClock from './WorkDurationClock';

import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// SVG Icon components matching the reference design (from assets)
const CheckInIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path d="M12.4083 2.87508H7.59164C7.2583 2.87508 6.99164 2.60841 6.99164 2.27508C6.99164 1.94175 7.2583 1.66675 7.59164 1.66675H12.4083C12.7416 1.66675 13.0083 1.93341 13.0083 2.26675C13.0083 2.60008 12.7416 2.87508 12.4083 2.87508Z" fill="#F39C12" />
    <Path d="M16.6417 12.5H14.1917C13.1333 12.5 12.5 13.1333 12.5 14.1917V16.6417C12.5 17.7 13.1333 18.3333 14.1917 18.3333H16.6417C17.7 18.3333 18.3333 17.7 18.3333 16.6417V14.1917C18.3333 13.1333 17.7 12.5 16.6417 12.5ZM16.4083 16.2167L15.425 16.7833C15.225 16.9 15.025 16.9583 14.8417 16.9583C14.7 16.9583 14.575 16.925 14.4583 16.8583C14.1917 16.7 14.0417 16.3917 14.0417 15.9833V14.85C14.0417 14.4417 14.1917 14.1333 14.4583 13.975C14.725 13.8167 15.0667 13.85 15.425 14.05L16.4083 14.6167C16.7583 14.825 16.9583 15.1083 16.9583 15.4167C16.9583 15.725 16.7667 16.0083 16.4083 16.2167Z" fill="#F39C12" />
    <Path d="M11.6667 16.6417V14.1917C11.6667 12.6833 12.6834 11.6667 14.1917 11.6667H16.6417C16.8334 11.6667 17.0167 11.6833 17.1917 11.7167C17.2084 11.5167 17.225 11.3167 17.225 11.1083C17.225 7.11667 13.9834 3.875 10 3.875C6.01669 3.875 2.77502 7.11667 2.77502 11.1083C2.77502 15.0917 6.01669 18.3333 10 18.3333C10.7084 18.3333 11.3834 18.2167 12.0334 18.0333C11.8 17.6417 11.6667 17.175 11.6667 16.6417ZM10.625 10.8333C10.625 11.175 10.3417 11.4583 10 11.4583C9.65836 11.4583 9.37502 11.175 9.37502 10.8333V6.66667C9.37502 6.325 9.65836 6.04167 10 6.04167C10.3417 6.04167 10.625 6.325 10.625 6.66667V10.8333Z" fill="#F39C12" />
  </Svg>
);

const CheckOutIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path d="M12.4083 2.87508H7.59164C7.2583 2.87508 6.99164 2.60841 6.99164 2.27508C6.99164 1.94175 7.2583 1.66675 7.59164 1.66675H12.4083C12.7416 1.66675 13.0083 1.93341 13.0083 2.26675C13.0083 2.60008 12.7416 2.87508 12.4083 2.87508Z" fill="#E74C3C" />
    <Path d="M11.6667 16.6417V14.1917C11.6667 12.6833 12.6834 11.6667 14.1917 11.6667H16.6417C16.8334 11.6667 17.0167 11.6833 17.1917 11.7167C17.2084 11.5167 17.225 11.3167 17.225 11.1083C17.225 7.11667 13.9834 3.875 10 3.875C6.01669 3.875 2.77502 7.11667 2.77502 11.1083C2.77502 15.0917 6.01669 18.3333 10 18.3333C10.7084 18.3333 11.3834 18.2167 12.0334 18.0333C11.8 17.6417 11.6667 17.175 11.6667 16.6417ZM10.625 10.8333C10.625 11.175 10.3417 11.4583 10 11.4583C9.65836 11.4583 9.37502 11.175 9.37502 10.8333V6.66667C9.37502 6.325 9.65836 6.04167 10 6.04167C10.3417 6.04167 10.625 6.325 10.625 6.66667V10.8333Z" fill="#E74C3C" />
    <Path d="M16.6417 12.5H14.2C13.1333 12.5 12.5 13.1333 12.5 14.1917V16.6417C12.5 17.7 13.1333 18.3333 14.2 18.3333H16.6417C17.7 18.3333 18.3333 17.7 18.3333 16.6417V14.1917C18.3333 13.1333 17.7 12.5 16.6417 12.5ZM14.9333 16.7167C14.9333 16.9833 14.7167 17.2 14.4417 17.2C14.175 17.2 13.9583 16.9833 13.9583 16.7167V14.1167C13.9583 13.85 14.175 13.6333 14.4417 13.6333C14.7167 13.6333 14.9333 13.85 14.9333 14.1167V16.7167ZM16.875 16.7167C16.875 16.9833 16.6583 17.2 16.3917 17.2C16.125 17.2 15.9 16.9833 15.9 16.7167V14.1167C15.9 13.85 16.125 13.6333 16.3917 13.6333C16.6583 13.6333 16.875 13.85 16.875 14.1167V16.7167Z" fill="#E74C3C" />
  </Svg>
);

const TotalHoursIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path d="M10 1.66675C5.40835 1.66675 1.66669 5.40841 1.66669 10.0001C1.66669 14.5917 5.40835 18.3334 10 18.3334C14.5917 18.3334 18.3334 14.5917 18.3334 10.0001C18.3334 5.40841 14.5917 1.66675 10 1.66675ZM13.625 12.9751C13.5084 13.1751 13.3 13.2834 13.0834 13.2834C12.975 13.2834 12.8667 13.2584 12.7667 13.1917L10.1834 11.6501C9.54169 11.2667 9.06669 10.4251 9.06669 9.68341V6.26675C9.06669 5.92508 9.35002 5.64175 9.69169 5.64175C10.0334 5.64175 10.3167 5.92508 10.3167 6.26675V9.68341C10.3167 9.98341 10.5667 10.4251 10.825 10.5751L13.4084 12.1167C13.7084 12.2917 13.8084 12.6751 13.625 12.9751Z" fill="#395CC6" />
  </Svg>
);

const CheckInBtnIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path d="M12.4083 2.87508H7.59167C7.25833 2.87508 6.99167 2.60841 6.99167 2.27508C6.99167 1.94175 7.25833 1.66675 7.59167 1.66675H12.4083C12.7417 1.66675 13.0083 1.93341 13.0083 2.26675C13.0083 2.60008 12.7417 2.87508 12.4083 2.87508Z" fill="white" />
    <Path d="M16.6417 12.5H14.1917C13.1333 12.5 12.5 13.1333 12.5 14.1917V16.6417C12.5 17.7 13.1333 18.3333 14.1917 18.3333H16.6417C17.7 18.3333 18.3333 17.7 18.3333 16.6417V14.1917C18.3333 13.1333 17.7 12.5 16.6417 12.5ZM16.4083 16.2167L15.425 16.7833C15.225 16.9 15.025 16.9583 14.8417 16.9583C14.7 16.9583 14.575 16.925 14.4583 16.8583C14.1917 16.7 14.0417 16.3917 14.0417 15.9833V14.85C14.0417 14.4417 14.1917 14.1333 14.4583 13.975C14.725 13.8167 15.0667 13.85 15.425 14.05L16.4083 14.6167C16.7583 14.825 16.9583 15.1083 16.9583 15.4167C16.9583 15.725 16.7667 16.0083 16.4083 16.2167Z" fill="white" />
    <Path d="M11.6667 16.6417V14.1917C11.6667 12.6833 12.6833 11.6667 14.1917 11.6667H16.6417C16.8333 11.6667 17.0167 11.6833 17.1917 11.7167C17.2083 11.5167 17.225 11.3167 17.225 11.1083C17.225 7.11667 13.9833 3.875 9.99999 3.875C6.01666 3.875 2.77499 7.11667 2.77499 11.1083C2.77499 15.0917 6.01666 18.3333 9.99999 18.3333C10.7083 18.3333 11.3833 18.2167 12.0333 18.0333C11.8 17.6417 11.6667 17.175 11.6667 16.6417ZM10.625 10.8333C10.625 11.175 10.3417 11.4583 9.99999 11.4583C9.65833 11.4583 9.37499 11.175 9.37499 10.8333V6.66667C9.37499 6.325 9.65833 6.04167 9.99999 6.04167C10.3417 6.04167 10.625 6.325 10.625 6.66667V10.8333Z" fill="white" />
  </Svg>
);

const CheckOutBtnIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path d="M12.4083 2.87508H7.59164C7.2583 2.87508 6.99164 2.60841 6.99164 2.27508C6.99164 1.94175 7.2583 1.66675 7.59164 1.66675H12.4083C12.7416 1.66675 13.0083 1.93341 13.0083 2.26675C13.0083 2.60008 12.7416 2.87508 12.4083 2.87508Z" fill="white" />
    <Path d="M11.6667 16.6417V14.1917C11.6667 12.6833 12.6834 11.6667 14.1917 11.6667H16.6417C16.8334 11.6667 17.0167 11.6833 17.1917 11.7167C17.2084 11.5167 17.225 11.3167 17.225 11.1083C17.225 7.11667 13.9834 3.875 10 3.875C6.01669 3.875 2.77502 7.11667 2.77502 11.1083C2.77502 15.0917 6.01669 18.3333 10 18.3333C10.7084 18.3333 11.3834 18.2167 12.0334 18.0333C11.8 17.6417 11.6667 17.175 11.6667 16.6417ZM10.625 10.8333C10.625 11.175 10.3417 11.4583 10 11.4583C9.65836 11.4583 9.37502 11.175 9.37502 10.8333V6.66667C9.37502 6.325 9.65836 6.04167 10 6.04167C10.3417 6.04167 10.625 6.325 10.625 6.66667V10.8333Z" fill="white" />
    <Path d="M16.6417 12.5H14.2C13.1333 12.5 12.5 13.1333 12.5 14.1917V16.6417C12.5 17.7 13.1333 18.3333 14.2 18.3333H16.6417C17.7 18.3333 18.3333 17.7 18.3333 16.6417V14.1917C18.3333 13.1333 17.7 12.5 16.6417 12.5ZM14.9333 16.7167C14.9333 16.9833 14.7167 17.2 14.4417 17.2C14.175 17.2 13.9583 16.9833 13.9583 16.7167V14.1167C13.9583 13.85 14.175 13.6333 14.4417 13.6333C14.7167 13.6333 14.9333 13.85 14.9333 14.1167V16.7167ZM16.875 16.7167C16.875 16.9833 16.6583 17.2 16.3917 17.2C16.125 17.2 15.9 16.9833 15.9 16.7167V14.1167C15.9 13.85 16.125 13.6333 16.3917 13.6333C16.6583 13.6333 16.875 13.85 16.875 14.1167V16.7167Z" fill="white" />
  </Svg>
);

const InfoCard = ({ IconComponent, label, time }) => {
  const formatSpacedTime = (timeStr) => {
    if (!timeStr || timeStr === '--:--') return '-- : --';
    return timeStr.split(':').join(' : ');
  };

  return (
    <View style={styles.statCard}>
      <View style={styles.iconCircle}>
        <IconComponent size={20} />
      </View>
      <View style={styles.statTextContainer}>
        <Text style={styles.statTime} numberOfLines={1}>{formatSpacedTime(time)}</Text>
        <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );
};

export default function AttendanceCard({ onNavigate }) {
  const { t } = useTranslation();
  const {
    isCheckedIn,
    checkInTime,
    checkOutTime,
    totalHours,
    elapsedSeconds,
    isSessionCompleted,
    isMissedCheckout,
    currentDate,
    SHIFT_DURATION_SECONDS,
    loading,
    formatDuration,
    formatRemainingTime,
    formatDate,
    locationAddress,
    handleCheckIn,
    handleCheckOut,
  } = useAttendance();

  const [isPressing, setIsPressing] = React.useState(false);
  const pressProgress = React.useRef(new Animated.Value(0)).current;
  const hapticTimer = React.useRef(null);

  const startHoldAnimation = () => {
    if (loading || isSessionCompleted || !isCheckedIn) return; // ONLY for check-out
    setIsPressing(true);
    
    // Start Haptic Loop (Ticks)
    hapticTimer.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 200);

    Animated.timing(pressProgress, {
      toValue: 1,
      duration: 1500, // 1.5 seconds to confirm
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        confirmHoldAction();
      }
    });
  };

  const cancelHoldAnimation = () => {
    if (!isCheckedIn) return;
    setIsPressing(false);
    clearInterval(hapticTimer.current);
    Animated.spring(pressProgress, {
      toValue: 0,
      useNativeDriver: false,
      friction: 8,
    }).start();
  };

  const confirmHoldAction = () => {
    clearInterval(hapticTimer.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    handleCheckOut(); // Only handle check-out here
    
    // Reset after a small delay
    setTimeout(() => {
      pressProgress.setValue(0);
      setIsPressing(false);
    }, 500);
  };

  // Helper for spaced digital time
  const formatSpacedTime = (timeStr) => {
    return (timeStr || '--:--').replace(/:/g, ' : ');
  };

  return (
    <View style={styles.container}>
      <View style={styles.dragHandleContainer}>
        <View style={styles.dragHandle}/>
      </View>
      {/* Top Header Row */}
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#1E1F24" />
          <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
        </View>
        <TouchableOpacity onPress={() => onNavigate && onNavigate('attendanceHistory')}>
          <Text style={styles.viewDetailsText}>{t(tokens.actions.viewAll)}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Layout */}
      <View style={styles.contentRow}>
        {/* Left: Pixel-Perfect Clock */}
        <View style={styles.clockWrapper}>
          <WorkDurationClock 
            progress={elapsedSeconds / SHIFT_DURATION_SECONDS}
            durationText={formatSpacedTime(formatDuration(elapsedSeconds))}
            remainingText={formatRemainingTime()}
            size={SCREEN_WIDTH * 0.44} 
          />
        </View>

        {/* Right: Vertical Info Cards */}
        <View style={styles.statsColumn}>
          <InfoCard 
            IconComponent={CheckInIcon} 
            label={t(tokens.home.checkInTime)} 
            time={checkInTime} 
          />
          <InfoCard 
            IconComponent={CheckOutIcon} 
            label={t(tokens.home.checkOutTime)} 
            time={isCheckedIn ? '--:--' : checkOutTime} 
          />
          <InfoCard 
            IconComponent={TotalHoursIcon} 
            label={t(tokens.common.totalHours)} 
            time={totalHours} 
          />
        </View>
      </View>

      {/* Location Bar */}
      <View style={styles.locationContainer}>
        <Ionicons name="location-outline" size={18} color="#1E1F24" />
        <Text style={styles.locationText} numberOfLines={1}>
          {locationAddress || t(tokens.common.officeAddress)}
        </Text>
      </View>

      {/* Primary CTA Button - Hold to Confirm Interaction */}
      <View 
        style={[
          styles.buttonWrapper,
          isSessionCompleted && styles.completedButtonWrapper,
          (loading || isSessionCompleted) && { opacity: 0.7 }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            isCheckedIn ? styles.checkOutButton : styles.checkInButton,
            isSessionCompleted && styles.completedButton,
          ]}
          onPress={(!isCheckedIn && !loading && !isSessionCompleted) ? handleCheckIn : null}
          onPressIn={isCheckedIn ? startHoldAnimation : null}
          onPressOut={isCheckedIn ? cancelHoldAnimation : null}
          disabled={loading || isSessionCompleted}
        >
          {/* Animated Progress Fill Layer */}
          <Animated.View 
             style={[
               styles.progressFill,
               { 
                 width: pressProgress.interpolate({
                   inputRange: [0, 1],
                   outputRange: ['0%', '100%'],
                 }),
                 backgroundColor: '#FFFFFF44', // White translucent for fill
               }
             ]}
          />

          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <View style={styles.buttonInner}>
              {isSessionCompleted ? (
                <Ionicons name="checkmark-circle" size={22} color="white" />
              ) : (
                isCheckedIn ? <CheckOutBtnIcon size={22} /> : <CheckInBtnIcon size={22} />
              )}
              <Text style={styles.buttonText}>
                {isSessionCompleted 
                  ? (isMissedCheckout ? t(tokens.home.missedCheckout) || 'Missed Checkout' : t(tokens.home.workCompleted))
                  : (isCheckedIn ? t(tokens.home.holdToCheckout) : t(tokens.home.checkIn))}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    paddingTop:12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginVertical: 4,
  },
  dragHandleContainer: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  dragHandle: {
    width: 46,
    height: 4,
    borderRadius: 202,
    backgroundColor: '#EFF0F3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1F24',
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#3366FF',
    fontWeight: '600',
    cursor:"pointer"
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  clockWrapper: {
    flex: 1.1, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsColumn: {
    flex: 1, 
    marginLeft: 16,
    gap: 10,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F4F9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1F24',
    letterSpacing: 1,
  },
  statLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F4F9',
    gap: 10,
  },
  locationText: {
    flex: 1,
    color: '#1E1F24',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonWrapper: {
    borderRadius: 14,
    height: 52,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  completedButtonWrapper: {
    elevation: 0,
    shadowOpacity: 0,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
  },
  checkInButton: {
    backgroundColor: '#27AE60',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkOutButton: {
    backgroundColor: '#EB5757',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedButton: {
    backgroundColor: '#9CA3AF',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // Slightly reduced gap
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15, // Slightly reduced font size for a more compact look
    fontWeight: '700',
  },
});
