import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, Dimensions, FlatList, Modal, Animated, Easing, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';

import RequestDetailsSheet from '../components/requests/RequestDetailsSheet';
import NewRequestScreen from './NewRequestScreen';

import AuthService from '../../Services/AuthService';
import ProfileServices from '../../Services/API/ProfileServices';
import { get } from 'lodash';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import { dateTimeToShow } from '../utils/formatDateTime';
import moment from 'moment';
import { useAttendance } from '../context/AttendanceContext';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import StaggeredEntrance from '../components/common/StaggeredEntrance';
import EmptyState from '../components/common/EmptyState';

const { height } = Dimensions.get('window');

const ManualLogIcon = ({ color = "#1E1F24", size = 22, strokeWidth = 1.6 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M12 6V12L16 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LeaveIcon = ({ color = "#1E1F24", size = 22, strokeWidth = 1.6 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 2V6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 2V6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 10H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const OvertimeIcon = ({ color = "#1E1F24", size = 22, strokeWidth = 1.6 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M12 7V12L15 15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18 18H22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M20 16V20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

const TrainingIcon = ({ color = "#1E1F24", size = 22, strokeWidth = 1.6 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 10L12 5L2 10L12 15L22 10Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6 12V17C6 17 8.5 20 12 20C15.5 20 18 17 18 17V12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PermissionIcon = ({ color = "#1E1F24", size = 22, strokeWidth = 1.6 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 17L15 12L10 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M15 12H3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const WorkFromHomeIcon = ({ color = "#1E1F24", size = 22, strokeWidth = 1.6 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 22V12H15V22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 8C10.3431 8 9 9.34315 9 11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
  </Svg>
);

// Mock Data
const getRequestTypes = (t) => [
  { id: 'all', label: t(tokens.common.all), icon: null },
  { id: 'manual_log', label: t(tokens.nav.manualLog), icon: ManualLogIcon },
  { id: 'leave', label: t(tokens.nav.leave), icon: LeaveIcon },
  { id: 'overtime', label: t(tokens.nav.overtime), icon: OvertimeIcon },
  { id: 'training', label: t(tokens.nav.training), icon: TrainingIcon },
  { id: 'permission', label: t(tokens.requests.permission), icon: PermissionIcon },
  { id: 'wfh', label: t(tokens.nav.wfh), icon: WorkFromHomeIcon },
];

const REQUESTS = [
  {
    id: '1',
    type: 'Check In',
    typeId: 'manual_log',
    icon: ManualLogIcon,
    status: 'Pending',
    date: '15 Jan 2026',
    duration: '1 Day',
    submittedOn: '16 Jan 2026, 09:30AM',
    approver: 'Mohammed Thowfick',
    approverInitials: 'MT',
    reason: '“Late Due To Traffic”',
    workflow: [
      { title: 'Request Submitted', date: '16 Jan 2026, 09:30AM', status: 'completed' },
      { title: 'Manager Approval', date: 'Line Manager: Sarah Ali', status: 'pending' }
    ]
  },
  {
    id: '2',
    type: 'Casual Leave',
    typeId: 'leave',
    icon: LeaveIcon,
    status: 'Approved',
    date: '12 Jan 2026',
    duration: 'First Half',
    submittedOn: '10 Jan 2026, 10:35AM',
    approver: 'Mohammed Thowfick',
    approverInitials: 'MT',
    reason: '“Personal Reason”',
    workflow: [
      { title: 'Request Submitted', date: '10 Jan 2026, 10:35AM', status: 'completed' },
      { title: 'Manager Approval', date: 'Approved By Sarah Ali', status: 'completed' }
    ],
    footerMessage: {
      text: 'The Request Was Approved By Sarah Ali On 11 Jan 2026. The Balance Hass Been Adjusted Accordingly.',
      type: 'success'
    }
  },
  {
    id: '3',
    type: 'Overtime',
    typeId: 'overtime',
    icon: OvertimeIcon,
    status: 'Rejected',
    date: '04 Jan 2026',
    duration: '1 Day',
    submittedOn: '01 Jan 2026, 10:35AM',
    approver: 'Mohammed Thowfick',
    approverInitials: 'MT',
    reason: '“Project Deadline”',
    workflow: [
      { title: 'Request Submitted', date: '01 Jan 2026, 10:35AM', status: 'completed' },
      { title: 'Rejected', date: 'Declined By Sarah Ali On 03 Jan 2026', status: 'rejected' }
    ],
    footerMessage: {
      text: 'Rejection Reason: Insufficient justification',
      type: 'error'
    }
  },
  {
    id: '4',
    type: 'Training',
    typeId: 'training',
    icon: TrainingIcon,
    status: 'Approved',
    date: '03 Jan 2026 - 05 Jan 2026',
    duration: '3 Days',
    submittedOn: '01 Jan 2026, 10:35AM',
    approver: 'Mohammed Thowfick',
    approverInitials: 'MT',
    reason: '“Upskilling for new software”',
    workflow: [
      { title: 'Request Submitted', date: '01 Jan 2026, 10:35AM', status: 'completed' },
      { title: 'Manager Approval', date: 'Approved By Sarah Ali', status: 'completed' }
    ],
    footerMessage: {
      text: 'The Request Was Approved By Sarah Ali On 02 Jan 2026.',
      type: 'success'
    }
  },
  {
    id: '5',
    type: 'Work From Home',
    typeId: 'wfh',
    icon: WorkFromHomeIcon,
    status: 'Pending',
    date: '01 Jan 2026',
    duration: '1 Day',
    submittedOn: '31 Dec 2026, 09:30AM',
    approver: 'Mohammed Thowfick',
    approverInitials: 'MT',
    reason: '“Unable to travel to office on this date”',
    workflow: [
      { title: 'Request Submitted', date: '31 Dec 2025, 10:35AM', status: 'completed' },
      { title: 'Manager Approval', date: 'Line Manager: Sarah Ali', status: 'pending' }
    ]
  },
  {
    id: '6',
    type: 'Permission',
    typeId: 'permission',
    icon: PermissionIcon,
    status: 'Approved',
    date: '02 Jan 2026',
    duration: '2 Hours',
    submittedOn: '01 Jan 2026, 10:35AM',
    approver: 'Mohammed Thowfick',
    approverInitials: 'MT',
    reason: '“Personal Work”',
    workflow: [
      { title: 'Request Submitted', date: '01 Jan 2026, 10:35AM', status: 'completed' },
      { title: 'Manager Approval', date: 'Approved By Sarah Ali', status: 'completed' }
    ],
    footerMessage: {
      text: 'The Request Was Approved By Sarah Ali On 01 Jan 2026.',
      type: 'success'
    }
  },
];

const StatusBadge = ({ status, t }) => {
  let backgroundColor, color;
  switch (status) {
    case 'Pending':
      backgroundColor = '#FFF4E5';
      color = '#FF9800';
      break;
    case 'Approved':
      backgroundColor = '#E8F5E9';
      color = '#27AE60'; // Consistent green
      break;
    case 'Rejected':
      backgroundColor = '#FFEBEE';
      color = '#EB5757';
      break;
    case 'Revoked':
      backgroundColor = '#F5F5F5';
      color = '#9E9E9E';
      break;
    default:
      backgroundColor = '#F0F2F5';
      color = '#62636C';
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor }]}>
      <Text style={[styles.statusText, { color }]}>{getStatusText(status, t)}</Text>
    </View>
  );
};

const getStatusText = (status, t) => {
  switch (status) {
    case 'Approved': return t(tokens.actions.approved);
    case 'Pending': return t(tokens.actions.pending);
    case 'Rejected': return t(tokens.actions.rejected);
    case 'Revoked': return t(tokens.actions.revoked);
    default: return status;
  }
};

const LocalToast = ({ visible, message, type }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true
      }).start(() => setShouldRender(false));
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <Animated.View
      style={[
        styles.localToastContainer,
        {
          opacity: animatedValue,
          transform: [{
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [-40, 0]
            })
          }, {
            scale: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1]
            })
          }]
        }
      ]}
    >
      <View style={styles.localToastContent}>
        <View style={[styles.localToastIcon, { backgroundColor: type === 'success' ? '#2ECC40' : '#E74C3C' }]}>
          <Ionicons name={type === 'success' ? "checkmark-sharp" : "alert-sharp"} size={14} color="#FFF" />
        </View>
        <Text style={styles.localToastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const RequestCard = ({ item, onPress, t }) => {
  const Icon = item.icon;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Icon size={20} color="#1E1F24" strokeWidth={1.8} />
          <Text style={styles.cardTitle}>{item.type}</Text>
        </View>
        <StatusBadge status={item.status} t={t} />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.detailGroup}>
          <Text style={styles.detailLabel}>{t(tokens.common.date)}</Text>
          <Text style={styles.detailValue}>{item.date}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.detailGroup}>
            <Text style={styles.detailLabel}>{t(tokens.common.submittedOn)}</Text>
            <Text style={styles.detailValue}>{item.submittedOn}</Text>
          </View>

          {item.duration && item.duration !== '1 Day' && (
            <>
              <View style={styles.verticalDivider} />
              <View style={styles.detailGroup}>
                <Text style={styles.detailLabel}>{t(tokens.common.duration)}</Text>
                <Text style={styles.detailValue}>{item.duration}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const FloatingMenu = ({ visible, onClose, onSelect, t }) => {
  const [showModal, setShowModal] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      // Reset animations to start state
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);
      translateYAnim.setValue(20);
      
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.34, 1.56, 0.64, 1), // Custom spring-like easing
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1)),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 20,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowModal(false);
      });
    }
  }, [visible]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '135deg']
  });

  const overlayOpacity = opacityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)']
  });

  if (!showModal) return null;

  return (
    <View transparent visible={visible} onRequestClose={onClose} animationType="fade">
      <Animated.View style={[styles.overlay, { backgroundColor: overlayOpacity }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.menuContainer,
            {
              opacity: opacityAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: translateYAnim }
              ]
            }
          ]}
        >
          <LinearGradient
            colors={['#e0e6f8ff', '#FFFFFF', '#e0e6f8ff']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.menuContent}>
            {getRequestTypes(t).slice(1).map((type, index) => (
              <TouchableOpacity
                key={type.id}
                style={styles.menuItem}
                onPress={() => {
                  onSelect(type.id);
                  onClose();
                }}
              >
                <View style={styles.menuIconWrapper}>
                  <type.icon size={22} color="#1E1F24" strokeWidth={1.4} />
                </View>
                <Text style={styles.menuItemText}>{type.label}</Text>
                {index !== getRequestTypes(t).length - 2 && (
                  <View style={styles.menuDivider} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <TouchableOpacity
          style={styles.fabClose}
          onPress={onClose}
          activeOpacity={0.9}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

import { useUser } from '../context/UserContext';

const RequestScreen = ({ onBack, routeParams }) => {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { userDetails } = useUser();
  const { shiftDurationSeconds } = useAttendance();
  const paddingTop = insets.top;

  const [activeStatus, setActiveStatus] = useState('All');
  const [activeType, setActiveType] = useState(routeParams?.activeType || 'all');
  const [showMenu, setShowMenu] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [newRequestType, setNewRequestType] = useState(null);
  const [editingRequestData, setEditingRequestData] = useState(null);

  // API State
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [localToast, setLocalToast] = useState(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Reset pagination when activeType changes
    setPage(1);
    setHasMore(true);
    fetchRequests(false, 1);
  }, [activeType]);

  const fetchRequests = async (isRefresh = false, pageNumber = 1) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
      } else if (pageNumber > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const empID = userDetails?.id;
      // console.log('DEBUG 1: RequestScreen from UserContext empID:', empID);
      if (!empID) {
        console.warn('No Employee ID found in UserContext');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let allFetchPromises = [];

      // Determine what to fetch based on activeType
      if (activeType === 'all') {
        const startDate = moment().locale('en').subtract(1, 'month').format('YYYY-MM-DD');
        const endDate = moment().locale('en').format('YYYY-MM-DD');
        allFetchPromises.push(ProfileServices.getAllTypesRequests({
          employee: empID,
          start_date: startDate,
          end_date: endDate,
          page: pageNumber,
          page_size: 10
        }).then(res => {
          // console.log('DEBUG 4: Unified All Requests Data:', JSON.stringify(res, null, 2));
          const typeMap = {
            'Training': 'training',
            'Manual Log': 'manual_log',
            'Work From Home': 'wfh',
            'Permission': 'permission',
            'Leave': 'leave',
            'Overtime': 'overtime'
          };

          const resData = (Array.isArray(res) ? res : (res?.results || []));
          const items = resData.map(item => {
            let typeId = item.typeId;

            // Map type string to internal typeId if missing
            if (!typeId && item.type) {
              typeId = typeMap[item.type];
            }

            if (!typeId) {
              if (item.leave_type) typeId = 'leave';
              else if (item.overtime_hours) typeId = 'overtime';
              else if (item.manual_log_details || item.actual_check_in) typeId = 'manual_log';
              else if (item.training_name) typeId = 'training';
              else if (item.wfh_date) typeId = 'wfh';
              else typeId = 'manual_log'; // default
            }
            return { ...item, typeId };
          });
          return { items, next: res.next };
        }));
      } else if (activeType === 'manual_log') {
        allFetchPromises.push(ProfileServices.getAllRegularizationRequests({
          emp_id: empID,
          page: pageNumber,
          page_size: 10
        }).then(res => {
          // console.log('DEBUG 4: Manual Log Requests Data:', JSON.stringify(res, null, 2));
          const items = (get(res, 'results') || res || []).map(item => ({ ...item, typeId: 'manual_log' }));
          return { items, next: res.next };
        }));
      } else {
        // Individual fetches for other types if specifically requested
        if (activeType === 'leave') {
          allFetchPromises.push(ProfileServices.getLeaveData(empID, pageNumber, 10).then(res => {
            const items = (get(res, 'results') || []).map(item => ({ ...item, typeId: 'leave' }));
            return { items, next: res.next };
          }));
        }
        if (activeType === 'overtime') {
          // getOvertimeData is 0-indexed for page parameter in ProfileServices
          allFetchPromises.push(ProfileServices.getOvertimeData({ id: empID, page: pageNumber - 1, size: 10 }).then(res => {
            const items = (get(res, 'results') || []).map(item => ({ ...item, typeId: 'overtime' }));
            return { items, next: res.next };
          }));
        }
        if (activeType === 'permission') {
          allFetchPromises.push(ProfileServices.getPermissionData({ id: empID, page: pageNumber, size: 10 }).then(res => {
            const items = (get(res, 'results') || []).map(item => ({ ...item, typeId: 'permission' }));
            return { items, next: res.next };
          }));
        }
        if (activeType === 'wfh') {
          allFetchPromises.push(ProfileServices.getWorkFromHomeRequest({ id: empID, page: pageNumber, size: 10 }).then(res => {
            const items = (get(res, 'results') || []).map(item => ({ ...item, typeId: 'wfh' }));
            return { items, next: res.next };
          }));
        }
        if (activeType === 'training') {
          allFetchPromises.push(ProfileServices.listTrainingRequests(empID, pageNumber, 10).then(res => {
            const items = (get(res, 'results') || []).map(item => ({ ...item, typeId: 'training' }));
            return { items, next: res.next };
          }));
        }
      }

      const results = await Promise.all(allFetchPromises);
      const newItems = results.flatMap(r => r.items);
      const hasNextPage = results.some(r => !!r.next);
      setHasMore(hasNextPage);

      const flatResults = newItems;
      const mappedRequests = flatResults.map((item, idx) => {
        let typeLabel = '';
        let icon = ManualLogIcon;

        const punchStateMap = {
          '0': t(tokens.punchStates.checkIn),
          '1': t(tokens.punchStates.checkOut),
          '2': t(tokens.punchStates.breakIn),
          '3': t(tokens.punchStates.breakOut),
          '4': t(tokens.punchStates.overtimeIn),
          '5': t(tokens.punchStates.overtimeOut),
          0: t(tokens.punchStates.checkIn),
          1: t(tokens.punchStates.checkOut),
          2: t(tokens.punchStates.breakIn),
          3: t(tokens.punchStates.breakOut),
          4: t(tokens.punchStates.overtimeIn),
          5: t(tokens.punchStates.overtimeOut)
        };

        const statusMap = {
          0: 'Pending',
          1: 'Pending',
          2: 'Approved',
          3: 'Rejected',
          4: 'Revoked',
          '0': 'Pending',
          '1': 'Pending',
          '2': 'Approved',
          '3': 'Rejected',
          '4': 'Revoked'
        };

        if (item.typeId === 'manual_log') {
          // New format might use punch_state ID
          const stateLabel = punchStateMap[item.punch_state] || item.punch_state || 'Manual Log';
          typeLabel = stateLabel;
          icon = ManualLogIcon;
        } else if (item.typeId === 'leave') {
          typeLabel = item.leave_name || item.leave_type_name || t(tokens.nav.leave);
          icon = LeaveIcon;
        } else if (item.typeId === 'overtime') {
          typeLabel = item.ot_type ? `${item.ot_type.charAt(0).toUpperCase() + item.ot_type.slice(1)} ${t(tokens.nav.overtime)}` : t(tokens.nav.overtime);
          icon = OvertimeIcon;
        } else if (item.typeId === 'permission') {
          typeLabel = t(tokens.requests.permission);
          icon = PermissionIcon;
        } else if (item.typeId === 'wfh') {
          typeLabel = t(tokens.nav.wfh);
          icon = WorkFromHomeIcon;
        } else if (item.typeId === 'training') {
          typeLabel = t(tokens.nav.training);
          icon = TrainingIcon;
        }

        const date = item.start_time || item.punch_time || item.manual_log_date || item.date || item.from_date || '--';
        const formattedDate = date !== '--' ? new Date(date).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-GB') : '--';

        const approverName = get(item, 'node_instances[0].approver_employee.employee_name') || 'Manager';
        const rawStatus = item.approval_status !== undefined ? item.approval_status : (item.status !== undefined ? item.status : 1);
        const statusLabel = statusMap[rawStatus] || (typeof rawStatus === 'string' && rawStatus ? rawStatus : 'Pending');

        // Build Workflow dynamically
        const workflow = (item.node_instances || []).map(node => ({
          title: node.approver_employee?.employee_name || 'Approver',
          date: node.status == 2
            ? (node.actioned_at ? dateTimeToShow(node.actioned_at) : 'Approved')
            : (node.status == 3 ? 'Rejected' : 'Pending'),
          status: node.status == 2 ? 'completed' : (node.status == 3 ? 'rejected' : 'pending')
        }));

        // Add "Request Submitted" step at the beginning
        workflow.unshift({
          title: t(tokens.expense.requestSubmitted),
          date: dateTimeToShow(item.apply_time || item.created_at) || '',
          status: 'completed'
        });

        // Derive footer message
        let footerMessage = null;
        const nodes = item.node_instances || [];

        // prioritize rejection notes
        let rejectedNode = nodes.find(n => n.status == 3 || n.status == '3');
        let approvedNode = [...nodes].reverse().find(n => n.status == 2 || n.status == '2');

        // Robust fallback: If nodes are missing but status is Rejected/Approved, try top-level fields
        const isRejectedStatus = statusLabel && (statusLabel.toLowerCase() === 'rejected');
        const isApprovedStatus = statusLabel && (statusLabel.toLowerCase() === 'approved');

        if (!rejectedNode && isRejectedStatus) {
          rejectedNode = {
            approver_employee: { employee_name: item.rejected_by_name || item.approver_name || 'Manager' },
            actioned_at: item.rejected_at || item.actioned_at || item.updated_at,
            reject_reason: item.reject_reason || item.rejection_reason || item.reason
          };
        }

        if (!approvedNode && isApprovedStatus) {
          approvedNode = {
            approver_employee: { employee_name: item.approved_by_name || item.approver_name || 'Manager' },
            actioned_at: item.approved_at || item.actioned_at || item.updated_at
          };
        }

        if (rejectedNode) {
          const approver = rejectedNode.approver_employee?.employee_name || 'Manager';
          const actionDate = rejectedNode.actioned_at ? new Date(rejectedNode.actioned_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
          const reason = rejectedNode.reject_reason || 'Insufficient justification';

          footerMessage = {
            text: t(tokens.messages.requestRejectedBy, { approver, date: actionDate }) + `\n` + t(tokens.messages.rejectionReasonLabel) + reason,
            type: 'error'
          };
        } else if (approvedNode && isApprovedStatus) {
          const approver = approvedNode.approver_employee?.employee_name || 'Manager';
          const actionDate = approvedNode.actioned_at ? new Date(approvedNode.actioned_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

          let messageText = t(tokens.messages.requestApprovedBy, { approver, date: actionDate });
          if (item.typeId === 'leave') {
            messageText += t(tokens.messages.balanceAdjusted);
          }
          footerMessage = {
            text: messageText,
            type: 'success'
          };
        }

        // Local formatters removed in favor of global utilities

        const formatDate = (dateStr) => {
          if (!dateStr || dateStr === '--') return '--';
          return dateTimeToShow(dateStr).split(',')[0]; // Extract date part
        };

        const formatAsUTC = (dateStr, formatStr = 'DD MMM YYYY') => {
          if (!dateStr || dateStr === '--') return '--';
          return moment.utc(dateStr).locale(i18n.language).format(formatStr);
        };

        return {
          ...item,
          uiKey: `${item.typeId || 'manual_log'}-${item.id || idx}-${pageNumber}-${idx}`,
          type: typeLabel,
          typeId: item.typeId || 'manual_log',
          icon: icon,
          status: statusLabel,
          date: (() => {
            const start = item.start_time || item.from_date || item.punch_time || item.manual_log_date || date;
            const end = item.end_time || item.to_date;

            if (item.typeId === 'wfh' || item.typeId === 'leave' || item.typeId === 'training') {
              if (start && end && formatAsUTC(start) !== formatAsUTC(end)) {
                return `${formatAsUTC(start, 'DD MMM')} - ${formatAsUTC(end, 'DD MMM YYYY')}`;
              }
              return formatAsUTC(start || date);
            }

            if (item.typeId === 'overtime') {
              return formatAsUTC(start || date);
            }

            // Manual log or other: use local time date part
            return formatAsUTC(start || date);
          })(),
          rawPunchTime: item.punch_time, // Pass raw for editing
          duration: item.typeId === 'leave'
            ? (() => {
              const start = item.start_time;
              const end = item.end_time;
              if (start && end) {
                const s = new Date(start);
                const e = new Date(end);

                // Same-day check (ignoring time)
                const sMid = new Date(s.getFullYear(), s.getMonth(), s.getDate());
                const eMid = new Date(e.getFullYear(), e.getMonth(), e.getDate());
                const diffDays = Math.round((eMid - sMid) / (1000 * 60 * 60 * 24));

                if (diffDays === 0) {
                  let hourDiff = (e - s) / (1000 * 60 * 60);
                  if (hourDiff < 0) hourDiff += 24;
                  const shiftHours = (shiftDurationSeconds / 3600) || 9;
                  const days = hourDiff / shiftHours;
                  // If close to full shift, show 1.0
                  return days >= 0.98 ? `1.0 ${t(tokens.common.days)}` : `${days.toFixed(1)} ${t(tokens.common.days)}`;
                }
                return `${diffDays + 1}.0 ${t(tokens.common.days)}`;
              }
              return item.requested_leave ? `${item.requested_leave} ${t(tokens.common.days)}` : (item.total_days ? `${item.total_days} ${t(tokens.common.days)}` : '--');
            })()
            : item.typeId === 'training'
              ? (() => {
                const start = item.start_time;
                const end = item.end_time;
                if (start && end) {
                  const s = new Date(start);
                  const e = new Date(end);
                  const diffTime = e - s;
                  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                  return `${diffDays + 1} ${diffDays + 1 === 1 ? 'Day' : 'Days'}`;
                }
                return '--';
              })()
              : (item.typeId === 'overtime' || item.typeId === 'permission')
                ? (() => {
                  const hours = item.typeId === 'overtime' ? item.ot_hours : item.permission_hours;
                  if (hours) return `${parseFloat(hours).toFixed(1)} ${t(tokens.common.hours)}`;

                  const start = item.start_time;
                  const end = item.end_time;
                  if (start && end) {
                    const diffMs = new Date(end) - new Date(start);
                    const diffHrs = diffMs / (1000 * 60 * 60);
                    return `${diffHrs.toFixed(1)} ${t(tokens.common.hours)}`;
                  }
                  return '--';
                })()
                : (item.typeId === 'wfh')
                  ? (item.whf_days ? `${item.whf_days} ${item.whf_days === 1 ? 'Day' : 'Days'}` : (() => {
                    const start = item.start_time;
                    const end = item.end_time;
                    if (start && end) {
                      const s = new Date(start);
                      const e = new Date(end);
                      s.setHours(0, 0, 0, 0);
                      e.setHours(0, 0, 0, 0);
                      const diffTime = e - s;
                      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                      return `${diffDays + 1} ${diffDays + 1 === 1 ? 'Day' : 'Days'}`;
                    }
                    return '--';
                  })())
                  : (item.typeId === 'manual_log')
                    ? (() => {
                      const time = item.punch_time || item.start_time || item.actual_check_in ||
                        (item.manual_log_details?.[0]?.actual_check_in) ||
                        (item.manual_log_details?.[0]?.punch_time);
                      if (time) return moment(time).format('hh:mm A');
                      return '--:--';
                    })()
                    : '1 Day',
          submittedOn: dateTimeToShow(item.apply_time || item.created_at),
          approver: approverName,
          approverInitials: approverName.charAt(0),
          reason: item.apply_reason || item.reason || '',
          workflow: workflow,
          footerMessage: footerMessage
        };
      }).sort((a, b) => new Date(b.date) - new Date(a.date));

      if (pageNumber === 1) {
        setRequests(mappedRequests);
      } else {
        setRequests(prev => {
          // Filter out any duplicates just in case
          const existingIds = new Set(prev.map(r => r.uiKey));
          const uniqueNew = mappedRequests.filter(r => !existingIds.has(r.uiKey));
          return [...prev, ...uniqueNew];
        });
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRequests(false, nextPage);
    }
  };

  const filteredRequests = requests.filter(item => {
    const statusMatch = activeStatus === 'All' || item.status === activeStatus;
    const typeMatch = activeType === 'all' || item.typeId === activeType;
    return statusMatch && typeMatch;
  });

  const handleCardPress = async (item) => {
    setSelectedRequest(item);
    setIsSheetVisible(true);

    try {
      const moduleMap = {
        'manual_log': 'manual_log',
        'leave': 'leave',
        'overtime': 'overtime',
        'training': 'training',
        'wfh': 'work_from_home',
        'permission': 'permissions'
      };

      const module = moduleMap[item.typeId] || 'manual_log';
      const response = await ProfileServices.getRequestApprovers(item.id, module);
      
      if (response && response.approvers) {
        const approverWorkflow = response.approvers.map(app => ({
          title: app.approver_name,
          date: app.approver_position,
          status: app.status === 2 ? 'completed' : (app.status === 3 ? 'rejected' : 'pending')
        }));

        // Merge with existing "Request Submitted" step if present
        const fullWorkflow = [
          ...(item.workflow?.[0]?.title === 'Request Submitted' ? [item.workflow[0]] : []),
          ...approverWorkflow
        ];

        setSelectedRequest(prev => ({
          ...prev,
          workflow: fullWorkflow
        }));
      }
    } catch (error) {
      console.error('Error fetching approvers:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingRequestData(item);
    setNewRequestType(item.typeId);
    setIsCreatingRequest(true);
    setIsSheetVisible(false);
  };

  if (isCreatingRequest) {
    return (
      <NewRequestScreen
        type={newRequestType}
        editingData={editingRequestData}
        onRefresh={fetchRequests}
        onBack={() => {
          setIsCreatingRequest(false);
          setEditingRequestData(null);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8EA3E3', '#FFFFFF']}
        locations={[0, 0.3]}
        style={styles.background}
      />

      <LocalToast
        visible={!!localToast}
        message={localToast?.message}
        type={localToast?.type}
      />

      {/* Fixed Header and Filters Section */}
      <View style={{ paddingHorizontal: scale(16), paddingTop: paddingTop + 12 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1F24" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t(tokens.nav.request)}</Text>
        </View>

        {/* Status Filter */}
        <View style={styles.statusFilterContainer}>
          <Text style={styles.sectionLabel}>{t(tokens.common.status)}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusTabsScroll}
          >
            {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusTab,
                  activeStatus === status && styles.activeStatusTab
                ]}
                onPress={() => setActiveStatus(status)}
              >
                <Text style={[
                  styles.statusTabText,
                  activeStatus === status && styles.activeStatusTabText
                ]}>{status === 'All' ? t(tokens.common.all) : getStatusText(status, t)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Type Filter */}
        <View style={styles.typeFilterContainer}>
          <Text style={styles.sectionLabel}>{t(tokens.common.type)}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeScrollContent}>
            {getRequestTypes(t).map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeChip,
                  activeType === type.id && styles.activeTypeChip
                ]}
                onPress={() => setActiveType(type.id)}
              >
                {type.icon && (
                  <View style={{ marginRight: 6 }}>
                    <type.icon
                      width={16}
                      height={16}
                      color={activeType === type.id ? '#4169E1' : '#62636C'}
                    />
                  </View>
                )}
                <Text style={[
                  styles.typeChipText,
                  activeType === type.id && styles.activeTypeChipText
                ]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Request List (Scrollable) */}
      <View style={{ flex: 1 }}>
        {loading && !refreshing ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#4169E1" />
            <Text style={[styles.emptyText, { marginTop: 12 }]}>{t(tokens.messages.loadingRequests)}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredRequests}
            keyExtractor={(item) => item.uiKey}
            scrollEnabled={true}
            renderItem={({ item, index }) => (
            <StaggeredEntrance index={index}>
              <RequestCard
                item={item}
                onPress={() => handleCardPress(item)}
                t={t}
              />
            </StaggeredEntrance>
          )}
            contentContainerStyle={[styles.listContainer, { paddingHorizontal: scale(16) }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchRequests(true)} tintColor="#4169E1" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="document-text-outline" size={48} color="#D1D3D9" />
                </View>
                <Text style={styles.emptyText}>{t(tokens.messages.noRequests)}</Text>
                <TouchableOpacity
                  style={styles.emptyAddButton}
                  onPress={() => setShowMenu(true)}
                >
                  <Text style={styles.emptyAddButtonText}>{t(tokens.actions.add)}</Text>
                </TouchableOpacity>
              </View>
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() =>
              loadingMore ? (
                <View style={{ paddingVertical: 20 }}>
                  <ActivityIndicator size="small" color="#4169E1" />
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowMenu(true)}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      <FloatingMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        onSelect={(typeId) => {
          setNewRequestType(typeId);
          setIsCreatingRequest(true);
        }}
        t={t}
      />

      <RequestDetailsSheet
        visible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
        request={selectedRequest}
        onRefresh={fetchRequests}
        onEdit={handleEdit}
        onShowToast={(toast) => {
          setLocalToast(toast);
          setTimeout(() => setLocalToast(null), 3000);
        }}
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
    paddingHorizontal: scale(16),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  backButton: {
    marginRight: scale(16),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#1E1F24',
  },
  sectionLabel: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#1E1F24',
    marginBottom: verticalScale(12),
  },
  statusFilterContainer: {
    marginBottom: verticalScale(20),
  },
  statusTabsScroll: {
    flexDirection: 'row',
    gap: scale(12),
    paddingRight: scale(16),
  },
  statusTab: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    borderRadius: moderateScale(8),
  },
  activeStatusTab: {
    backgroundColor: '#4169E1',
  },
  statusTabText: {
    fontSize: moderateScale(14),
    color: '#9E9E9E',
    fontWeight: '500',
  },
  activeStatusTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  typeFilterContainer: {
    marginBottom: verticalScale(20),
  },
  typeScrollContent: {
    gap: scale(12),
    paddingRight: scale(16),
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#EFF0F3',
    backgroundColor: '#FFFFFF',
  },
  activeTypeChip: {
    borderColor: '#4169E1',
    backgroundColor: '#FFFFFF',
  },
  typeChipText: {
    fontSize: moderateScale(13),
    color: '#62636C',
    fontWeight: '500',
  },
  activeTypeChipText: {
    color: '#4169E1',
    fontWeight: '600',
  },
  listContainer: {
    gap: verticalScale(16),
    paddingBottom: verticalScale(100),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#EFF0F3',
    padding: scale(16),
    overflow: 'hidden',
    marginBottom: verticalScale(8),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
    position: 'relative',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  cardTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#1E1F24',
  },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(6),
  },
  statusText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    gap: verticalScale(12),
  },
  divider: {
    height: 1,
    backgroundColor: '#EFF0F3',
    marginVertical: verticalScale(4),
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailGroup: {
    gap: verticalScale(2),
  },
  verticalDivider: {
    width: 1,
    height: verticalScale(24),
    backgroundColor: '#EFF0F3',
    marginHorizontal: scale(12),
  },
  detailLabel: {
    fontSize: moderateScale(10),
    color: '#9E9E9E',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: moderateScale(14),
    color: '#1E1F24',
    fontWeight: '700',
  },
  approverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  avatar: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: '#8E44AD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  approverName: {
    fontSize: moderateScale(12),
    color: '#1E1F24',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: scale(20),
    bottom: verticalScale(30),
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: '#4169E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4169E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(80),
  },
  emptyIconContainer: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: '#F8F9FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  emptyText: {
    fontSize: moderateScale(16),
    color: '#9E9E9E',
    fontWeight: '500',
    marginBottom: verticalScale(24),
  },
  emptyAddButton: {
    backgroundColor: '#EDF2FE',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(24),
    borderRadius: moderateScale(12),
  },
  emptyAddButtonText: {
    color: '#4169E1',
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    bottom: verticalScale(100),
    right: scale(24),
    width: scale(200),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    borderColor: "white",
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  menuContent: {
    paddingVertical: verticalScale(10),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    gap: scale(12),
  },
  menuIconWrapper: {
    width: scale(24),
    height: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDivider: {
    position: 'absolute',
    bottom: 0,
    left: scale(48),
    right: scale(16),
    height: 1,
    backgroundColor: '#F0F2F5',
  },
  menuItemText: {
    fontSize: moderateScale(16),
    color: '#343B45',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  fabClose: {
    position: 'absolute',
    right: scale(20),
    bottom: verticalScale(30),
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: '#4169E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4169E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  localToastContainer: {
    position: 'absolute',
    top: verticalScale(50),
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  localToastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(30),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  localToastIcon: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  localToastText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#1E1F24',
    letterSpacing: -0.2,
  },
});

export default RequestScreen;