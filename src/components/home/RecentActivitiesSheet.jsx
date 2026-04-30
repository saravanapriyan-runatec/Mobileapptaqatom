import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileServices from '../../../Services/API/ProfileServices';
import AuthService from '../../../Services/AuthService';
import { get } from 'lodash';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';

import { useUser } from '../../../src/context/UserContext';
import { DatePickerModal } from 'react-native-paper-dates';
import moment from 'moment';
import { scale, verticalScale, moderateScale } from '../../utils/responsive';

const { height } = Dimensions.get('window');

export default function RecentActivitiesSheet({ visible, animatedValue, onClose }) {
    const insets = useSafeAreaInsets();
    const { userDetails } = useUser();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAtTop, setIsAtTop] = useState(true);
    const { t } = useTranslation();

    // Date Filtering States
    const [startDate, setStartDate] = useState(moment().subtract(30, 'days').toDate());
    const [endDate, setEndDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [hasSelectedDate, setHasSelectedDate] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchActivities();
        }
    }, [visible, startDate, endDate]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const employeeId = userDetails?.id;
            
            if (!employeeId) {
                console.warn("⚠️ RecentActivitiesSheet: No employee ID found in userDetails");
                setLoading(false);
                return;
            }

            const formatDate = (date) => {
                return moment(date).locale('en').format('YYYY-MM-DD');
            };

            const response = await ProfileServices.getRecentActivityAllData({
                emp_id: employeeId,
                start: formatDate(startDate),
                end: formatDate(endDate)
            });

            // console.log("🚀 Recent Activities API Response:", JSON.stringify(response, null, 2));

            const results = Array.isArray(response) ? response : (get(response, 'results') || []);
            const mappedActivities = results.map((log) => {
                // Use punch_time or clock_in_time if available, fallback to updated_at
                const rawTime = log.punch_time || log.clock_in_time || log.updated_at;
                const dateTime = moment(rawTime);
                const isCheckIn = String(log.clock_type) === '0';
                
                return {
                    id: log.id.toString(),
                    type: isCheckIn ? 'Check In' : 'Check Out',
                    date: dateTime.isValid() ? dateTime.format('DD MMM YYYY') : '-',
                    time: dateTime.isValid() ? dateTime.format('hh:mm A') : '--:--',
                    isCheckIn: isCheckIn
                };
            });

            setActivities(mappedActivities);
        } catch (err) {
            console.error('Error fetching recent activities:', err);
        } finally {
            setLoading(false);
        }
    };

    const onConfirmDate = React.useCallback(
        ({ startDate: selectedStart, endDate: selectedEnd }) => {
            setShowPicker(false);
            if (selectedStart && selectedEnd) {
                setStartDate(selectedStart);
                setEndDate(selectedEnd);
                setHasSelectedDate(true);
            }
        },
        [setShowPicker, setStartDate, setEndDate]
    );

    const handleOpenPicker = () => {
        setShowPicker(true);
    };

    const opacity = animatedValue ? animatedValue.interpolate({
        inputRange: [0, 50, 150],
        outputRange: [0, 0, 1],
        extrapolate: 'clamp'
    }) : 1;

    return (
        <Animated.View
            style={[styles.backgroundContainer, { paddingTop: insets.top + 15, opacity }]}
        >
            <View style={styles.header}>
                <Text style={styles.title}>{t(tokens.dashboard.recentActivities)}</Text>
                <View style={styles.headerRight}>
                    {hasSelectedDate ? (
                        <TouchableOpacity style={styles.dateRangeBadge} onPress={handleOpenPicker}>
                            <Ionicons name="calendar-outline" size={scale(14)} color="#1E1F24" />
                            <Text style={styles.dateRangeText}>
                                {moment(startDate).format('DD/MM/YYYY')} - {moment(endDate).format('DD/MM/YYYY')}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.calendarButton} onPress={handleOpenPicker}>
                            <Ionicons name="calendar-outline" size={scale(22)} color="#1E1F24" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <DatePickerModal
                locale="en"
                mode="range"
                visible={showPicker}
                onDismiss={() => setShowPicker(false)}
                startDate={startDate}
                endDate={endDate}
                onConfirm={onConfirmDate}
                validRange={{ endDate: new Date() }}
            />

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#395CC6" />
                </View>
            ) : (
                <ScrollView
                    style={styles.list}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={visible}
                    onScroll={(e) => {
                        const offset = e.nativeEvent.contentOffset.y;
                        setIsAtTop(offset <= 0);
                    }}
                    scrollEventThrottle={16}
                >
                    {activities.length > 0 ? (
                        activities.map((item) => (
                            <View key={item.id} style={styles.activityCard}>
                                <View>
                                    <Text style={styles.activityType}>{item.type}</Text>
                                    <Text style={styles.activityDate}>{item.date}</Text>
                                </View>
                                <Text style={styles.activityTime}>{item.time}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{t(tokens.dashboard.noActivities)}</Text>
                        </View>
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    backgroundContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.95,
        paddingHorizontal: scale(20),
        zIndex: 0,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(20),
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(8),
    },
    title: {
        fontSize: moderateScale(16),
        fontWeight: '600',
        color: '#1E1F24',
    },
    dateRangeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingVertical: verticalScale(5),
        paddingHorizontal: scale(10),
        borderRadius: moderateScale(6),
        borderWidth: 1,
        borderColor: '#EFF0F3',
        gap: scale(6),
    },
    dateRangeText: {
        fontSize: moderateScale(11),
        color: '#1E1F24',
        fontWeight: '400',
    },
    calendarButton: {
        padding: scale(6),
        borderWidth: 1,
        borderColor: '#EFF0F3',
        borderRadius: moderateScale(8),
        backgroundColor: '#FFFFFF',
    },
    list: {
        flex: 1,
    },
    activityCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: verticalScale(14),
        paddingHorizontal: scale(16),
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0F2F5',
        borderRadius: moderateScale(12),
        marginBottom: verticalScale(10),
    },
    activityType: {
        fontSize: moderateScale(14),
        fontWeight: '600',
        color: '#1E1F24',
        marginBottom: verticalScale(4),
    },
    activityDate: {
        fontSize: moderateScale(12),
        color: '#9CA3AF',
    },
    activityTime: {
        fontSize: moderateScale(14),
        fontWeight: '600',
        color: '#1E1F24',
    },
    loaderContainer: {
        height: verticalScale(200),
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        height: verticalScale(100),
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#62636C',
        fontSize: moderateScale(14),
    },
});
 
 