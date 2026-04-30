import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Dimensions, Platform, ActivityIndicator, StatusBar, RefreshControl } from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { EmptyStateIcon } from '../components/icons/EmptyStateIcon';
import PressableScale from '../components/common/PressableScale';
import AttendanceCard from '../components/home/AttendanceCard';
import { useAttendance } from '../context/AttendanceContext';
import ProfileServices from '../../Services/API/ProfileServices';
import AuthService from '../../Services/AuthService';
import { get } from 'lodash';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';

const { width, height } = Dimensions.get('window');

const TimerStartIcon = ({ size = 22, color = "#4169E1" }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path d="M12.4083 2.87508H7.59164C7.2583 2.87508 6.99164 2.60841 6.99164 2.27508C6.99164 1.94175 7.2583 1.66675 7.59164 1.66675H12.4083C12.7416 1.66675 13.0083 1.93341 13.0083 2.26675C13.0083 2.60008 12.7416 2.87508 12.4083 2.87508Z" fill={color} />
    <Path d="M16.6417 12.5H14.1917C13.1333 12.5 12.5 13.1333 12.5 14.1917V16.6417C12.5 17.7 13.1333 18.3333 14.1917 18.3333H16.6417C17.7 18.3333 18.3333 17.7 18.3333 16.6417V14.1917C18.3333 13.1333 17.7 12.5 16.6417 12.5ZM16.4083 16.2167L15.425 16.7833C15.225 16.9 15.025 16.9583 14.8417 16.9583C14.7 16.9583 14.575 16.925 14.4583 16.8583C14.1917 16.7 14.0417 16.3917 14.0417 15.9833V14.85C14.0417 14.4417 14.1917 14.1333 14.4583 13.975C14.725 13.8167 15.0667 13.85 15.425 14.05L16.4083 14.6167C16.7583 14.825 16.9583 15.1083 16.9583 15.4167C16.9583 15.725 16.7667 16.0083 16.4083 16.2167Z" fill={color} />
    <Path d="M11.6667 16.6417V14.1917C11.6667 12.6833 12.6834 11.6667 14.1917 11.6667H16.6417C16.8334 11.6667 17.0167 11.6833 17.1917 11.7167C17.2084 11.5167 17.225 11.3167 17.225 11.1083C17.225 7.11667 13.9834 3.875 10 3.875C6.01669 3.875 2.77502 7.11667 2.77502 11.1083C2.77502 15.0917 6.01669 18.3333 10 18.3333C10.7084 18.3333 11.3834 18.2167 12.0334 18.0333C11.8 17.6417 11.6667 17.175 11.6667 16.6417ZM10.625 10.8333C10.625 11.175 10.3417 11.4583 10 11.4583C9.65836 11.4583 9.37502 11.175 9.37502 10.8333V6.66667C9.37502 6.325 9.65836 6.04167 10 6.04167C10.3417 6.04167 10.625 6.325 10.625 6.66667V10.8333Z" fill={color} />
  </Svg>
);

export default function AttendanceScreen({ onNavigate }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isCheckedIn, hasCheckedIn, handleCheckIn, shiftInfo, locationAddress, employeeId, empCode, currentDate } = useAttendance();
  const [summary, setSummary] = useState({ present: 0, absent: 0, leave: 0, late: 0 });
  const [weeklyStatus, setWeeklyStatus] = useState([]);
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  const paddingTop = insets.top;

  useEffect(() => {
    fetchAttendanceSummary();
  }, [empCode]);

  const fetchAttendanceSummary = async () => {
    try {
      if (!empCode) return;
      setLoading(true);

      // Calculate current month range
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Calculate current week range (Mon - Sun)
      const first = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1);
      const last = first + 6;
      const firstDayOfWeek = new Date(now.getFullYear(), now.getMonth(), first);
      const lastDayOfWeek = new Date(now.getFullYear(), now.getMonth(), last);

      const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const [monthResponse, weekResponse] = await Promise.all([
        ProfileServices.getAttendanceSummary({
          emp_code: empCode,
          start_date: formatDate(firstDayOfMonth),
          end_date: formatDate(lastDayOfMonth)
        }),
        ProfileServices.getAttendanceSummary({
          emp_code: empCode,
          start_date: formatDate(firstDayOfWeek),
          end_date: formatDate(lastDayOfWeek)
        })
      ]);

      // console.log('AttendanceScreen - Monthly Response:', monthResponse);
      // console.log('AttendanceScreen - Weekly Response:', weekResponse);

      // Process Monthly Summary
      const monthlyLogs = get(monthResponse, 'employee_attendance') || [];

      const getStat = (res, key) => {
        const val = get(res, key) ?? get(res, `summary.${key}`);
        return val !== undefined ? Number(val) : 0;
      };

      const stats = {
        present: getStat(monthResponse, 'total_present_days'),
        absent: getStat(monthResponse, 'total_absent_days'),
        leave: getStat(monthResponse, 'total_leave_days'),
        late: getStat(monthResponse, 'total_late_days')
      };

      // console.log('AttendanceScreen - Extracted Stats:', stats);

      // If all are 0 and there are logs, fallback to manual calculation
      if (stats.present === 0 && stats.absent === 0 && stats.leave === 0 && monthlyLogs.length > 0) {
        // console.log('AttendanceScreen - Falling back to manual calculation');
        monthlyLogs.forEach(log => {
          const status = log.status?.toLowerCase();
          if (status === 'present' || status === 'late') {
            stats.present++;
          } else if (status === 'absent') {
            stats.absent++;
          } else if (status === 'leave') {
            stats.leave++;
          }
          if (status === 'late') stats.late++;
        });
      }
      setSummary(stats);

      // Process Weekly Status
      const weekLogs = get(weekResponse, 'employee_attendance') || [];
      
      // Calculate total weekly hours using robust logic from WeeklySummaryScreen
      let totalMinutes = 0;

      // 1. Check if backend already provided a total in root
      const rootTotal = weekResponse?.total_working_hours || weekResponse?.total_hours;
      if (rootTotal && rootTotal !== '00:00' && typeof rootTotal === 'string') {
        const [h, m] = rootTotal.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) totalMinutes = h * 60 + m;
      }

      // 2. Fallback to calculating manually from items
      if (totalMinutes === 0) {
        weekLogs.forEach(item => {
          const worked = parseFloat(item.worked_hours);
          if (!isNaN(worked) && worked > 0) {
            totalMinutes += (worked * 60);
          } else if (item.total_hours && item.total_hours !== '00:00' && typeof item.total_hours === 'string') {
            const [h, m] = item.total_hours.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m)) totalMinutes += (h * 60 + m);
          } else if (item.duration && item.duration !== '--' && typeof item.duration === 'string') {
            const parts = item.duration.split(':').map(Number);
            if (parts.length >= 2) {
              totalMinutes += (parts[0] * 60) + (parts[1] || 0);
            }
          }
        });
      }

      const totalH = Math.floor(totalMinutes / 60);
      const totalM = Math.round(totalMinutes % 60);
      const weeklyHoursDisplay = `${totalH}h ${totalM}m`;
      setWeeklyHours(weeklyHoursDisplay);

      const daysShort = [
        t(tokens.days.sun), t(tokens.days.mon), t(tokens.days.tue),
        t(tokens.days.wed), t(tokens.days.thu), t(tokens.days.fri),
        t(tokens.days.sat)
      ];

      const mappedWeek = daysShort.map((dayName, index) => {
        const targetDate = new Date(firstDayOfWeek);
        targetDate.setDate(firstDayOfWeek.getDate() + index);
        const targetDateStr = formatDate(targetDate);

        const log = weekLogs.find(l => l.date === targetDateStr);

        let status = 'off';
        if (log) {
          status = log.status?.toLowerCase() || 'off';
          // Normalize status for dot colors
          if (status === 'weekend' || status === 'holiday') status = 'off';
        }
        return { day: dayName, status };
      });
      setWeeklyStatus(mappedWeek);

    } catch (err) {
      console.error('Error fetching attendance summary:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAttendanceSummary();
  }, [empCode]);


  const getFormattedDate = () => {
    const date = currentDate || new Date();
    const days = [
      t(tokens.days.sunday), t(tokens.days.monday), t(tokens.days.tuesday),
      t(tokens.days.wednesday), t(tokens.days.thursday), t(tokens.days.friday),
      t(tokens.days.saturday)
    ];
    const monthsShort = [
      t(tokens.months.jan), t(tokens.months.feb), t(tokens.months.mar),
      t(tokens.months.apr), t(tokens.months.may), t(tokens.months.jun),
      t(tokens.months.jul), t(tokens.months.aug), t(tokens.months.sep),
      t(tokens.months.oct), t(tokens.months.nov), t(tokens.months.dec)
    ];
    return `${days[date.getDay()]}, ${date.getDate().toString().padStart(2, '0')} ${monthsShort[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getCurrentMonthSummaryTitle = () => {
    const monthsShort = [
      t(tokens.months.jan), t(tokens.months.feb), t(tokens.months.mar),
      t(tokens.months.apr), t(tokens.months.may), t(tokens.months.jun),
      t(tokens.months.jul), t(tokens.months.aug), t(tokens.months.sep),
      t(tokens.months.oct), t(tokens.months.nov), t(tokens.months.dec)
    ];
    return `${monthsShort[new Date().getMonth()]} ${t(tokens.home.summary)}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#00BA00';
      case 'late': return '#F39C12';
      case 'absent': return '#E74C3C';
      case 'leave': return '#4169E1';
      default: return '#DEDFE4';
    }
  };

  if (loading && !summary.present) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#395CC6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {/* Fixed Background Gradient to match ReportScreen exactly */}
      {/* <LinearGradient
        colors={['#8EA3E3', '#FFFFFF']}
        locations={[0, 0.3]}
        style={styles.background}
      /> */}

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <LinearGradient
          colors={['#8EA3E3', '#FFFFFF']}
          locations={[0, 0.3]}
          style={styles.background}
        />
        <View style={{ minHeight: height }}>
          <View style={[styles.contentContainer, { paddingTop: paddingTop + 24 }]}>
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <Text style={styles.screenTitle}>{t(tokens.home.attendance)}</Text>
                <Text style={styles.shiftTitle}>{shiftInfo?.name}</Text>
              </View>
              <View style={styles.headerRow}>
                <Text style={styles.dateText}>{getFormattedDate()}</Text>
                <Text style={styles.shiftTime}>{shiftInfo?.start} - {shiftInfo?.end}</Text>
              </View>
            </View>

            {isCheckedIn || hasCheckedIn ? (
              <View style={{ marginBottom: 24 }}>
                <AttendanceCard />
              </View>
            ) : (
              <LinearGradient
                colors={['#4169E1', '#395CC6']}
                style={styles.checkInCard}
              >
                <View style={styles.illustrationContainer}>
                  <Image 
                    source={require('../../assets/att.png')} 
                    style={styles.illustration}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.statusContainer}>
                  <Text style={styles.statusTitle}>{t(tokens.home.youHaventCheckedInYet)}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.locationText}>{t(tokens.home.ensureWithinOfficeLocation)}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.checkInButton}
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    handleCheckIn();
                  }}
                >
                  <TimerStartIcon size={22} color="#4169E1" />
                  <Text style={styles.checkInButtonText}>{t(tokens.home.checkIn)}</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}

            <TouchableOpacity
              style={styles.sectionCard}
              activeOpacity={0.7}
              onPress={() => onNavigate && onNavigate('weeklySummary')}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="pulse-outline" size={20} color="#1E1F24" />
                  <Text style={styles.sectionTitle}>{t(tokens.home.thisWeek)}</Text>
                  <Text style={styles.weekHours}>{weeklyHours}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#1E1F24" style={{ opacity: 0.5 }} />
              </View>

              <View style={styles.weekRow}>
                {(weeklyStatus.length > 0 ? weeklyStatus : [
                  { day: t(tokens.days.sun), status: 'off' },
                  { day: t(tokens.days.mon), status: 'off' },
                  { day: t(tokens.days.tue), status: 'off' },
                  { day: t(tokens.days.wed), status: 'off' },
                  { day: t(tokens.days.thu), status: 'off' },
                  { day: t(tokens.days.fri), status: 'off' },
                  { day: t(tokens.days.sat), status: 'off' },
                ]).map((item, index) => (
                  <View key={index} style={styles.dayItem}>
                    <Text style={styles.dayText}>{item.day}</Text>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                  </View>
                ))}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sectionCard}
              activeOpacity={0.7}
              onPress={() => onNavigate && onNavigate('monthlySummary')}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="bar-chart-outline" size={20} color="#1E1F24" />
                  <Text style={styles.sectionTitle}>{getCurrentMonthSummaryTitle()}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#1E1F24" style={{ opacity: 0.5 }} />
              </View>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{summary.present.toString().padStart(2, '0')} {t(tokens.home.days)}</Text>
                    <Text style={styles.summaryLabel}>{t(tokens.home.present)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{summary.absent.toString().padStart(2, '0')} {t(tokens.home.days)}</Text>
                    <Text style={styles.summaryLabel}>{t(tokens.home.absent)}</Text>
                  </View>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{summary.leave.toString().padStart(2, '0')} {t(tokens.home.days)}</Text>
                    <Text style={styles.summaryLabel}>{t(tokens.home.leave)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{summary.late.toString().padStart(2, '0')} {t(tokens.home.days)}</Text>
                    <Text style={styles.summaryLabel}>{t(tokens.home.late)}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => onNavigate && onNavigate('attendanceHistory')}
            >
              <View style={styles.menuContent}>
                <Ionicons name="time-outline" size={22} color="#1E1F24" />
                <Text style={styles.menuText}>{t(tokens.home.attendanceHistory)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
            </TouchableOpacity>

            {/* 
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => onNavigate && onNavigate('regularization')}
            >
              <View style={styles.menuContent}>
                <Ionicons name="create-outline" size={22} color="#1E1F24" />
                <Text style={styles.menuText}>{t(tokens.home.regularization)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
            </TouchableOpacity>
            */}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => onNavigate && onNavigate('shiftDetails')}
            >
              <View style={styles.menuContent}>
                <Ionicons name="grid-outline" size={22} color="#1E1F24" />
                <Text style={styles.menuText}>{t(tokens.home.shiftDetails)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
            </TouchableOpacity>

            <View style={{ height: 100 }} />
          </View>
        </View>
      </ScrollView>
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
  contentContainer: {
    padding: 16,
    // paddingTop handled dynamically
  },
  header: {
    marginBottom: 24,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1F24',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#62636C',
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1F24',
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 13,
    color: '#62636C',
  },
  checkInCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  illustrationContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  illustration: {
    width: 127,
    height: 88,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  checkInButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width:"100%",
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  checkInButtonText: {
    color: '#4169E1',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1F24',
  },
  weekHours: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 8,
    fontWeight: '400',
  },
  subText: {
    fontSize: 14,
    color: '#62636C',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    gap: 8,
  },
  dayText: {
    fontSize: 12,
    color: '#62636C',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryGrid: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#F7F9FF',
    padding: 16,
    borderRadius: 12,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1F24',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#62636C',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    marginBottom: 12,
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E1F24',
  },
});
