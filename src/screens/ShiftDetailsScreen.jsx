import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, Dimensions, ActivityIndicator, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { get } from 'lodash';

import ProfileServices from '../../Services/API/ProfileServices';
import AuthService from '../../Services/AuthService';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import SkeletonLoader from '../components/home/SkeletonLoader';

const { height } = Dimensions.get('window');

export default function ShiftDetailsScreen({ onBack }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top;

  const [loading, setLoading] = useState(true);
  const [shiftData, setShiftData] = useState(null);
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const uId = await AuthService.getUserId();
      const currentYear = new Date().getFullYear().toString();

      // Step 1: Get User Details (to get username)
      const userDetails = await ProfileServices.getUserDetailsData(uId);
      const username = userDetails?.username;

      if (username) {
        // Step 2: Get Employee Details (to get employee ID)
        const employee = await ProfileServices.getEmployeeDetailsData(username);
        const empId = employee?.id;

        if (empId) {
          // Step 3: Fetch dynamic shift details for current month
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

          const formatDate = (date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
          };

          const shiftPayload = {
            emp_id: empId,
            start_date: formatDate(firstDay),
            end_date: formatDate(lastDay)
          };

          // console.log('ShiftDetailsScreen - API Request Payload:', shiftPayload);
          
          const [shiftResponse, holidayResponse] = await Promise.all([
            ProfileServices.getEmployeeShiftDetails(shiftPayload),
            ProfileServices.getHolidayDetails(empId, currentYear)
          ]);

          // console.log('--- SHIFT DETAILS SCREEN API RESPONSES ---');
          // console.log('Shift API:', JSON.stringify(shiftResponse, null, 2));
          // console.log('Holidays API (from ProfileServices.getHolidayDetails):', JSON.stringify(holidayResponse, null, 2));
          // console.log('--- END OF API RESPONSES ---');

          // Map Shift Data - The new API structure seems to be an array or { results: [] }
          // Map Shift Data - Use today's shift if possible, otherwise first one
          const shiftList = Array.isArray(shiftResponse) ? shiftResponse : (shiftResponse?.results || []);
          const todayStr = formatDate(new Date());
          const todayShift = shiftList.find(s => s.date === todayStr) || shiftList[0];
          
          setShiftData(todayShift);
          setAllShifts(shiftList);

          // Map Holidays - Use the dedicated holiday API (yearly) instead of filtering from the monthly shift list
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const listHolidays = (Array.isArray(holidayResponse) ? holidayResponse : (holidayResponse?.results || []))
            .map(item => ({
              ...item,
              date: item.start_date || item.date, // Map start_date to date for the renderer
              holiday_alias: item.alias || item.holiday_alias, // Map alias to holiday_alias for the renderer
              dObj: new Date(item.start_date || item.date)
            }))
            .filter(item => item.dObj >= today)
            .sort((a, b) => a.dObj - b.dObj)
            .slice(0, 6);

          // console.log('--- FILTERED UPCOMING HOLIDAYS (RENDERED FROM YEARLY API) ---');
          // console.log(JSON.stringify(listHolidays, null, 2));
          // console.log('--- END OF FILTERED HOLIDAYS ---');

          setHolidays(listHolidays);
        }
      }
    } catch (error) {
      console.error('Error fetching shift details data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [allShifts, setAllShifts] = useState([]);

  const formatTimeStr = (timeStr) => {
    if (!timeStr) return '--:--';
    const [h, m] = timeStr.split(':');
    const hh = parseInt(h);
    const suffix = hh >= 12 ? 'PM' : 'AM';
    const hour12 = hh % 12 || 12;
    return `${hour12}:${m} ${suffix}`;
  };

  const formatHolidayDate = (dateStr) => {
    if (!dateStr) return { formattedDate: '--', day: '--' };
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
      formattedDate: `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}`,
      day: days[date.getDay()]
    };
  };

  // Full screen loading handled by skeletons inside components
  const upcomingShift = allShifts.length > 1 ? allShifts[1] : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Fixed Background Gradient to match other screens */}
      <LinearGradient
        colors={['#8EA3E3', '#FFFFFF']}
        locations={[0, 0.3]} 
        style={styles.background}
      />

      {/* Fixed Area: Header + Shift Card */}
      <View style={{ paddingTop: paddingTop + 12, paddingHorizontal: 16 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1F24" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t(tokens.dashboard.shift)}</Text>
          <View style={{ width: 40 }} /> 
        </View>

        {/* Shift Info (Fixed) */}
        {loading ? (
          <View style={[styles.card, { height: 160, justifyContent: 'center' }]}>
            <SkeletonLoader width={150} height={20} borderRadius={4} style={{ marginBottom: 10 }} />
            <SkeletonLoader width={100} height={12} borderRadius={4} style={{ marginBottom: 20 }} />
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <SkeletonLoader width={120} height={30} borderRadius={8} />
                <View style={{ width: 16 }} />
                <SkeletonLoader width={120} height={30} borderRadius={8} />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.shiftName}>{shiftData?.shift?.name || t(tokens.home.generalShift)}</Text>
                <Text style={styles.shiftType}>{shiftData?.shift_type || t(tokens.home.fullTime)}</Text>
              </View>
              <View style={[styles.activeBadge, shiftData?.holiday && { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}>
                <Text style={[styles.activeText, shiftData?.holiday && { color: '#E74C3C' }]}>
                  {shiftData?.holiday ? 'Holiday' : t(tokens.home.active)}
                </Text>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailValue}>
                    {formatTimeStr(shiftData?.start_time)} - {formatTimeStr(shiftData?.end_time)}
                  </Text>
                  <Text style={styles.detailLabel}>{t(tokens.home.timing)}</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.detailItem}>
                  <Text style={styles.detailValue}>
                    {shiftData?.break_times?.reduce((sum, b) => sum + (b.duration || 0), 0) || '0'} {t(tokens.home.minutes)}
                  </Text>
                  <Text style={styles.detailLabel}>{t(tokens.home.totalBreakTime) || 'Total Break Time'}</Text>
                </View>
              </View>

              <View style={styles.horizontalDivider} />

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailValue}>Mon - Fri</Text>
                  <Text style={styles.detailLabel}>{t(tokens.home.workingDays)}</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.detailItem}>
                  <Text style={styles.detailValue}>Sat, Sun</Text>
                  <Text style={styles.detailLabel}>{t(tokens.home.weeklyOff)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Scrollable Area: Holidays Only */}
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ minHeight: height * 0.5 }}>
          <View style={[styles.scrollContent, { paddingTop: 4 }]}>

            {/* Upcoming Holidays Section */}
            <View style={styles.holidaysSection}>
              <Text style={styles.sectionTitle}>{t(tokens.home.upcomingHolidays)}</Text>

              <View style={styles.holidaysList}>
                {loading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <View key={idx} style={styles.holidayCard}>
                      <View style={styles.dateContainer}>
                        <SkeletonLoader width={60} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                        <SkeletonLoader width={40} height={12} borderRadius={4} />
                      </View>
                      <View style={styles.holidaySeparator} />
                      <SkeletonLoader width={120} height={14} borderRadius={4} />
                    </View>
                  ))
                ) : holidays.length > 0 ? (
                  holidays.map((holiday, idx) => {
                    const { formattedDate, day } = formatHolidayDate(holiday.date);
                    return (
                      <View key={idx} style={styles.holidayCard}>
                        <View style={styles.dateContainer}>
                          <Text style={styles.holidayDate}>{formattedDate}</Text>
                          <Text style={styles.holidayDay}>{day}</Text>
                        </View>
                        <View style={styles.holidaySeparator} />
                        <Text style={styles.holidayName}>{holiday.holiday_alias || holiday.holiday_name || 'Holiday'}</Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>{t(tokens.home.noUpcomingHolidays)}</Text>
                )}
              </View>
            </View>

            {/* Bottom Alert (Dynamic) */}
            {!loading && upcomingShift ? (
              <View style={styles.bottomAlert}>
                <Ionicons name="information-circle-outline" size={20} color="#4169E1" style={styles.alertIcon} />
                <Text style={styles.alertText}>
                  {t(tokens.home.upcomingShiftChange)}: {t(tokens.home.scheduledFor)} <Text style={styles.boldText}>{upcomingShift.title}</Text> {t(tokens.home.startingFrom)} {new Date(upcomingShift.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            ) : null}

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
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for bottom alert
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E1F24',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFF0F3',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  shiftName: {
    fontSize: 18, // Increased from 16
    fontWeight: '600', // Increased from 700
    color: '#1E1F24',
    marginBottom: 4,
  },
  shiftType: {
    fontSize: 13, // Increased from 12
    color: '#62636C', // Standardized grey
  },
  activeBadge: {
    backgroundColor: 'rgba(46, 204, 64, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeText: {
    color: '#2ECC40',
    fontSize: 12, // Increased from 11
    fontWeight: '700', // Increased from 600
  },
  detailsGrid: {
    gap: 20, // Increased gap
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailItem: {
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#F0F2F5',
    marginHorizontal: 16,
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#F0F2F5',
  },
  detailValue: {
    fontSize: 15, // Increased from 13
    fontWeight: '700', // Increased from 500
    color: '#1E1F24',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF', // Standardized secondary grey
  },
  holidaysSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18, // Increased from 16
    fontWeight: '600', // Increased from 600
    color: '#1E1F24',
    marginBottom: 16,
  },
  holidaysList: {
    gap: 12,
  },
  holidayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14, // Slightly rounder
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFF0F3',
    // Subtle shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  dateContainer: {
    width: 85, // Slightly wider
  },
  holidayDate: {
    fontSize: 15, // Increased from 14
    fontWeight: '500', // Increased from 600
    color: '#1E1F24',
    marginBottom: 4,
  },
  holidayDay: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  holidaySeparator: {
    width: 3, // Slightly thicker
    height: 32,
    backgroundColor: '#4169E1',
    marginHorizontal: 16,
    borderRadius: 1.5,
  },
  holidayName: {
    fontSize: 15, // Increased from 14
    fontWeight: '500', // Increased from 500
    color: '#1E1F24',
    flex: 1,
  },
  bottomAlert: {
    backgroundColor: 'rgba(65, 105, 225, 0.07)', // Light blue background
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 1, // Accent on the left
    borderLeftColor: '#4169E1',
    marginTop: 24,
  },
  alertIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: '#4169E1',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
  },
});
