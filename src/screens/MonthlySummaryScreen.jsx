import React, { useState, useRef, useEffect, useCallback } from 'react';


import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, Dimensions, Modal, Animated, RefreshControl, PanResponder, Easing } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Toast from 'react-native-toast-message';
import RegularizeModal from '../components/home/RegularizeModal';
import { useRegularization } from '../context/RegularizationContext';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import SwipeableBottomSheet from '../components/common/SwipeableBottomSheet';
import AuthService from '../../Services/AuthService';
import ProfileServices from '../../Services/API/ProfileServices';
import { get } from 'lodash';
import moment from 'moment';
import SkeletonLoader from '../components/home/SkeletonLoader';

const { height, width } = Dimensions.get('window');

// Mock Data Helper
const getMockDayDetails = (date, status) => {
  const base = {
    date: date,
    status: status,
    shift: 'General Shift',
    gracePeriod: '15 Minutes',
    location: 'Head Office, NY',
    address: '5th Avenue, Manhattan, New York, 10001',
  };

  if (status === 'present') {
    return { ...base, checkIn: '09:00 AM', checkOut: '06:00 PM', duration: '09h 30m' };
  } else if (status === 'late') {
    return { ...base, checkIn: '09:45 AM', checkOut: '06:00 PM', duration: '08h 15m' };
  } else if (status === 'absent') {
    return { ...base, checkIn: 'Absent', checkOut: 'Absent', duration: '--' };
  } else if (status === 'leave') {
    return { ...base, checkIn: 'Leave', checkOut: 'Leave', duration: '--' };
  }
  return base;
};

const DayDetailsSheet = ({ visible, onClose, data, hasPrev, hasNext, onPrev, onNext, onRequestRegularize }) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      slideAnim.setValue(height);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 120
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad)
      }).start(() => setShowModal(false));
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0
          }).start();
        }
      },
    })
  ).current;

  if (!data || !showModal) return null;

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'present': return '#00BA00';
      case 'absent': return '#E74C3C';
      case 'leave': 
      case 'permission': return '#62636C';
      case 'late': return '#FFA000';
      default: return '#62636C';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'present': return 'rgba(0, 186, 0, 0.1)';
      case 'absent': return 'rgba(231, 76, 60, 0.1)';
      case 'leave': return 'rgba(98, 99, 108, 0.1)';
      case 'late': return 'rgba(255, 160, 0, 0.1)';
      default: return 'rgba(98, 99, 108, 0.1)';
    }
  };

  const isBlurred = data.status === 'absent' || data.status === 'leave';
  const statusColor = getStatusColor(data.status);
  const statusBg = getStatusBg(data.status);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showModal}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onClose} 
        />
        <Animated.View 
          style={[
            styles.sheetContent,
            { transform: [{ translateY: slideAnim }] }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={styles.dateRow}>
                <Text style={styles.modalDate} numberOfLines={1}>
                  {(() => {
                    const daysShort = [t(tokens.days.sun), t(tokens.days.mon), t(tokens.days.tue), t(tokens.days.wed), t(tokens.days.thu), t(tokens.days.fri), t(tokens.days.sat)];
                    const monthsShort = [t(tokens.months.jan), t(tokens.months.feb), t(tokens.months.mar), t(tokens.months.apr), t(tokens.months.may), t(tokens.months.jun), t(tokens.months.jul), t(tokens.months.aug), t(tokens.months.sep), t(tokens.months.oct), t(tokens.months.nov), t(tokens.months.dec)];
                    return `${daysShort[data.date.getDay()]}, ${data.date.getDate()} ${monthsShort[data.date.getMonth()]} ${data.date.getFullYear()}`;
                  })()}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                  <Text style={[styles.statusText, { color: statusColor }]} numberOfLines={1} ellipsizeMode="tail">
                    {data.status === 'present' ? t(tokens.weeklySummary.present) : 
                     data.status === 'absent' ? t(tokens.weeklySummary.absent) : 
                     data.status === 'late' ? t(tokens.weeklySummary.late) : 
                     data.status === 'leave' ? t(tokens.weeklySummary.leave) : 
                     data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.durationText}>{data.duration || '--'}</Text>
            </View>
            <View style={styles.modalNav}>
              <TouchableOpacity 
                style={[styles.modalNavBtn, !hasPrev && { opacity: 0.5 }]} 
                disabled={!hasPrev} 
                onPress={onPrev}
              >
                <Ionicons name="chevron-back" size={20} color="#1E1F24" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalNavBtn, !hasNext && { opacity: 0.5 }]} 
                disabled={!hasNext} 
                onPress={onNext}
              >
                <Ionicons name="chevron-forward" size={20} color="#1E1F24" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.containercard}>
            <View style={styles.detailCard}>
              <Text style={styles.cardTitle}>{t(tokens.weeklySummary.timing)}</Text>
              <View style={styles.cardRow}>
                <View style={styles.cardCol}>
                  <Text style={styles.cardLabel}>{t(tokens.weeklySummary.checkIn)}</Text>
                  <Text style={[
                    styles.cardValue, 
                    data.status === 'late' && { color: '#F39C12' },
                    isBlurred && { color: statusColor }
                  ]}>
                    {data.checkIn}
                  </Text>
                </View>
                <View style={styles.verticalLine} />
                <View style={styles.cardCol}>
                  <Text style={styles.cardLabel}>{t(tokens.weeklySummary.checkOut)}</Text>
                  <Text style={[
                    styles.cardValue,
                    isBlurred && { color: statusColor }
                  ]}>
                    {data.checkOut}
                  </Text>
                </View>
              </View>
              {isBlurred && (
                <BlurView intensity={50} style={StyleSheet.absoluteFill} tint="light" />
              )}
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.cardTitle}>{t(tokens.weeklySummary.shiftDetails)}</Text>
              <View style={styles.cardRow}>
                <View style={styles.cardCol}>
                  <Text style={styles.cardLabel}>{t(tokens.weeklySummary.shiftName)}</Text>
                  <Text style={styles.cardValue}>{data.shift}</Text>
                </View>
                <View style={styles.verticalLine} />
                <View style={styles.cardCol}>
                  <Text style={styles.cardLabel}>{t(tokens.weeklySummary.totalBreakTime)}</Text>
                  <Text style={styles.cardValue}>{data.totalBreakTime || '0'} {t(tokens.common.minutes)}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.parentblur}>
              <View style={[styles.blurOverlay, { borderColor: statusColor, backgroundColor: statusBg }]}>
                <Ionicons name="alert-circle-outline" size={20} color={statusColor} />
                <Text style={[styles.blurTitle, { color: statusColor }]}>
                  {data.status === 'present' ? t(tokens.weeklySummary.present) : data.status === 'absent' ? t(tokens.weeklySummary.absent) : data.status === 'late' ? t(tokens.weeklySummary.late) : t(tokens.weeklySummary.leave)}
                </Text>
                <Text style={[styles.blurSubtitle, { color: statusColor }]}>
                  {data.status === 'absent' ? t(tokens.weeklySummary.noLogsOnThisDay) : data.status}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>{t(tokens.weeklySummary.close)}</Text>
            </TouchableOpacity>
            {data.canRegularize && (
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={() => {
                  onClose();
                  // iOS fix: delay opening next modal to ensure current one unmounts
                  setTimeout(() => {
                    onRequestRegularize();
                  }, 400);
                }}
              >
                <Text style={styles.primaryButtonText}>{t(tokens.home.requestRegularize)}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const formatTimeStr = (timeStr) => {
  if (!timeStr) return '--:--';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  const [h, m] = timeStr.split(':');
  const hh = parseInt(h);
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const hour12 = hh % 12 || 12;
  return `${hour12}:${m} ${suffix}`;
};

export default function MonthlySummaryScreen({ onBack }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isRegularizeVisible, setIsRegularizeVisible] = useState(false);
  
  const { addRequest } = useRegularization();

  const [employeeData, setEmployeeData] = useState(null);
  const [employeeCode, setEmployeeCode] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [shiftMap, setShiftMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [monthStats, setMonthStats] = useState({ present: 0, absent: 0, late: 0, leave: 0, remainingLeave: 0, usedLeave: 0 });


  useEffect(() => {
    fetchMonthAttendance();
  }, [currentDate]);


  const fetchMonthAttendance = async () => {
    try {
      setLoading(true);
      let emp = employeeData;
      let code = employeeCode;
      if (!emp || !code) {
        const authUserId = await AuthService.getUserId();
        if (!authUserId) return;
        const userDetails = await ProfileServices.getUserDetailsData(authUserId);
        const username = userDetails?.username;
        if (!username) return;
        code = username;
        setEmployeeCode(username);
        emp = await ProfileServices.getEmployeeDetailsData(username);
        setEmployeeData(emp);
      }

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const payload = {
        emp_code: code,
        emp_id: emp.id,
        start_date: formatDate(firstDay),
        end_date: formatDate(lastDay)
      };

      const [attendanceResponse, shiftResponse] = await Promise.all([
        ProfileServices.getAttendanceSummary(payload),
        ProfileServices.getEmployeeShiftDetails(payload)
      ]);
      console.log("✅ [MONTHLY ATTENDANCE] Response:", JSON.stringify(attendanceResponse, null, 2));
      console.log("✅ [MONTHLY SHIFT] Response:", JSON.stringify(shiftResponse, null, 2));

      const results = get(attendanceResponse, 'employee_attendance', []);
      setAttendanceData(results);

      const shifts = Array.isArray(shiftResponse) ? shiftResponse : (shiftResponse?.results || []);
      const newShiftMap = {};
      shifts.forEach(s => {
        if (s.date) {
          const dKey = moment(s.date).locale('en').format('YYYY-MM-DD');
          newShiftMap[dKey] = s;
        }
      });
      setShiftMap(newShiftMap);

      const getStat = (res, key) => {
        const val = get(res, key) ?? get(res, `summary.${key}`);
        return val !== undefined ? Number(val) : 0;
      };

      setMonthStats({
        present: getStat(attendanceResponse, 'total_present_days'),
        absent: getStat(attendanceResponse, 'total_absent_days'),
        late: getStat(attendanceResponse, 'total_late_days'),
        leave: getStat(attendanceResponse, 'total_leave_days'),
        remainingLeave: get(attendanceResponse, 'remaining_leave', 0),
        usedLeave: get(attendanceResponse, 'used_leave', 0)
      });

    } catch (error) {
      console.error("Error fetching monthly attendance:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchMonthAttendance();
  }, [currentDate]);


  const handleRegularizeSubmit = async (data) => {
    try {
      await addRequest(data);
      setIsRegularizeVisible(false);
      Toast.show({
        type: 'success',
        text1: t(tokens.dashboard.regularizationSubmitted),
        text2: t(tokens.dashboard.regularizationSuccessMsg)
      });
      // Refresh data immediately
      fetchMonthAttendance();

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t(tokens.common.error) || 'Error',
        text2: error?.errorResponse?.error || error?.message || 'Failed to submit regularization'
      });
    }
  };

  const daysOfWeek = [
    t(tokens.days.sun).charAt(0), t(tokens.days.mon).charAt(0), t(tokens.days.tue).charAt(0), 
    t(tokens.days.wed).charAt(0), t(tokens.days.thu).charAt(0), t(tokens.days.fri).charAt(0), 
    t(tokens.days.sat).charAt(0)
  ];

  const handleDayPress = (day, status) => {
    if (!day || status === 'none' || status === 'off') return;
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = moment(selectedDate).locale('en').format('YYYY-MM-DD');
    const dayAttendance = attendanceData.find(item => moment(item.date).locale('en').format('YYYY-MM-DD') === dateKey);
    const shiftInfo = shiftMap[dateKey];
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) return; 

    setSelectedDayData({
      date: selectedDate,
      status: status === 'selected' ? 'present' : status,
      shift: shiftInfo?.shift?.name || shiftInfo?.shift_name || 'General Shift',
      totalBreakTime: shiftInfo?.break_times?.reduce((sum, b) => sum + (b.duration || 0), 0) || 0,
      location: 'Head Office, NY',
      address: '5th Avenue, Manhattan, New York, 10001',
      checkIn: dayAttendance?.check_in ? formatTimeStr(dayAttendance.check_in) : (status === 'absent' ? t(tokens.common.absent) : status === 'leave' ? t(tokens.common.leave) : '--'),
      checkOut: dayAttendance?.check_out ? formatTimeStr(dayAttendance.check_out) : (status === 'absent' ? t(tokens.common.absent) : status === 'leave' ? t(tokens.common.leave) : '--'),
      duration: dayAttendance?.total_hours || '--',
      canRegularize: dayAttendance?.regularization === true
    });
    setIsSheetVisible(true);
  };

  const getMonthData = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startingDayIndex = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < startingDayIndex; i++) days.push({ day: null, status: 'none' });

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        const apiDay = attendanceData.find(item => {
          if (!item.date) return false;
          const itemDateFormatted = moment(item.date).locale('en').format('YYYY-MM-DD');
          return itemDateFormatted === dateStr;
        });

        let status = 'none';
        if (apiDay) {
          const rawStatus = (apiDay.status || '').toLowerCase();
          // Map various leave-related strings to a general category for coloring, but keep original for text
          const isLeaveRelated = rawStatus.includes('leave') || 
                                rawStatus.includes('permission') || 
                                ['sl', 'pl', 'cl', 'al', 'ml'].includes(rawStatus);
          
          if (isLeaveRelated) {
            status = apiDay.status; // Keep original descriptive status
          } else {
            status = rawStatus;
          }
        } else {
          const currentDayDate = new Date(year, month, i);
          if (currentDayDate.getDay() === 0 || currentDayDate.getDay() === 6) {
            status = 'off';
          }
        }
        days.push({ day: i, status });
    }
    return days;
  };

  const days = getMonthData(currentDate);
  const changeMonth = (increment) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
  const canGoNext = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1) <= new Date();

  const validDays = days.filter(d => d.day !== null && d.status !== 'none' && d.status !== 'off');
  const currentDayNum = selectedDayData ? selectedDayData.date.getDate() : null;
  const currentValidIndex = validDays.findIndex(d => d.day === currentDayNum);
  const hasPrevDay = currentValidIndex > 0;
  const hasNextDay = currentValidIndex !== -1 && currentValidIndex < validDays.length - 1;

  const handlePrevDay = () => hasPrevDay && handleDayPress(validDays[currentValidIndex - 1].day, validDays[currentValidIndex - 1].status);
  const handleNextDay = () => hasNextDay && handleDayPress(validDays[currentValidIndex + 1].day, validDays[currentValidIndex + 1].status);

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'present': return '#00BA00';
      case 'absent': return '#E74C3C';
      case 'leave': 
      case 'permission':
        return '#DEDFE4'; // Lighter Gray as seen in Weekly Summary
      case 'late': return '#FFA000';
      case 'off': return '#DEDFE4';
      case 'selected': return '#FFFFFF';
      default: 
        // If there's any status string that isn't recognized, show it as gray instead of transparent
        if (s && s !== 'none' && s !== 'off') return '#DEDFE4';
        return 'transparent';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#C6D2FD', '#FFFFFF']} locations={[0, 0.3]} style={styles.background} />

      {/* Fixed Header & Stats Card */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1F24" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t(tokens.monthlySummary.title)}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#4169E1' }]}>{String(monthStats.leave).padStart(2, '0')} <Text style={styles.unitText}>{t(tokens.common.days)}</Text></Text>
              <Text style={styles.statLabel}>{t(tokens.monthlySummary.leave)}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#E74C3C' }]}>{String(monthStats.absent).padStart(2, '0')} <Text style={styles.unitText}>{t(tokens.common.days)}</Text></Text>
              <Text style={styles.statLabel}>{t(tokens.monthlySummary.absent)}</Text>
            </View>
          </View>
          <View style={styles.horizontalDivider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#00BA00' }]}>{String(monthStats.present).padStart(2, '0')} <Text style={styles.unitText}>{t(tokens.common.days)}</Text></Text>
              <Text style={styles.statLabel}>{t(tokens.monthlySummary.present)}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FFA000' }]}>{String(monthStats.late).padStart(2, '0')} <Text style={styles.unitText}>{t(tokens.common.days)}</Text></Text>
              <Text style={styles.statLabel}>{t(tokens.monthlySummary.late)}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.monthTitle}>
                {(() => {
                  const monthsFull = [
                    t(tokens.months.january), t(tokens.months.february), t(tokens.months.march), 
                    t(tokens.months.april), t(tokens.months.mayFull), t(tokens.months.june), 
                    t(tokens.months.july), t(tokens.months.august), t(tokens.months.september), 
                    t(tokens.months.october), t(tokens.months.november), t(tokens.months.december)
                  ];
                  return `${monthsFull[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
                })()}
              </Text>
            <View style={styles.navButtons}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
                <Ionicons name="chevron-back" size={20} color="#1E1F24" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => changeMonth(1)} style={[styles.navButton, !canGoNext && styles.disabledNavButton]} disabled={!canGoNext}>
                <Ionicons name="chevron-forward" size={20} color={canGoNext ? "#1E1F24" : "#B0B0B0"} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.daysHeader}>
            {daysOfWeek.map((day, index) => <Text key={index} style={styles.dayLabel}>{day}</Text>)}
          </View>

          <View style={styles.daysGrid}>
            {loading ? (
              // Professional Skeleton Loader for Calendar
              Array.from({ length: 35 }).map((_, index) => (
                <View key={index} style={styles.dayCell}>
                  <SkeletonLoader width={32} height={32} borderRadius={16} />
                  <SkeletonLoader width={8} height={8} borderRadius={4} style={{ marginTop: 4 }} />
                </View>
              ))
            ) : (
              days.map((item, index) => (
                <TouchableOpacity key={index} style={styles.dayCell} onPress={() => handleDayPress(item.day, item.status)} disabled={!item.day || item.status === 'off' || item.status === 'none'}>
                  {item.day && (
                    <>
                      <View style={[styles.dayNumberContainer, item.status === 'selected' && styles.selectedDayContainer]}><Text style={[styles.dayNumber, item.status === 'selected' && styles.selectedDayNumber]}>{item.day}</Text></View>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    </>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <DayDetailsSheet visible={isSheetVisible} onClose={() => setIsSheetVisible(false)} data={selectedDayData} hasPrev={hasPrevDay} hasNext={hasNextDay} onPrev={handlePrevDay} onNext={handleNextDay} onRequestRegularize={() => setIsRegularizeVisible(true)} />
      <RegularizeModal visible={isRegularizeVisible} onClose={() => setIsRegularizeVisible(false)} date={selectedDayData?.date} onSubmit={handleRegularizeSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: height },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-start', 
    marginBottom: 24,
  },
  backButton: { 
    padding: 12, 
    paddingLeft:-12
  },
  headerTitle: { 
    flex: 1,
    textAlign: 'start',
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1E1F24',
  },
  statsCard: { backgroundColor: 'rgba(255, 255, 255,1)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, overflow: 'hidden' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { flex: 1, paddingVertical: 12, paddingHorizontal: 8,backgroundColor:"rgba(255, 255, 255,1)" },
  verticalDivider: { width: 1, backgroundColor: '#F0F2F5' },
  horizontalDivider: { height: 1, backgroundColor: '#F0F2F5' },
  statValue: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  unitText: { fontSize: 12, fontWeight: '400', color: '#62636C' },
  statLabel: { fontSize: 13, color: '#62636C' },
  calendarContainer: {},
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  monthTitle: { fontSize: 16, fontWeight: '700', color: '#1E1F24' },
  navButtons: { flexDirection: 'row', gap: 12 },
  navButton: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F7F8F9', justifyContent: 'center', alignItems: 'center' },
  disabledNavButton: { opacity: 0.5 },
  daysHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 8 },
  dayLabel: { width: 32, textAlign: 'center', fontSize: 12, color: '#62636C', fontWeight: '500' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', rowGap: 16 },
  dayCell: { width: '14.28%', alignItems: 'center', justifyContent: 'center', height: 50 },
  dayNumberContainer: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  selectedDayContainer: { backgroundColor: '#4169E1' },
  dayNumber: { fontSize: 14, color: '#1E1F24', fontWeight: '500' },
  selectedDayNumber: { color: '#FFFFFF', fontWeight: '600' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: height * 0.9,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DEDFE4',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  modalDate: { fontSize: 16, fontWeight: '700', color: '#1E1F24' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  durationText: { fontSize: 13, color: '#62636C' },
  modalNav: { flexDirection: 'row', gap: 8 },
  modalNavBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  containercard: {
    flexDirection: 'column',
    gap: 10,
    position:"relative"
  },
  detailCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFF0F3',
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1E1F24', marginBottom: 16 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardCol: { flex: 1 },
  cardLabel: { fontSize: 13, color: '#9E9E9E', marginBottom: 8 },
  cardValue: { fontSize: 14, fontWeight: '600', color: '#1E1F24' },
  verticalLine: { width: 1, backgroundColor: '#F0F2F5', marginHorizontal: 16 },
 parentblur:{
     position: 'absolute',
    top:0,
    left:0,
    zIndex: 10,
    backgroundColor: 'rgba(253, 253, 253, 0.9)',
    width:"100%",
    height:"100%",
    padding:20,
    display:"flex",
    justifyContent:"center",
    alignItems:"center"

  },
  blurOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: 'hidden',
    width: "85%",
    height: "50%"
  },
  blurTitle: { fontSize: 14, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  blurSubtitle: { fontSize: 12, textAlign: 'center', paddingHorizontal: 16 },
  actionButtons: { flexDirection: 'row', gap: 16, marginTop: 16 },
  closeButton: { flex: 1, height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#DEDFE4', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  closeButtonText: { fontSize: 14, fontWeight: '600', color: '#1E1F24' },
  primaryButton: { flex: 1, height: 48, borderRadius: 8, backgroundColor: '#4169E1', justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});
