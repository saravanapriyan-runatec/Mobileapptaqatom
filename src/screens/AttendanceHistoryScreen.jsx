import React, { useState, useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity,FlatList,ScrollView, Platform, Dimensions, Modal, Animated, PanResponder, ActivityIndicator, RefreshControl } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import RegularizeModal from '../components/home/RegularizeModal';
import Toast from 'react-native-toast-message';
import { useRegularization } from '../context/RegularizationContext';
import ProfileServices from '../../Services/API/ProfileServices';
import AuthService from '../../Services/AuthService';
import { get } from 'lodash';
import { useTranslation } from 'react-i18next';
import { Portal } from 'react-native-paper';
import tokens from '../../locales/tokens';
import { useUser } from '../context/UserContext';
import moment from 'moment';

const { height } = Dimensions.get('window');

const FilterSheet = ({ visible, onClose, onSelect, selectedFilter }) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [currentView, setCurrentView] = useState('options'); // 'options' | 'custom'
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      setCurrentView('options'); // Reset view on open
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

  const handleOptionPress = (option) => {
    if (option === t(tokens.home.custom) || option === 'Custom') {
      setCurrentView('custom');
    } else {
      onSelect(option);
      onClose();
    }
  };

  const handleMonthSelect = (month) => {
    onSelect(month);
    onClose();
  };

  const getLast12Months = () => {
    const months = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      months.push(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }
    return months;
  };

  if (!showModal) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showModal}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
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
        >
          <View style={styles.modalHandle} />

          {currentView === 'options' ? (
            <>
              <Text style={styles.filterTitle}>{t(tokens.home.selectPeriod)}</Text>
              <View style={styles.filterOptionsContainer}>
                {[t(tokens.home.thisMonth), t(tokens.home.lastMonth), t(tokens.home.custom)].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      selectedFilter === option && styles.filterOptionSelected
                    ]}
                    onPress={() => handleOptionPress(option)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedFilter === option && styles.filterOptionTextSelected
                    ]}>{option}</Text>
                    {selectedFilter === option && (
                      <Ionicons name="checkmark" size={20} color="#4169E1" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={styles.customHeader}>
                <TouchableOpacity onPress={() => setCurrentView('options')} style={styles.backIcon}>
                  <Ionicons name="chevron-back" size={24} color="#1E1F24" />
                </TouchableOpacity>
                <Text style={styles.filterTitle}>{t(tokens.home.selectMonth)}</Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                {getLast12Months().map((month) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.filterOption,
                      selectedFilter === month && styles.filterOptionSelected
                    ]}
                    onPress={() => handleMonthSelect(month)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedFilter === month && styles.filterOptionTextSelected
                    ]}>{month}</Text>
                    {selectedFilter === month && (
                      <Ionicons name="checkmark" size={20} color="#4169E1" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const DayDetailsSheet = ({ visible, onClose, data, hasPrev, hasNext, onPrev, onNext, onRequestRegularize }) => {
  const { t, i18n } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
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
        return gestureState.dy > 5;
      },
      onPanResponderGrant: () => {
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
        slideAnim.flattenOffset();
        if (gestureState.dy > 100) {
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
    const s = status.toLowerCase();
    if (s.includes('present')) return '#00BA00';
    if (s.includes('absent')) return '#E74C3C';
    if (s.includes('leave')) return '#4169E1';
    if (s.includes('late')) return '#F39C12';
    return '#62636C';
  };

  const getStatusBg = (status) => {
    const s = status.toLowerCase();
    if (s.includes('present')) return 'rgba(46, 204, 64, 0.1)';
    if (s.includes('absent')) return 'rgba(231, 76, 60, 0.1)';
    if (s.includes('leave')) return 'rgba(65, 105, 225, 0.1)';
    if (s.includes('late')) return 'rgba(243, 156, 18, 0.1)';
    return 'rgba(98, 99, 108, 0.1)';
  };

  const isBlurred = data.status.toLowerCase().includes('absent') || data.status.toLowerCase().includes('leave');
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

          <View style={styles.modalHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={styles.dateRow}>
                <Text style={styles.modalDate} numberOfLines={1}>
                  {data.date.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusBg, flexShrink: 1 }]}>
                  <Text style={[styles.statusText, { color: statusColor }]} numberOfLines={1} ellipsizeMode="tail">
                    {data.status.toLowerCase().includes('present') ? t(tokens.home.present) : data.status.toLowerCase().includes('absent') ? t(tokens.home.absent) : data.status.toLowerCase().includes('leave') ? t(tokens.home.leave) : data.status.toLowerCase().includes('late') ? t(tokens.home.late) : data.status}
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
              <Text style={styles.cardTitle}>{t(tokens.home.timing)}</Text>
              <View style={styles.cardRow}>
                <View style={styles.cardCol}>
                  <Text style={styles.cardLabel}>{t(tokens.home.checkIn)}</Text>
                  <Text style={[
                    styles.cardValue,
                    data.status.toLowerCase().includes('late') && { color: '#F39C12' },
                    isBlurred && { color: statusColor }
                  ]}>
                    {data.checkIn}
                  </Text>
                </View>
                <View style={styles.verticalLine} />
                <View style={styles.cardCol}>
                  <Text style={styles.cardLabel}>{t(tokens.home.checkOut)}</Text>
                  <Text style={[
                    styles.cardValue,
                    isBlurred && { color: statusColor }
                  ]}>
                    {data.checkOut}
                  </Text>
                </View>
              </View>
              {isBlurred && (
                <BlurView intensity={150} style={StyleSheet.absoluteFill} tint="light" />
              )}
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.cardTitle}>{t(tokens.home.shiftDetails)}</Text>
              <View style={styles.cardRow}>
                <View style={styles.cardCol}>
                  <Text style={styles.cardLabel}>{t(tokens.home.shiftName)}</Text>
                  <Text style={styles.cardValue}>{data.shiftName || t(tokens.home.generalShift)}</Text>
                </View>
                <View style={styles.verticalLine} />
                <View style={styles.cardCol}>
                  <Text style={styles.cardLabel}>Total Break Time</Text>
                  <Text style={styles.cardValue}>{data.totalBreakTime || '--'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.parentblur}>
                <View style={[styles.blurOverlay, { borderColor: statusColor }]}>
                  <BlurView intensity={90} style={StyleSheet.absoluteFill} tint="light" />
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: statusBg, opacity: 0.5 }]} />
                  <Ionicons name="alert-circle-outline" size={20} color={statusColor} />
                  <Text style={[styles.blurTitle, { color: statusColor }]}>
                    {data.status.toLowerCase().includes('present') ? t(tokens.home.present) : data.status.toLowerCase().includes('absent') ? t(tokens.home.absent) : data.status.toLowerCase().includes('leave') ? t(tokens.home.leave) : data.status.toLowerCase().includes('late') ? t(tokens.home.late) : data.status}
                  </Text>
                  <Text style={[styles.blurSubtitle, { color: statusColor }]}>
                    {data.status.toLowerCase().includes('absent') ? t(tokens.dashboard.noLogsOnThisDay) : data.status}
                  </Text>
                </View>
            </View>
           
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>{t(tokens.common.close)}</Text>
            </TouchableOpacity>
            {(data.canRegularize) && (
              <TouchableOpacity style={styles.primaryButton} onPress={() => {
                onClose();
                onRequestRegularize();
              }}>
                <Text style={styles.primaryButtonText}>{t(tokens.home.requestRegularize)}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function AttendanceHistoryScreen({ onBack }) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top;

  const [selectedFilter, setSelectedFilter] = useState(t(tokens.home.thisMonth));
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
  const [isRegularizeVisible, setIsRegularizeVisible] = useState(false);
  const { userDetails } = useUser();
  const { attendanceStatus, fetchAttendanceStatus, loading, addRequest } = useRegularization();
  const [localLoading, setLocalLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    fetchHistory();
  }, [selectedFilter]);

  const fetchHistory = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLocalLoading(true);
    let start, end;
    const today = moment();
 
    if (selectedFilter === t(tokens.home.thisMonth) || selectedFilter === 'This Month') {
      start = today.clone().locale('en').startOf('month').format('YYYY-MM-DD');
      end = today.clone().locale('en').format('YYYY-MM-DD'); // Fetch up to today for this month
    } else if (selectedFilter === t(tokens.home.lastMonth) || selectedFilter === 'Last Month') {
      start = today.clone().locale('en').subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
      end = today.clone().locale('en').subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
    } else if (selectedFilter !== t(tokens.home.custom) && selectedFilter !== 'Custom') {
      try {
        const targetM = moment(selectedFilter, 'MMMM YYYY');
        start = targetM.clone().locale('en').startOf('month').format('YYYY-MM-DD');
        end = targetM.clone().locale('en').endOf('month').format('YYYY-MM-DD');
      } catch (e) {
        console.warn("Could not parse filter date:", selectedFilter);
      }
    }
 
    await fetchAttendanceStatus(start, end);
    setLocalLoading(false);
    setRefreshing(false);
  };


  const filteredHistory = attendanceStatus.filter(item => {
    const today = moment();
    const itemDate = moment(item.date);
    let start, end;

    if (selectedFilter === t(tokens.home.thisMonth) || selectedFilter === 'This Month') {
      start = today.clone().startOf('month');
      end = today.clone().endOf('month');
    } else if (selectedFilter === t(tokens.home.lastMonth) || selectedFilter === 'Last Month') {
      start = today.clone().subtract(1, 'month').startOf('month');
      end = today.clone().subtract(1, 'month').endOf('month');
    } else if (selectedFilter !== t(tokens.home.custom) && selectedFilter !== 'Custom') {
      start = moment(selectedFilter, 'MMMM YYYY').startOf('month');
      end = moment(selectedFilter, 'MMMM YYYY').endOf('month');
    }

    if (start && end) {
      return itemDate.isBetween(start, end, 'day', '[]');
    }
    return true;
  }).sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf());

  const handleRegularizeSubmit = async (data) => {
    try {
      const empId = userDetails?.id;
      if (!empId) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Employee ID not found. Please try again.'
        });
        return;
      }

      await addRequest(data);

      Toast.show({
        type: 'success',
        text1: t(tokens.common.success),
        text2: 'Regularization request submitted successfully'
      });

      setIsRegularizeVisible(false);
      fetchHistory();
    } catch (error) {
      console.error("Error submitting regularization (History):", error);
      Toast.show({
        type: 'error',
        text1: t(tokens.common.error) || 'Error',
        text2: error?.errorResponse?.error || error?.message || 'Failed to submit regularization request'
      });
    }
  };

  const handleItemPress = (item) => {
    const itemDate = new Date(item.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Include entire today
    if (itemDate > today) return; 

    const formatTime = (timeStr) => {
      if (!timeStr || timeStr === '--' || timeStr.toLowerCase().includes('absent') || timeStr.toLowerCase().includes('leave')) return '--';
      return moment(timeStr, 'HH:mm:ss').format('hh:mm A');
    };

    const getSafeDuration = (item) => {
      const val = item.worked_hours;
      if (val === undefined || val === null || String(val) === 'undefined') return item.total_hours || '--';
      return `${val}h 00m`;
    };

    setSelectedDayData({
      date: itemDate,
      status: item.status,
      duration: getSafeDuration(item),
      checkIn: formatTime(item.check_in),
      checkOut: formatTime(item.check_out),
      canRegularize: item.regularization === true,
      shiftStart: item.shift_start,
      shiftEnd: item.shift_end,
      shiftName: item.shift_name || (item.shift ? item.shift.name : (item.shift_start && item.shift_end ? `${item.shift_start} - ${item.shift_end}` : t(tokens.home.generalShift))),
      expectedHours: item.expected_hours,
      workedHours: item.worked_hours,
      totalBreakTime: item.total_break_time || (item.break_times ? `${item.break_times.reduce((sum, b) => sum + (b.duration || 0), 0)} min` : '--')
    });
    setIsSheetVisible(true);
  };

  const currentIndex = selectedDayData ? filteredHistory.findIndex(d => new Date(d.date).getTime() === selectedDayData.date.getTime()) : -1;
  const hasPrevDay = currentIndex !== -1 && currentIndex < filteredHistory.length - 1;
  const hasNextDay = currentIndex > 0;

  const handlePrevDay = () => {
    if (hasPrevDay) handleItemPress(filteredHistory[currentIndex + 1]);
  };

  const handleNextDay = () => {
    if (hasNextDay) handleItemPress(filteredHistory[currentIndex - 1]);
  };

  const getStatusColor = (status) => {
    const s = status.toLowerCase();
    if (s.includes('present')) return '#2ECC40';
    if (s.includes('absent')) return '#E74C3C';
    if (s.includes('leave')) return '#4169E1';
    if (s.includes('late')) return '#F39C12';
    return '#62636C';
  };

  const getStatusBg = (status) => {
    const s = status.toLowerCase();
    if (s.includes('present')) return 'rgba(46, 204, 64, 0.1)';
    if (s.includes('absent')) return 'rgba(231, 76, 60, 0.1)';
    if (s.includes('leave')) return 'rgba(65, 105, 225, 0.1)';
    if (s.includes('late')) return 'rgba(243, 156, 18, 0.1)';
    return 'rgba(98, 99, 108, 0.1)';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={['#C6D2FD', '#FFFFFF']}
        locations={[0, 0.3]}
        style={styles.background}
      />

      <View style={{ paddingTop: paddingTop + 12, paddingHorizontal: 16 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1F24" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t(tokens.home.attendanceHistory)}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t(tokens.home.myLog)}</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setIsFilterSheetVisible(true)}
          >
            <Text style={styles.filterText}>{selectedFilter}</Text>
            <Ionicons name="chevron-down" size={16} color="#62636C" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {(loading || localLoading) && !refreshing ? (
          <ActivityIndicator size="large" color="#4169E1" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={filteredHistory}
            keyExtractor={(item, index) => `${item.date}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} tintColor="#4169E1" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t(tokens.dashboard.noActivities)}</Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const matches = (s, substring) => s.toLowerCase().includes(substring.toLowerCase());
              const isWeekend = matches(item.status, 'weekend');
              const isAbsent = matches(item.status, 'absent') || matches(item.status, 'missing');
              const isPresent = matches(item.status, 'present') || (!isAbsent && !isWeekend && item.worked_hours > 0);
              const isLate = matches(item.status, 'late');

              let badgeText = item.status;
              if (isPresent && !isLate) badgeText = 'Present';

              const itemFormatTime = (timeStr) => {
                if (!timeStr || timeStr === '--') return '--';
                return moment(timeStr, 'HH:mm:ss').format('hh:mm A');
              };

              return (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={styles.itemContent}>
                    <Text style={styles.itemDateText}>{moment(item.date).locale(i18n.language).format('ddd, DD MMM')}</Text>
                    <Text style={styles.itemDuration}>
                      {(item.worked_hours !== undefined && item.worked_hours !== null && String(item.worked_hours) !== 'undefined')
                        ? `${item.worked_hours}h 00m`
                        : (item.total_hours || '--')}
                    </Text>

                    <View style={styles.timeAndBadgeRow}>
                      <View style={styles.timeRow}>
                        <Ionicons name="time-outline" size={14} color="#9E9E9E" />
                        <Text style={styles.itemTimeText}>
                          {item.check_in ? itemFormatTime(item.check_in) : '--'} - {item.check_out ? itemFormatTime(item.check_out) : '--'}
                        </Text>
                      </View>
                      {badgeText !== 'Weekend' && (
                        <View style={[styles.statusBadgeInline, { backgroundColor: getStatusBg(badgeText) }]}>
                          <Text style={[styles.statusTextInline, { color: getStatusColor(badgeText) }]}>{badgeText}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.chevronContainer}>
                    <Ionicons name="chevron-forward" size={20} color="#62636C" />
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      <DayDetailsSheet
        visible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
        data={selectedDayData}
        hasPrev={hasPrevDay}
        hasNext={hasNextDay}
        onPrev={handlePrevDay}
        onNext={handleNextDay}
        onRequestRegularize={() => {
          setIsSheetVisible(false);
          // Small delay for smooth transition
          setTimeout(() => setIsRegularizeVisible(true), 400);
        }}
      />

      <RegularizeModal
        visible={isRegularizeVisible}
        onClose={() => setIsRegularizeVisible(false)}
        date={selectedDayData?.date}
        onSubmit={handleRegularizeSubmit}
      />

      <FilterSheet
        visible={isFilterSheetVisible}
        onClose={() => setIsFilterSheetVisible(false)}
        onSelect={setSelectedFilter}
        selectedFilter={selectedFilter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Modal Styles (Copied from Monthly/Weekly)
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  sheetContent: {
    backgroundColor: '#F7F8F9',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  modalNav: {
    flexDirection: 'row',
    gap: 8,
  },
  modalNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  parentblur:{
     position: 'absolute',
    top:0,
    left:0,
    zIndex: 10,
    backgroundColor: 'rgba(253, 251, 251, 0.9)',
    width:"100%",
    height:"100%",
    padding:20,
    display:"flex",
    justifyContent:"center",
    alignItems:"center"

  },
  blurOverlay: {
    // ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    // margin: 16,
    overflow: 'hidden',
    width:"85%",
    height:"50%"
   
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
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 24,
  },
  backButton: {
    padding: 12,
    marginLeft: -12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E1F24',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E1F24',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA', // Slight grey bg for filter
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  filterText: {
    fontSize: 12,
    color: '#62636C',
  },
  listContainer: {
    gap: 0,

    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: '#e8ecf7ff',
    marginBottom: 15,
    backgroundColor: "white",
    borderRadius: 12
  },
  itemContent: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  itemDateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E1F24',
  },
  itemDuration: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  timeAndBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    paddingRight: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTimeText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  chevronContainer: {
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#EFF0F3',
  },
  statusBadgeInline: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextInline: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#62636C',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 78,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Filter Sheet Styles
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1F24',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterOptionsContainer: {
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFF0F3',
    marginBottom: 8,
  },
  filterOptionSelected: {
    borderColor: '#4169E1',
    backgroundColor: '#F0F5FF',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#1E1F24',
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: '#4169E1',
    fontWeight: '600',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backIcon: {
    padding: 4,
  },
});