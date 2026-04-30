import React, { useState, useRef, useEffect, useCallback } from 'react';


import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, Dimensions, Modal, Animated, PanResponder, RefreshControl } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Toast from 'react-native-toast-message';
import { DatePickerModal } from 'react-native-paper-dates';
import RegularizeModal from '../components/home/RegularizeModal';
import { useRegularization } from '../context/RegularizationContext';

import GlassHeader from '../components/home/GlassHeader';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import AuthService from '../../Services/AuthService';
import ProfileServices from '../../Services/API/ProfileServices';
import { get } from 'lodash';
import moment from 'moment';
import SkeletonLoader from '../components/home/SkeletonLoader';

const { height } = Dimensions.get('window');

// Mock Data Helper for Day Details
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

const AnimatedListItem = ({ children, index }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 400,
      delay: index * 60, // Faster stagger for long lists
      useNativeDriver: true,
    }).start();
  }, [index]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  return (
    <Animated.View style={{ opacity: animatedValue, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

const DayDetailsSheet = ({ visible, onClose, data, onRequestRegularize }) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      // Reset position
      slideAnim.setValue(height);
      pan.setValue({ x: 0, y: 0 });

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true
      }).start(() => setShowModal(false));
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Only capture vertical downward drags if not already captured
        return gestureState.dy > 5;
      },
      onPanResponderGrant: () => {
        // Stop any running animations and set offset
        slideAnim.stopAnimation((value) => {
          slideAnim.setOffset(value);
          slideAnim.setValue(0);
        });
      },
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        slideAnim.flattenOffset(); // Merge offset into value
        if (gestureState.dy > 100) { // Dragged down enough
          onClose(); // Parent handles closing state
        } else {
          // Spring back
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
    switch (status) {
      case 'present': return '#00BA00';
      case 'absent': return '#E74C3C';
      case 'leave': return '#4169E1';
      case 'late': return '#F39C12';
      default: return '#62636C';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'present': return 'rgba(46, 204, 64, 0.1)';
      case 'absent': return 'rgba(231, 76, 60, 0.1)';
      case 'leave': return 'rgba(65, 105, 225, 0.1)';
      case 'late': return 'rgba(243, 156, 18, 0.1)';
      default: return 'rgba(98, 99, 108, 0.1)';
    }
  };

  const isBlurred = data.status.toLowerCase().includes('absent') || data.status.toLowerCase().includes('leave') || ['sl', 'pl', 'cl', 'al', 'ml'].includes(data.status.toLowerCase());
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
        {/* Dark Blurry Background */}
        <View style={StyleSheet.absoluteFill}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          <LinearGradient
            colors={['rgba(30, 31, 36, 0.47)', 'rgba(30, 31, 36, 0.10)']}
            locations={[0.37, 0.82]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />

        <Animated.View
          style={[
            styles.sheetContent,
            { transform: [{ translateY: slideAnim }] }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.modalHandle} />

          {/* Header */}
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
                <View style={[styles.statusBadge, { backgroundColor: statusBg, flexShrink: 1 }]}>
                  <Text style={[styles.statusText, { color: statusColor }]} numberOfLines={1} ellipsizeMode="tail">
                    {data.status.toLowerCase().includes('present') ? t(tokens.weeklySummary.present) :
                      data.status.toLowerCase().includes('absent') ? t(tokens.weeklySummary.absent) :
                        data.status.toLowerCase().includes('late') ? t(tokens.weeklySummary.late) :
                          data.status.toLowerCase().includes('leave') ? t(tokens.weeklySummary.leave) :
                            data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.durationText}>{data.duration || '--'}</Text>
            </View>
            {/* No navigation needed for weekly summary as per request, but can keep empty view or remove */}
          </View>
          <View style={styles.containercard}>
            {/* Timing Card */}
            <View style={styles.detailCard}>
              <Text style={styles.cardTitle}>{t(tokens.weeklySummary.timing)}</Text>
              <View style={styles.cardRow}>
                <View style={styles.cardCol}>
                  <Text style={styles.cardLabel}>{t(tokens.weeklySummary.checkIn)}</Text>
                  <Text style={[
                    styles.cardValue,
                    data.status === 'late' && { color: '#F39C12' },
                    isBlurred && { color: statusColor } // Show status text for blurred state preview before blur
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

            {/* Shift Details */}
            <View style={styles.detailCard}>
              <Text style={styles.cardTitle}>{t(tokens.weeklySummary.shiftDetails)}</Text>
              <View style={styles.cardRow}>
                <View style={styles.cardCol}>
                  <Text style={styles.cardLabel}>{t(tokens.weeklySummary.shiftName)}</Text>
                  <Text style={styles.cardValue}>{data.shift}</Text>
                </View>
                <View style={styles.verticalLine} />
                <View style={styles.cardCol}>
                  <Text style={styles.cardLabel}>{t(tokens.weeklySummary.totalBreakTime) || 'Total Break Time'}</Text>
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
                  {data.status.toLowerCase().includes('absent') ? t(tokens.weeklySummary.noLogsOnThisDay) : data.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Location Details */}
          {/* <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>{t(tokens.weeklySummary.locationDetails)}</Text>
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <Ionicons name="location-outline" size={20} color="#62636C" />
              </View>
              <View>
                <Text style={styles.locationName}>{data.location}</Text>
                <Text style={styles.locationAddress}>{data.address}</Text>
              </View>
            </View>
            {isBlurred && (
               <BlurView intensity={50} style={StyleSheet.absoluteFill} tint="light" />
            )}
          </View> */}

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

export default function WeeklySummaryScreen({ onBack }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const headerHeight = Platform.OS === 'ios' ? 44 : 12; // Standard header heights
  const paddingTop = insets.top + headerHeight;

  // Use raw english strings for internal state/filtering, translating only for display
  const [selectedFilter, setSelectedFilter] = useState('This Week');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(new Date());

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
  const [stats, setStats] = useState({ totalHours: '0h 0m', present: 0, late: 0 });


  useEffect(() => {
    fetchEmployeeAndData();
  }, [selectedFilter, customStartDate]);


  const fetchEmployeeAndData = async () => {
    try {
      setLoading(true);
      let emp = employeeData;
      let code = employeeCode;
      if (!emp || !code) {
        const authUserId = await AuthService.getUserId();
        if (!authUserId) return;
        const userDetails = await ProfileServices.getUserDetailsData(authUserId);
        // console.log("getUserDetailsData response (Weekly):", userDetails);
        const username = userDetails?.username;
        if (!username) return;
        code = username;
        setEmployeeCode(username);
        emp = await ProfileServices.getEmployeeDetailsData(username);
        // console.log("getEmployeeDetailsData response (Weekly):", emp);
        setEmployeeData(emp);
      }

      const { start, end } = getRangeDates();
      const payload = {
        emp_code: code,
        emp_id: emp.id,
        start_date: start,
        end_date: end
      };

      // console.log("Weekly API Request - Unified Payload:", JSON.stringify(payload, null, 2));

      const [attendanceResponse, shiftResponse] = await Promise.all([
        ProfileServices.getAttendanceSummary(payload),
        ProfileServices.getEmployeeShiftDetails(payload)
      ]);

      console.log("✅ [WEEKLY ATTENDANCE] Response:", JSON.stringify(attendanceResponse, null, 2));
      console.log("✅ [WEEKLY SHIFT] Response:", JSON.stringify(shiftResponse, null, 2));

      const results = get(attendanceResponse, 'employee_attendance', []);
      setAttendanceData(results);

      // Create a map of date -> shift info for quick lookup
      const shiftDataList = Array.isArray(shiftResponse) ? shiftResponse : (shiftResponse?.results || []);
      // console.log(`📡 [WEEKLY] Mapping ${shiftDataList.length} shifts to map.`);
      const newShiftMap = {};
      shiftDataList.forEach(s => {
        if (s.date) {
          const dKey = moment(s.date).locale('en').format('YYYY-MM-DD');
          newShiftMap[dKey] = s;
        }
      });
      setShiftMap(newShiftMap);
      // console.log("Weekly Shift Map Keys (moment):", Object.keys(newShiftMap));
      if (shiftDataList.length > 0) {
        // console.log("Weekly Shift [0] Date Raw:", shiftDataList[0].date);
        // console.log("Weekly Shift [0] Formatted:", moment(shiftDataList[0].date).locale('en').format('YYYY-MM-DD'));
      }

      const getStat = (res, key) => {
        const val = get(res, key) ?? get(res, `summary.${key}`);
        return val !== undefined ? Number(val) : 0;
      };

      const presentCount = getStat(attendanceResponse, 'total_present_days') || results.filter(item => {
        const s = item.status?.toLowerCase();
        return s === 'present' || s === 'late';
      }).length;

      const lateCount = getStat(attendanceResponse, 'total_late_days') || results.filter(item => item.status?.toLowerCase() === 'late').length;

      const absentCount = getStat(attendanceResponse, 'total_absent_days') || results.filter(item => item.status?.toLowerCase() === 'absent').length;

      const leaveCount = getStat(attendanceResponse, 'total_leave_days') || results.filter(item => item.status?.toLowerCase() === 'leave').length;

      // Calculate total working hours by summing durations
      let totalMinutes = 0;

      // 1. Check if backend already provided a total in the root response
      const rootTotal = attendanceResponse?.total_working_hours || attendanceResponse?.total_hours;
      if (rootTotal && rootTotal !== '00:00' && typeof rootTotal === 'string') {
        const [h, m] = rootTotal.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) totalMinutes = h * 60 + m;
      }

      // 2. If total is still 0, calculate manually from items
      if (totalMinutes === 0) {
        results.forEach(item => {
          // A. Try worked_hours (numeric usually)
          const worked = parseFloat(item.worked_hours);
          if (!isNaN(worked) && worked > 0) {
            totalMinutes += (worked * 60);
          }
          // B. Try total_hours (HH:mm string)
          else if (item.total_hours && item.total_hours !== '00:00' && typeof item.total_hours === 'string') {
            const [h, m] = item.total_hours.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m)) totalMinutes += (h * 60 + m);
          }
          // C. Fallback to check_in/check_out diff
          else if (item.check_in && item.check_out) {
            try {
              const parseToMinutes = (time) => {
                if (!time) return null;
                const cleaned = time.replace(/[^0-9:]/g, ''); // Extract HH:mm even if AM/PM present
                const parts = cleaned.split(':');
                if (parts.length < 2) return null;
                let h = parseInt(parts[0]);
                let m = parseInt(parts[1]);
                if (time.toUpperCase().includes('PM') && h < 12) h += 12;
                if (time.toUpperCase().includes('AM') && h === 12) h = 0;
                return h * 60 + m;
              };
              const startMins = parseToMinutes(item.check_in);
              const endMins = parseToMinutes(item.check_out);
              if (startMins !== null && endMins !== null) {
                let diff = endMins - startMins;
                if (diff < 0) diff += 1440; // Handle overnight shift
                totalMinutes += diff;
              }
            } catch (e) {
              console.error("Error calculating duration manually:", item, e);
            }
          }
        });
      }

      const totalH = Math.floor(totalMinutes / 60);
      const totalM = Math.round(totalMinutes % 60);
      const totalWorkingHours = `${totalH}h ${totalM}m`;

      setStats({
        totalHours: totalWorkingHours,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        leave: leaveCount,
        remainingLeave: get(attendanceResponse, 'remaining_leave', 0),
        usedLeave: get(attendanceResponse, 'used_leave', 0)
      });

    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchEmployeeAndData();
  }, [selectedFilter, customStartDate]);


  const getRangeDates = () => {
    let start = new Date();
    let end = new Date();

    if (selectedFilter === 'This Week') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (selectedFilter === 'Last Week') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1) - 7;
      start.setDate(diff);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (selectedFilter.includes('-')) {
      start = new Date(customStartDate);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    }

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return { start: formatDate(start), end: formatDate(end) };
  };

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
      fetchEmployeeAndData();

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t(tokens.common.error) || 'Error',
        text2: error?.errorResponse?.error || error?.message || 'Failed to submit regularization'
      });
    }
  };

  const handleDayPress = (item) => {
    const currentYear = new Date().getFullYear();
    const [day, monthStr] = item.date.split(' ');
    const monthsShortEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsShortLocalized = [
      t(tokens.months.jan), t(tokens.months.feb), t(tokens.months.mar), t(tokens.months.apr), 
      t(tokens.months.may), t(tokens.months.jun), t(tokens.months.jul), t(tokens.months.aug), 
      t(tokens.months.sep), t(tokens.months.oct), t(tokens.months.nov), t(tokens.months.dec)
    ];
    let monthIndex = monthsShortLocalized.indexOf(monthStr);
    if (monthIndex === -1) monthIndex = monthsShortEn.indexOf(monthStr);
    const dateObj = new Date(currentYear, monthIndex !== -1 ? monthIndex : 0, parseInt(day));
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (dateObj > today) return; 

    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const dateKey = moment(item.fullData?.date || dateObj).locale('en').format('YYYY-MM-DD');
    const shiftInfo = shiftMap[dateKey];
    // console.log(`Weekly Day Press: Lookup for ${dateKey} found shift:`, !!shiftInfo, shiftInfo?.shift?.name);

    // const isToday = dateObj.getDate() === today.getDate() &&
    //   dateObj.getMonth() === today.getMonth() &&
    //   dateObj.getFullYear() === today.getFullYear();

    // if (isToday) return; // Removed to allow clicking today's card

    // Build details from API data
    const details = {
      date: dateObj,
      status: item.status,
      shift: shiftInfo?.shift?.name || shiftInfo?.shift_name || 'General Shift',
      totalBreakTime: shiftInfo?.break_times?.reduce((sum, b) => sum + (b.duration || 0), 0) || 0,
      location: 'Head Office, NY',
      address: '5th Avenue, Manhattan, New York, 10001',
      checkIn: item.fullData?.check_in ? formatTimeStr(item.fullData.check_in) : (item.status === 'absent' ? t(tokens.common.absent) : item.status === 'leave' ? t(tokens.common.leave) : '--'),
      checkOut: item.fullData?.check_out ? formatTimeStr(item.fullData.check_out) : (item.status === 'absent' ? t(tokens.common.absent) : item.status === 'leave' ? t(tokens.common.leave) : '--'),
      duration: item.fullData?.total_hours || '--',
      canRegularize: item.fullData?.regularization === true
    };

    setSelectedDayData(details);
    setIsSheetVisible(true);
  };

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
    setShowFilterModal(false);
    if (filter === 'Custom') {
      setShowDatePicker(true);
    }
  };

  const onConfirmDate = React.useCallback(
    (params) => {
      setShowDatePicker(false);
      if (params.date) {
        const selectedDate = params.date;
        setCustomStartDate(selectedDate);

        const endDate = new Date(selectedDate);
        endDate.setDate(selectedDate.getDate() + 6);

        const options = { month: 'short', day: 'numeric' };
        const startStr = selectedDate.toLocaleDateString('en-US', options);
        const endStr = endDate.toLocaleDateString('en-US', options);

        setSelectedFilter(`${startStr} - ${endStr}`);
      }
    },
    [setCustomStartDate, setSelectedFilter]
  );

  const onDismissDate = React.useCallback(() => {
    setShowDatePicker(false);
    if (selectedFilter === 'Custom') {
      setSelectedFilter('This Week');
    }
  }, [selectedFilter, setSelectedFilter]);

  const getSummaryData = () => {
    // Helper to generate dates relative to a start date
    const generateWeekData = (startDate) => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        // Skip future dates if we want realistic data, or just show them as empty
        const isFuture = date > new Date();

        const dayName = days[date.getDay()];
        const dateStr = `${date.getDate()} ${months[date.getMonth()]}`;

        // Mock data logic based on day of week
        let status = 'present';
        let time = '09:00AM - 06:00PM';
        let duration = '09h 00m';
        let color = '#00BA00';

        if (dayName === 'Sun' || dayName === 'Sat') {
          status = 'off';
          time = '--';
          duration = '--';
          color = '#DEDFE4';
        } else if (Math.random() > 0.8) { // Random late/absent
          if (Math.random() > 0.5) {
            status = 'late';
            time = '09:45AM - 06:45PM';
            duration = '09h 00m';
            color = '#E74C3C'; // Red for late/absent in this mock
          } else {
            status = 'leave'; // Or absent
            time = '-';
            duration = '-';
            color = '#F39C12';
          }
        }

        if (isFuture) {
          status = 'upcoming';
          time = '--';
          duration = '--';
          color = '#DEDFE4';
        }

        return {
          day: dayName,
          date: dateStr,
          time,
          duration,
          status,
          color
        };
      }).reverse(); // Show newest first usually, or follow design (Mon-Sun)
    };

    let startDate = new Date();

    // Calculate start date based on filter
    if (selectedFilter === 'This Week') {
      // Assuming week starts on Monday for business logic
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      startDate.setDate(diff);
    } else if (selectedFilter === 'Last Week') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1) - 7;
      startDate.setDate(diff);
    } else if (selectedFilter.includes('-')) {
      // Custom range already set customStartDate
      startDate = new Date(customStartDate);
    }

    return generateWeekData(startDate);
  };

  const getFormattedSummaryData = () => {
    if (attendanceData.length === 0 && loading) return [];

    // Map API results to UI format
    return attendanceData.map(item => {
      const dateObj = new Date(item.date);
      const daysShort = [t(tokens.days.sun), t(tokens.days.mon), t(tokens.days.tue), t(tokens.days.wed), t(tokens.days.thu), t(tokens.days.fri), t(tokens.days.sat)];
      const monthsShort = [t(tokens.months.jan), t(tokens.months.feb), t(tokens.months.mar), t(tokens.months.apr), t(tokens.months.may), t(tokens.months.jun), t(tokens.months.jul), t(tokens.months.aug), t(tokens.months.sep), t(tokens.months.oct), t(tokens.months.nov), t(tokens.months.dec)];

      const dayName = daysShort[dateObj.getDay()];
      const dateStr = `${dateObj.getDate()} ${monthsShort[dateObj.getMonth()]}`;

      const status = item.status?.toLowerCase();
      let color = '#DEDFE4'; // Default to gray for unknown/off/upcoming
      if (status === 'present') color = '#00BA00';
      if (status === 'absent') color = '#E74C3C';
      if (status === 'late') color = '#F39C12';
      if (status && (status.includes('leave') || status.includes('permission') || ['sl', 'pl', 'cl', 'al', 'ml'].includes(status))) {
        color = '#DEDFE4'; // Standardized Light Gray for leaves
      }
      // If today or past but no status, could be absent or error, default to gray is safer or red if strictly absent

      return {
        day: dayName,
        date: dateStr,
        time: item.check_in && item.check_out ? `${item.check_in} - ${item.check_out}` : (item.total_hours && item.total_hours !== '00:00' ? '---' : '--'),
        duration: (item.total_hours && item.total_hours !== '00:00') ? item.total_hours : (item.worked_hours ? `${item.worked_hours}h` : (item.duration || '--')),
        status: status,
        color: color,
        rawDate: dateObj,
        fullData: item
      };
    }).reverse();
  };

  const summaryData = attendanceData.length > 0 ? getFormattedSummaryData() : getSummaryData();

  const displayStats = attendanceData.length > 0 ? stats : { totalHours: `42${t(tokens.common.hours)} 15${t(tokens.common.mins)}`, present: 16, late: 2 };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Fixed Background Gradient */}
      <LinearGradient
        colors={['#C6D2FD', '#FFFFFF']}
        locations={[0, 0.3]}
        style={styles.background}
      />

      {/* Fixed Header & Stats Area */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1F24" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t(tokens.weeklySummary.title)}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Workload Summary Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t(tokens.weeklySummary.workloadSummary)}</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.filterText}>{selectedFilter === 'This Week' ? t(tokens.weeklySummary.thisWeek) : selectedFilter === 'Last Week' ? t(tokens.weeklySummary.lastWeek) : selectedFilter === 'Custom' ? t(tokens.weeklySummary.custom) : selectedFilter}</Text>
            <Ionicons name="chevron-down" size={16} color="#62636C" />
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <LinearGradient
          colors={['#4F70E1', '#3B5998']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsCard}
        >
          <View style={styles.statsMainRow}>
            <View style={styles.statItemMain}>
              <Text style={styles.statValueMain}>{displayStats.totalHours || '0h 0m'}</Text>
              <Text style={styles.statLabelMain}>{t(tokens.weeklySummary.totalWorkingHours)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItemMain}>
              <Text style={styles.statValueMain}>{displayStats.present} <Text style={styles.unitTextMain}>{t(tokens.common.days)}</Text></Text>
              <Text style={styles.statLabelMain}>{t(tokens.weeklySummary.present)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItemMain}>
              <Text style={styles.statValueMain}>{displayStats.late} <Text style={styles.unitTextMain}>{t(tokens.common.days)}</Text></Text>
              <Text style={styles.statLabelMain}>{t(tokens.weeklySummary.late)}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* <View style={[styles.statsCard, { marginTop: 12, backgroundColor: '#FFFFFF', opacity: 0.9 }]}>
               <View style={styles.statsColumn}>
                <Text style={[styles.statsValue, { color: '#4169E1' }]}>{displayStats.remainingLeave}</Text>
                <Text style={styles.statsLabel}>Remaining Leave</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.statsColumn}>
                <Text style={[styles.statsValue, { color: '#F39C12' }]}>{displayStats.usedLeave}</Text>
                <Text style={styles.statsLabel}>Used Leave</Text>
              </View>
            </View> */}

        {/* List */}
        <View style={styles.listContainer}>
          {loading ? (
            // Professional Skeleton Loader for List
            Array.from({ length: 7 }).map((_, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.dateColumn}>
                  <SkeletonLoader width={30} height={12} borderRadius={4} style={{ marginBottom: 4 }} />
                  <SkeletonLoader width={45} height={14} borderRadius={4} />
                </View>
                <View style={styles.timeColumn}>
                  <SkeletonLoader width={100} height={12} borderRadius={4} style={{ marginBottom: 4 }} />
                  <SkeletonLoader width={60} height={12} borderRadius={4} />
                </View>
                <SkeletonLoader width={12} height={12} borderRadius={6} />
              </View>
            ))
          ) : (
            summaryData.map((item, index) => (
              <AnimatedListItem key={index} index={index}>
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => handleDayPress(item)}
                >
                  <View style={styles.dateColumn}>
                    <Text style={styles.dayText}>{item.day}</Text>
                    <Text style={styles.dateText}>{item.date}</Text>
                  </View>

                  <View style={styles.timeColumn}>
                    <Text style={styles.timeText}>{item.time}</Text>
                    <Text style={styles.durationText}>{item.duration}</Text>
                  </View>

                  <View style={[styles.statusDot, { backgroundColor: item.color }]} />
                </TouchableOpacity>
              </AnimatedListItem>
            ))
          )}
        </View>
      </ScrollView>

      <DayDetailsSheet
        visible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
        data={selectedDayData}
        onRequestRegularize={() => setIsRegularizeVisible(true)}
      />

      <RegularizeModal
        visible={isRegularizeVisible}
        onClose={() => setIsRegularizeVisible(false)}
        date={selectedDayData?.date}
        onSubmit={handleRegularizeSubmit}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={[styles.dropdownContainer, { top: paddingTop + 110, right: 16 }]}>
            {['This Week', 'Last Week', 'Custom'].map((filter, index) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.dropdownItem,
                  index === 0 && { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
                  index === 2 && { borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderBottomWidth: 0 }
                ]}
                onPress={() => handleFilterSelect(filter)}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedFilter === filter && styles.selectedDropdownItemText
                ]}>
                  {filter === 'This Week' ? t(tokens.weeklySummary.thisWeek) : filter === 'Last Week' ? t(tokens.weeklySummary.lastWeek) : filter === 'Custom' ? t(tokens.weeklySummary.custom) : filter}
                </Text>
                {selectedFilter === filter && (
                  <Ionicons name="checkmark-circle" size={18} color="#4169E1" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker */}
      <DatePickerModal
        locale="en"
        mode="single"
        visible={showDatePicker}
        onDismiss={onDismissDate}
        date={customStartDate}
        onConfirm={onConfirmDate}
        validRange={{ endDate: new Date() }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 24,
    // Removed border and padding since it's now inside the content
  },
  backButton: {
    padding: 12, // Increased padding for easier clicking
    marginLeft: -12, // Adjusted margin to align with content despite padding
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E1F24',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    // paddingTop handled dynamically
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1F24',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  filterText: {
    fontSize: 13,
    color: '#62636C',
    fontWeight: '500',
  },
  statsCard: {
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItemMain: {
    flex: 1,
    alignItems: 'center',
  },
  statValueMain: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  unitTextMain: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.7)' },
  statLabelMain: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFF0F3',
  },
  dateColumn: {
    width: 60,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E1F24',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#9FA1A6',
  },
  timeColumn: {
    flex: 1,
    paddingHorizontal: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E1F24',
    marginBottom: 2,
  },
  durationText: {
    fontSize: 12,
    color: '#9FA1A6',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    position: 'absolute',
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E1F24',
  },
  selectedDropdownItemText: {
    color: '#4169E1',
    fontWeight: '600',
  },
  // Sheet Styles (Copied from Monthly)
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    minHeight: '60%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DEDFE4',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalHeader: {
    marginBottom: 24,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1F24',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardCol: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 13,
    color: '#9E9E9E',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
  },
  verticalLine: {
    width: 1,
    backgroundColor: '#F0F2F5',
    marginHorizontal: 16,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 12,
    color: '#9E9E9E',
    maxWidth: '90%',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    margin: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 10,
  },
  blurTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  blurSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  closeButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEDFE4',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#4169E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  parentblur: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    backgroundColor: 'rgba(253, 253, 253, 0.9)',
    width: "100%",
    height: "100%",
    padding: 20,
    display: "flex",
    justifyContent: "center",
    alignItems: "center"

  },
  blurOverlay: {
    // ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    // margin: 16,
    overflow: 'hidden',
    width: "85%",
    height: "50%"

  },
  containercard: {
    flexDirection: 'column',
    gap: 10,
    position: "relative"
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
});
