import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    FlatList,
    ActivityIndicator,
    Modal,
    Dimensions,
    Platform,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { get } from 'lodash';
import ProfileServices from '../../Services/API/ProfileServices';
import AuthService from '../../Services/AuthService';
import tokens from '../../locales/tokens';
import { useTranslation } from 'react-i18next';
import StaggeredEntrance from '../components/common/StaggeredEntrance';
import EmptyState from '../components/common/EmptyState';

const { width, height } = Dimensions.get('window');

const HOLIDAY_TYPES = {
    ALL: tokens.holidays.all,
    FESTIVAL: tokens.holidays.festival,
    NATIONAL: tokens.holidays.national,
    RESTRICTED: tokens.holidays.restricted,
};

const TYPE_COLORS = {
    [tokens.holidays.festival]: '#27AE60',
    [tokens.holidays.national]: '#F39C12',
    [tokens.holidays.restricted]: '#EB5757',
};

export default function HolidayScreen({ onBack }) {
    const { t, i18n } = useTranslation();
    const insets = useSafeAreaInsets();
    const [holidays, setHolidays] = useState([]);
    const [filteredHolidays, setFilteredHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('');
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0]);
    const [isMonthFiltered, setIsMonthFiltered] = useState(false);


    // Initialize filter once t is available or on first render
    useEffect(() => {
        setSelectedFilter(t(HOLIDAY_TYPES.ALL));
    }, [t]);

    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchHolidays();
    }, []);

    useEffect(() => {
        applyFilter();
    }, [selectedFilter, holidays, isMonthFiltered, selectedMonth]);

    const fetchHolidays = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            const authUserId = await AuthService.getUserId();
            const userDetails = await ProfileServices.getUserDetailsData(authUserId);
            const employee = await ProfileServices.getEmployeeDetailsData(userDetails?.username);
            const empId = employee?.id;
 
            if (!empId) {
                console.warn("HolidayScreen: Could not resolve employee ID");
                setLoading(false);
                setRefreshing(false);
                return;
            }
 
            const currentYear = new Date().getFullYear();
            const response = await ProfileServices.getHolidayDetails(empId, currentYear);
            // console.log('DEBUG: Holiday Response:', JSON.stringify(response, null, 2));
 
            const data = get(response, 'results') || (Array.isArray(response) ? response : []);
 
            const processedHolidays = data.map(item => {
                const dateParts = (item.start_date || '').split('-');
                let dateObj;
                if (dateParts.length === 3) {
                    dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                } else {
                    dateObj = new Date();
                }
 
                // Mock categorization based on name for visual fidelity to design
                let type = t(HOLIDAY_TYPES.FESTIVAL);
                const name = (item.alias || item.name || '').toLowerCase();
                if (name.includes('republic') || name.includes('national') || name.includes('independence')) {
                    type = t(HOLIDAY_TYPES.NATIONAL);
                } else if (name.includes('restricted') || name.includes('optional')) {
                    type = t(HOLIDAY_TYPES.RESTRICTED);
                }
 
                const monthName = t(tokens.months[dateObj.toLocaleDateString('en-US', { month: 'long' }).toLowerCase()]);
                const dayName = t(tokens.days[dateObj.toLocaleString('en-US', { weekday: 'long' }).toLowerCase()]);
                const dayOfMonth = dateObj.getDate();
                const dateDisplay = i18n.language === 'ar' ? `${dayOfMonth} ${monthName}` : `${monthName} ${dayOfMonth}`;

                return {
                    id: item.id || Math.random().toString(),
                    dateStr: item.start_date,
                    dateDisplay: dateDisplay,
                    dayDisplay: dayName,
                    name: item.alias || item.name || t(tokens.holidays.publicHoliday),
                    type: type,
                    rawTypeKey: type === t(HOLIDAY_TYPES.NATIONAL) ? HOLIDAY_TYPES.NATIONAL : type === t(HOLIDAY_TYPES.RESTRICTED) ? HOLIDAY_TYPES.RESTRICTED : HOLIDAY_TYPES.FESTIVAL
                };
            });
 
            processedHolidays.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
 
            setHolidays(processedHolidays);
        } catch (err) {
            console.error('Error fetching holidays:', err);
            setError(t(tokens.holidays.failedToLoad));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };


    const applyFilter = () => {
        let filtered = holidays;
        
        // Filter by type
        if (selectedFilter !== t(HOLIDAY_TYPES.ALL)) {
            filtered = filtered.filter(h => h.type === selectedFilter);
        }
        
        // Filter by month (if user has interacted)
        if (isMonthFiltered) {
            const selectedDate = new Date(selectedMonth);
            const selectedYear = selectedDate.getFullYear();
            const selectedMo = selectedDate.getMonth();
            
            filtered = filtered.filter(h => {
                const hDate = new Date(h.dateStr);
                return hDate.getFullYear() === selectedYear && hDate.getMonth() === selectedMo;
            });
        }
        
        setFilteredHolidays(filtered);
    };

    const getMarkedDates = () => {
        const marked = {};

        // Highlight today
        marked[todayStr] = {
            selected: true,
            selectedColor: '#3B5998',
            selectedTextColor: '#FFFFFF',
        };

        holidays.forEach(h => {
            const existing = marked[h.dateStr] || {};
            marked[h.dateStr] = {
                ...existing,
                dots: [...(existing.dots || []), { key: h.id, color: TYPE_COLORS[h.rawTypeKey] || '#3B5998' }]
            };
        });
        return marked;
    };

    const renderFilterModal = () => (
        <Modal
            visible={isFilterModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setFilterModalVisible(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setFilterModalVisible(false)}
            >
                <View style={styles.modalContent}>
                    {Object.values(HOLIDAY_TYPES).map((typeKey) => (
                        <TouchableOpacity
                            key={typeKey}
                            style={styles.modalItem}
                            onPress={() => {
                                setSelectedFilter(t(typeKey));
                                setFilterModalVisible(false);
                            }}
                        >
                            <Text style={[
                                styles.modalItemText,
                                selectedFilter === t(typeKey) && styles.selectedModalItemText
                            ]}>
                                {t(typeKey)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#8EA3E3', '#FFFFFF']}
        locations={[0, 0.3]}
        style={styles.background}
      />

      {/* Fixed Header and Calendar Area */}
      <View style={{ paddingTop: insets.top + 12 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1F24" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t(tokens.holidays.title)}</Text>
        </View>

        <View style={styles.fixedSection}>
          {/* Calendar Card */}
          <View style={styles.calendarCard}>
            <Calendar
              current={selectedMonth}
              onMonthChange={(month) => {
                  setSelectedMonth(month.dateString);
                  setIsMonthFiltered(true);
              }}
              markingType={'multi-dot'}
              markedDates={getMarkedDates()}
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: '#1E1F24',
                selectedDayBackgroundColor: '#3B5998',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#3B5998',
                dayTextColor: '#1E1F24',
                textDisabledColor: '#DEDFE4',
                dotColor: '#3B5998',
                selectedDotColor: '#ffffff',
                arrowColor: '#1E1F24',
                monthTextColor: '#1E1F24',
                indicatorColor: '#3B5998',
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '400',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12,
              }}
            />

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: TYPE_COLORS[HOLIDAY_TYPES.RESTRICTED] }]} />
                <Text style={styles.legendText}>{t(HOLIDAY_TYPES.RESTRICTED)}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: TYPE_COLORS[HOLIDAY_TYPES.NATIONAL] }]} />
                <Text style={styles.legendText}>{t(HOLIDAY_TYPES.NATIONAL)}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: TYPE_COLORS[HOLIDAY_TYPES.FESTIVAL] }]} />
                <Text style={styles.legendText}>{t(HOLIDAY_TYPES.FESTIVAL)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.filterSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={styles.sectionTitle}>{t(tokens.holidays.title)}</Text>
              {isMonthFiltered && (
                <TouchableOpacity 
                  style={styles.showAllBadge} 
                  onPress={() => setIsMonthFiltered(false)}
                >
                  <Text style={styles.showAllText}>{t(tokens.holidays.all)}</Text>
                  <Ionicons name="close-circle" size={14} color="#3B5998" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setFilterModalVisible(true)}
            >
              <Text style={styles.filterText}>{selectedFilter}</Text>
              <Ionicons name="chevron-down" size={18} color="#80828D" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Scrollable List container */}
      <View style={{ flex: 1 }}>
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#3B5998" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredHolidays}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listScrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchHolidays(true)} tintColor="#3B5998" />
            }
            ListEmptyComponent={
              <EmptyState 
                title={t(tokens.holidays.noHolidays)}
                description={t(tokens.holidays.noHolidaysDesc)}
              />
            }
            renderItem={({ item: holiday, index }) => (
              <StaggeredEntrance index={index}>
                <View style={styles.holidayCard}>
                  <View style={styles.dateBlock}>
                    <Text style={styles.listDateText}>{holiday.dateDisplay}</Text>
                    <Text style={styles.listDayText}>{holiday.dayDisplay}</Text>
                  </View>
                  
                  <View style={[styles.verticalIndicator, { backgroundColor: TYPE_COLORS[holiday.rawTypeKey] }]} />
                  
                  <View style={styles.nameBlock}>
                    <Text style={styles.listHolidayName}>{holiday.name}</Text>
                  </View>
                </View>
              </StaggeredEntrance>
            )}
            ListFooterComponent={<View style={{ height: 40 }} />}
          />
        )}
      </View>

            {renderFilterModal()}
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
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E1F24',
    },
    scrollContent: {
        padding: 16,
    },
    fixedSection: {
        paddingHorizontal: 16,
    },
    listScrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    calendarCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 16,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 10,
        color: '#1E1F24',
        fontWeight: '500',
    },
    filterSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E1F24',
    },
    filterDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EFF0F3',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
        minWidth: 80,
    },
    filterText: {
        fontSize: 13,
        color: '#80828D',
        fontWeight: '500',
    },
    showAllBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        borderWidth: 1,
        borderColor: '#D0D9F7',
    },
    showAllText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#3B5998',
    },
    listContainer: {
        gap: 12,
    },
    holidayCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F0F2F5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    dateBlock: {
        width: 100,
        justifyContent: 'center',
    },
    verticalIndicator: {
        width: 2,
        height: 44,
        borderRadius: 1,
        marginHorizontal: 12,
    },
    nameBlock: {
        flex: 1,
        justifyContent: 'center',
    },
    listDateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E1F24',
        marginBottom: 4,
    },
    listDayText: {
        fontSize: 14,
        color: '#9E9E9E',
        fontWeight: '500',
    },
    listHolidayName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1E1F24',
    },
    emptyText: {
        textAlign: 'center',
        color: '#B9BBC6',
        marginTop: 40,
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width * 0.8,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        elevation: 5,
    },
    modalItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
    },
    modalItemText: {
        fontSize: 16,
        color: '#1E1F24',
    },
    selectedModalItemText: {
        color: '#3B5998',
        fontWeight: '700',
    },
});
