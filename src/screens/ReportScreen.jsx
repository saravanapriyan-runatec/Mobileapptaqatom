import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Platform, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { DatePickerModal } from 'react-native-paper-dates';
import ReportDetailsSheet from '../components/reports/ReportDetailsSheet';
import ProfileServices from '../../Services/API/ProfileServices';
import AuthService from '../../Services/AuthService';
import { get } from 'lodash';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import { useUser } from '../context/UserContext';
import StaggeredEntrance from '../components/common/StaggeredEntrance';
import EmptyState from '../components/common/EmptyState';

const { height } = Dimensions.get('window');

const ClockIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <Path
      d="M8 4V8H11M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z"
      stroke="#1E1F24"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// MOCK_DATA removed

const StatusBadge = ({ status }) => {
  let backgroundColor, color;

  switch (status) {
    case 'Present':
      backgroundColor = 'rgba(46, 204, 64, 0.1)'; // #2ecc401a
      color = '#2ecc40';
      break;
    case 'Late':
      backgroundColor = 'rgba(243, 156, 18, 0.1)'; // #f39c121a
      color = '#f39c12';
      break;
    case 'Overtime':
      backgroundColor = 'rgba(142, 68, 173, 0.1)'; // #8e44ad1a
      color = '#8e44ad';
      break;
    case 'Absent':
      backgroundColor = 'rgba(231, 76, 60, 0.1)'; // #e74c3c1a
      color = '#e74c3c';
      break;
    case 'Leave':
      backgroundColor = '#edf2fe';
      color = '#4169e1';
      break;
    default:
      backgroundColor = '#EFF0F3';
      color = '#1E1F24';
  }

  const { t } = useTranslation();
  let translatedStatus = status;
  if (status === 'Present') translatedStatus = t(tokens.reports.present);
  if (status === 'Late') translatedStatus = t(tokens.reports.late);
  if (status === 'Overtime') translatedStatus = t(tokens.reports.overtime);
  if (status === 'Absent') translatedStatus = t(tokens.reports.absent);
  if (status === 'Leave') translatedStatus = t(tokens.reports.leave);

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.badgeText, { color }]}>{translatedStatus}</Text>
    </View>
  );
};

const ReportCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.cardContent}>
      <View style={styles.row}>
        <Text style={styles.dateText}>{item.date}</Text>
        <StatusBadge status={item.status} />
      </View>

      <Text style={styles.durationText}>{item.duration}</Text>

      <View style={styles.timeRow}>
        <View style={styles.clockIconContainer}>
          <ClockIcon />
        </View>
        <Text style={styles.timeRangeText}>{item.timeRange}</Text>
      </View>
    </View>

    <View style={styles.dividerVertical} />

    <View style={styles.chevronContainer}>
      <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
    </View>
  </TouchableOpacity>
);

const ReportScreen = () => {
  const { userDetails } = useUser();
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top;
  const [selectedReport, setSelectedReport] = React.useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month
  });
  const [toDate, setToDate] = useState(new Date()); // Today
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('from'); // 'from' or 'to'
  const { t } = useTranslation();

  React.useEffect(() => {
    if (userDetails?.id) {
        fetchReports();
    }
  }, [fromDate, toDate, userDetails?.id]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const employeeId = userDetails?.id;
      // console.log("userid (employee id)", employeeId);

      const start = formatDateForAPI(fromDate);
      const end = formatDateForAPI(toDate);

      const response = await ProfileServices.getAllReports({
        id: employeeId,
        start,
        end,
        page: 0,
        size: 10000
      });

      // console.log('DEBUG: All Reports API Response:', JSON.stringify(response, null, 2));

      const results = get(response, 'data.results') || get(response, 'results') || [];
      const mappedReports = results.map((item, index) => {
        // Parse att_date (YYYY-MM-DD)
        const dateParts = (item.att_date || '').split('-');
        let dateObj;
        if (dateParts.length === 3) {
          dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        } else {
          dateObj = new Date();
        }
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const day = dateObj.getDate();
        const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
        const year = dateObj.getFullYear();

        // Format time from HH:MM:SS to HH:MM AM/PM
        const formatTime12 = (timeStr) => {
          if (!timeStr || timeStr === '--') return '--:--';
          const parts = timeStr.split(':');
          if (parts.length < 2) return timeStr;
          let h = parseInt(parts[0], 10);
          const m = parts[1];
          const ampm = h >= 12 ? 'PM' : 'AM';
          if (h > 12) h -= 12;
          if (h === 0) h = 12;
          return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
        };

        // Format total_time (HH:MM) to readable duration
        const formatDuration = (totalTime) => {
          if (!totalTime || totalTime === '--') return '--';
          const parts = totalTime.split(':');
          if (parts.length < 2) return totalTime;
          const hrs = parseInt(parts[0], 10);
          const mins = parseInt(parts[1], 10);
          return `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
        };

        // Derive status from data
        const deriveStatus = () => {
          if (!item.first_punch && !item.last_punch) return 'Absent';
          if (item.total_time === '00:00' && item.first_punch === item.last_punch) return 'Present'; // Missing punch
          const timeParts = (item.total_time || '00:00').split(':');
          const totalMinutes = (parseInt(timeParts[0], 10) || 0) * 60 + (parseInt(timeParts[1], 10) || 0);
          if (totalMinutes >= 540) return 'Present'; // 9+ hours = full day
          if (totalMinutes > 0) return 'Present';
          return 'Absent';
        };

        const checkInStr = formatTime12(item.first_punch);
        const checkOutStr = formatTime12(item.last_punch);

        return {
          id: item.emp_id?.toString() + '_' + (item.att_date || index.toString()),
          date: `${dayName}, ${day} ${month} ${year}`,
          status: deriveStatus(),
          duration: formatDuration(item.total_time),
          timeRange: `${checkInStr} - ${checkOutStr}`,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          rawDate: item.att_date,
          totalTime: item.total_time,
          weekday: item.weekday,
          employeeName: item.employee_name,
          department: item.department_name,
          position: item.position_name,
        };
      });

      setReports(mappedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForAPI = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleDatePress = () => {
    setDatePickerMode('from');
    setShowDatePicker(true);
  };

  const onConfirmDate = React.useCallback(
    (params) => {
      setShowDatePicker(false);
      const currentDate = params.date;
      if (datePickerMode === 'from') {
        setFromDate(currentDate);
        setTimeout(() => {
          setDatePickerMode('to');
          setShowDatePicker(true);
        }, 500);
      } else {
        setToDate(currentDate);
      }
    },
    [datePickerMode]
  );

  const handlePrevious = () => {
    if (!selectedReport) return;
    const currentIndex = reports.findIndex(item => item.id === selectedReport.id);
    if (currentIndex < reports.length - 1) {
      setSelectedReport(reports[currentIndex + 1]);
    }
  };

  const handleNext = () => {
    if (!selectedReport) return;
    const currentIndex = reports.findIndex(item => item.id === selectedReport.id);
    if (currentIndex > 0) {
      setSelectedReport(reports[currentIndex - 1]);
    }
  };

  const currentIndex = selectedReport ? reports.findIndex(item => item.id === selectedReport.id) : -1;
  const hasPrevious = currentIndex < reports.length - 1 && currentIndex !== -1;
  const hasNext = currentIndex > 0;

  return (
    <View style={styles.container}>
      {/* Fixed Top Section */}
      <View style={{ zIndex: 1, backgroundColor: '#FFFFFF' }}>
        <LinearGradient
          colors={['#8EA3E3', '#FFFFFF']}
          locations={[0, 1]}
          style={[styles.background, { height: '100%' }]}
        />
        
        <View style={[styles.header, { paddingTop: paddingTop + 12, paddingHorizontal: 16, marginBottom: 16 }]}>
          <Text style={styles.headerTitle}>{t(tokens.reports.title)}</Text>
          <TouchableOpacity 
            style={styles.datePickerContainer} 
            onPress={() => { setDatePickerMode('from'); setShowDatePicker(true); }}
          >
            <Ionicons name="calendar-outline" size={16} color="#1E1F24" />
            <Text style={styles.datePickerText}>
              {fromDate.toLocaleDateString('en-GB')} - {toDate.toLocaleDateString('en-GB')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DatePickerModal
          locale="en"
          mode="single"
          visible={showDatePicker}
          onDismiss={() => setShowDatePicker(false)}
          date={datePickerMode === 'from' ? fromDate : toDate}
          onConfirm={onConfirmDate}
          validRange={{ endDate: new Date() }}
        />
      )}

      {/* Scrollable Report List */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#395CC6" />
          </View>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <StaggeredEntrance index={index}>
                <ReportCard
                  item={item}
                  onPress={() => setSelectedReport(item)}
                />
              </StaggeredEntrance>
            )}
            contentContainerStyle={[styles.listContainer, { paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <EmptyState 
                title={t(tokens.reports.noReports)}
                description={t(tokens.reports.noReportsDesc || 'No attendance data found for the selected date range')}
              />
            )}
          />
        )}
      </View>

      <ReportDetailsSheet
        visible={!!selectedReport}
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
      />
    </View>
  );
};

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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 0,
  },
  headerTitle: {
    fontSize: 18, // Matches other screens
    fontWeight: '600',
    color: '#1E1F24',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  datePickerText: {
    fontSize: 12,
    color: '#1E1F24',
    fontWeight: '500',
  },
  listContainer: {
    gap: 16,
    paddingBottom: 100, // Space for bottom nav
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFF0F3',
    padding: 12,
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E1F24',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '400', // Light/Regular
    color: '#1E1F24',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clockIconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.47,
  },
  timeRangeText: {
    fontSize: 12,
    color: '#1E1F24',
    opacity: 0.47,
  },
  dividerVertical: {
    width: 1,
    height: '80%',
    backgroundColor: '#EFF0F3',
    marginHorizontal: 12,
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
  },
});

export default ReportScreen;
