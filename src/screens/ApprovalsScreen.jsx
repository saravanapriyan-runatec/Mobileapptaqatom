import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, FlatList, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import ApprovalDetailsSheet from '../components/approvals/ApprovalDetailsSheet';
import ProfileServices from '../../Services/API/ProfileServices';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import { ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect } from 'react';
import { dateTimeToShow } from '../utils/formatDateTime';
import moment from 'moment';
import { Modal, TextInput, Animated } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAttendance } from '../context/AttendanceContext';
import EmptyState from '../components/common/EmptyState';
import StaggeredEntrance from '../components/common/StaggeredEntrance';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
const { height } = Dimensions.get('window');

// --- Icons (Copied from RequestScreen for consistency) ---
const ManualLogIcon = ({ color = "#1E1F24", width = 16, height = 16, strokeWidth = 1 }) => (
  <Svg width={width} height={height} viewBox="0 0 16 16" fill="none">
    <Path d="M8 4V8L10.6667 9.33333" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.3333 8V11.3333" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.3333 14H13.34" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14.1667 5.46684C13.6638 4.24109 12.8071 3.19298 11.7059 2.45626C10.6047 1.71955 9.30901 1.32765 7.98412 1.33058C6.65922 1.33352 5.36525 1.73115 4.26734 2.47274C3.16944 3.21432 2.31739 4.26622 1.81995 5.49419C1.32251 6.72216 1.20224 8.0705 1.47448 9.36712C1.74672 10.6637 2.39914 11.8498 3.34845 12.774C4.29777 13.6982 5.50094 14.3186 6.80439 14.556C8.10785 14.7934 9.45248 14.637 10.6667 14.1068" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LeaveIcon = ({ color = "#1E1F24", width = 16, height = 16, strokeWidth = 1 }) => (
  <Svg width={width} height={height} viewBox="0 0 16 16" fill="none">
    <Path d="M10.6667 12.6665H14.6667" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10.6667 1.3335V4.00016" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 9.99984V3.99984C14 3.64622 13.8595 3.30708 13.6095 3.05703C13.3594 2.80698 13.0203 2.6665 12.6667 2.6665H3.33333C2.97971 2.6665 2.64057 2.80698 2.39052 3.05703C2.14048 3.30708 2 3.64622 2 3.99984V13.3332C2 13.6868 2.14048 14.0259 2.39052 14.276C2.64057 14.526 2.97971 14.6665 3.33333 14.6665H9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M2 6.6665H14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5.33331 1.3335V4.00016" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const OvertimeIcon = ({ color = "#1E1F24", width = 16, height = 16, strokeWidth = 1 }) => (
  <Svg width={width} height={height} viewBox="0 0 16 16" fill="none">
    <Path d="M8 4V8L10.4293 9.21467" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10.6667 12.6665H14.6667" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12.6667 10.6665V14.6665" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14.6133 8.84449C14.7895 7.46496 14.5298 6.06488 13.8706 4.84029C13.2114 3.61571 12.1858 2.62793 10.9372 2.01526C9.68874 1.4026 8.27988 1.19573 6.90795 1.42361C5.53602 1.6515 4.2697 2.30273 3.28631 3.28612C2.30291 4.26952 1.65168 5.53584 1.42379 6.90777C1.19591 8.2797 1.40278 9.68855 2.01545 10.9371C2.62811 12.1856 3.61589 13.2112 4.84048 13.8704C6.06506 14.5296 7.46514 14.7893 8.84467 14.6132" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TrainingIcon = ({ color = "#1E1F24", width = 16, height = 16, strokeWidth = 1 }) => (
  <Svg width={width} height={height} viewBox="0 0 16 16" fill="none">
    <Path d="M14.28 7.28125C14.3993 7.2286 14.5006 7.14209 14.5713 7.03245C14.6419 6.9228 14.6789 6.79484 14.6775 6.6644C14.6762 6.53397 14.6366 6.40679 14.5637 6.29863C14.4908 6.19048 14.3877 6.10608 14.2673 6.05591L8.55332 3.45325C8.37961 3.37401 8.19091 3.33301 7.99999 3.33301C7.80906 3.33301 7.62036 3.37401 7.44665 3.45325L1.73332 6.05325C1.61463 6.10523 1.51366 6.19067 1.44277 6.29912C1.37187 6.40758 1.33411 6.53434 1.33411 6.66391C1.33411 6.79348 1.37187 6.92025 1.44277 7.0287C1.51366 7.13716 1.61463 7.2226 1.73332 7.27458L7.44665 9.87991C7.62036 9.95915 7.80906 10.0002 7.99999 10.0002C8.19091 10.0002 8.37961 9.95915 8.55332 9.87991L14.28 7.28125Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14.6667 6.6665V10.6665" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 8.3335V10.6668C4 11.1973 4.42143 11.706 5.17157 12.081C5.92172 12.4561 6.93913 12.6668 8 12.6668C9.06087 12.6668 10.0783 12.4561 10.8284 12.081C11.5786 11.706 12 11.1973 12 10.6668V8.3335" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PermissionIcon = ({ color = "#1E1F24", width = 16, height = 16, strokeWidth = 1 }) => (
  <Svg width={width} height={height} viewBox="0 0 16 16" fill="none">
    <Path d="M7.33334 13.3335H1.33334" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7.33334 3.04114V13.8125C7.33337 13.9137 7.35647 14.0137 7.40088 14.1047C7.44529 14.1957 7.50985 14.2754 7.58966 14.3377C7.66947 14.4 7.76243 14.4434 7.86149 14.4644C7.96054 14.4854 8.06309 14.4836 8.16134 14.4591L12.6667 13.3331V3.70781C12.6666 3.41048 12.5672 3.1217 12.3842 2.88736C12.2012 2.65302 11.9451 2.48657 11.6567 2.41447L8.99001 1.74781C8.79351 1.69869 8.5884 1.69498 8.39026 1.73698C8.19211 1.77897 8.00614 1.86555 7.84645 1.99015C7.68676 2.11475 7.55756 2.27409 7.46866 2.45608C7.37975 2.63807 7.33348 2.83859 7.33334 3.04114Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7.33333 2.6665H5.33333C4.97971 2.6665 4.64057 2.80698 4.39052 3.05703C4.14048 3.30708 4 3.64622 4 3.99984V13.3332" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9.33334 8H9.34001" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14.6667 13.3335H12.6667" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const WorkFromHomeIcon = ({ color = "#1E1F24", width = 16, height = 16, strokeWidth = 1 }) => (
  <Svg width={width} height={height} viewBox="0 0 16 16" fill="none">
    <Path d="M6.33334 9.24378C6.80707 8.86605 7.3953 8.6609 8.00118 8.66211C8.60706 8.66333 9.19447 8.87083 9.66668 9.25045" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 11.3335H8.00667" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M2 6.66666C1.99995 6.47271 2.04222 6.28108 2.12386 6.10514C2.20549 5.9292 2.32453 5.77319 2.47267 5.64799L7.13933 1.64799C7.37999 1.4446 7.6849 1.33301 8 1.33301C8.3151 1.33301 8.62001 1.4446 8.86067 1.64799L13.5273 5.64799C13.6755 5.77319 13.7945 5.9292 13.8761 6.10514C13.9578 6.28108 14 6.47271 14 6.66666V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V6.66666Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4.66666 7.16951C5.61259 6.41216 6.78823 5.99951 7.99999 5.99951C9.21175 5.99951 10.3874 6.41216 11.3333 7.16951" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// --- Components ---

const StatusBadge = ({ status }) => {
  let backgroundColor, color;
  switch (status) {
    case 'Pending':
      backgroundColor = 'rgba(243, 156, 18, 0.1)'; // #f39c121a
      color = '#F39C12'; // Orange/Yellow text
      break;
    case 'Approved':
      backgroundColor = 'rgba(46, 204, 64, 0.1)'; // Light Green
      color = '#2ECC40'; // Green text
      break;
    case 'Rejected':
      backgroundColor = 'rgba(231, 76, 60, 0.1)'; // Light Red
      color = '#E74C3C'; // Red text
      break;
    case 'Revoked':
      backgroundColor = 'rgba(127, 140, 141, 0.1)'; 
      color = '#7F8C8D'; 
      break;
    default:
      backgroundColor = '#F0F2F5';
      color = '#62636C';
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor }]}>
      <Text style={[styles.statusText, { color }]}>{status}</Text>
    </View>
  );
};

const ApprovalCard = ({ item, onPress }) => {
  const Icon = item.icon || ManualLogIcon;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Icon />
          <Text style={styles.cardTitle}>{item.type}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, gap: 12 }}>
          {/* Details Row 1 */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{item.date}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{item.typeCategory === 'Manual Log' ? 'Time' : 'Duration'}</Text>
              <Text style={styles.detailValue}>{item.duration}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Details Row 2 */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Submitted On</Text>
              <Text style={styles.detailValue}>{item.submittedOn}</Text>
            </View>
            <View style={styles.verticalDivider} />

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Awaiting Approval</Text>
              <Text style={styles.detailValue}>{item.awaitingApproval}</Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#9E9E9E" style={{ marginLeft: 16 }} />
      </View>
    </TouchableOpacity>
  );
};

const LocalToast = ({ visible, message, type }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = React.useState(visible);

  React.useEffect(() => {
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
        <View style={[styles.localToastIcon, { backgroundColor: type === 'success' ? '#10B981' : '#EF4444' }]}>
          <Ionicons name={type === 'success' ? "checkmark-sharp" : "alert-sharp"} size={14} color="#FFF" />
        </View>
        <Text style={styles.localToastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const ReasonModal = ({ visible, title, value, onValueChange, onClose, onSubmit, loading, toast, error }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <LocalToast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
      />
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title}</Text>
        <TextInput
          style={[
            styles.reasonInput,
            error && styles.reasonInputError
          ]}
          placeholder="Enter reason here..."
          value={value}
          onChangeText={onValueChange}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <View style={styles.modalButtons}>
          <TouchableOpacity 
            style={[styles.modalButton, styles.cancelButton]} 
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modalButton, styles.submitButton]} 
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

export default function ApprovalsScreen({ onBack }) {
  const { t } = useTranslation();
  const { shiftDurationSeconds } = useAttendance();
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top;

  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [approvalsData, setApprovalsData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reason Modal State
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [reasonTitle, setReasonTitle] = useState('');
  const [reasonValue, setReasonValue] = useState('');
  const [reasonError, setReasonError] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'approve' | 'reject', request: object }
  
  // Local Toast State for Modal
  const [localToast, setLocalToast] = useState({ visible: false, message: '', type: 'success' });

  const showLocalToast = (message, type = 'success') => {
    setLocalToast({ visible: true, message, type });
    setTimeout(() => {
      setLocalToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };


  const REQUEST_TYPES = [
    { id: 'All', label: t(tokens.common.all), icon: null },
    { id: 'Manual Log', label: t(tokens.requests.manualLogRequest), icon: ManualLogIcon },
    { id: 'Leave', label: t(tokens.requests.newLeaveRequest), icon: LeaveIcon },
    { id: 'Overtime', label: t(tokens.requests.newOvertimeRequest), icon: OvertimeIcon },
    { id: 'Training', label: t(tokens.requests.newTrainingRequest), icon: TrainingIcon },
    { id: 'Permission', label: t(tokens.requests.permission), icon: PermissionIcon },
    { id: 'Work From Home', label: t(tokens.requests.workFromHome), icon: WorkFromHomeIcon },
  ];

  const fetchApprovals = async (isRefreshing = false, pageNumber = 1) => {
    try {
      if (pageNumber === 1) {
        if (!isRefreshing) setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let response;
      if (selectedType === 'Training') {
        response = await ProfileServices.getTrainingApprovals(pageNumber, 15);
      } else {
        // Fetch all approvals using the unified endpoint
        response = await ProfileServices.getAllApprovals(pageNumber, 15);
      }
      
      setHasMore(!!response?.next);

      // console.log('DEBUG: Unified All Approvals Response:', JSON.stringify(response, null, 2));

      let allMappedData = [];
      const results = response?.results || [];

      allMappedData = results.map(item => {
        let statusText = 'Pending';
        if (item.approval_status === 2) statusText = 'Approved';
        if (item.approval_status === 3) statusText = 'Rejected';
        if (item.approval_status === 4) statusText = 'Revoked';

        // Detect type category based on available fields or type string from API
        const requestType = (item.type || item.request_type || '').toLowerCase();
        let typeCategory = 'Manual Log';
        let Icon = ManualLogIcon;
        let typeName = 'Manual Log';

        if (requestType.includes('leave') || item.leave_details) {
          typeCategory = 'Leave';
          Icon = LeaveIcon;
          typeName = item.leave_details?.name || 'Leave Request';
        } else if (requestType.includes('overtime') || item.ot_type) {
          typeCategory = 'Overtime';
          Icon = OvertimeIcon;
          typeName = item.ot_type ? `${item.ot_type.charAt(0).toUpperCase() + item.ot_type.slice(1)} Overtime` : 'Overtime Request';
        } else if (requestType.includes('permission') || item.permission_hours) {
          typeCategory = 'Permission';
          Icon = PermissionIcon;
          typeName = 'Permission Request';
        } else if (requestType.includes('wfh') || item.wfh_type) {
          typeCategory = 'Work From Home';
          Icon = WorkFromHomeIcon;
          typeName = 'Work From Home Request';
        } else if (requestType.includes('training') || item.pay_code_name || item.paycode_details?.name) {
          typeCategory = 'Training';
          Icon = TrainingIcon;
          typeName = item.paycode_details?.name || 'Training Request';
        } else {
          // Default to Manual Log or generic
          typeName = item.punch_state === '0' ? 'Check In' : 'Check Out';
        }

        // Common mapping for all types from the unified response
        return {
          uiKey: `${typeCategory.toLowerCase()}-${item.id}`,
          id: item.id,
          type: typeName,
          typeCategory: typeCategory,
          status: statusText,
          date: (() => {
            if (typeCategory === 'Manual Log' || typeCategory === 'Overtime' || typeCategory === 'Permission') {
              return item.punch_time ? moment.utc(item.punch_time).format('DD MMM YYYY') : item.start_time ? moment.utc(item.start_time).format('DD MMM YYYY') : (item.date || '-');
            }
            const startDate = item.start_time ? moment.utc(item.start_time).format('DD MMM') : '';
            const endDate = item.end_time ? moment.utc(item.end_time).format('DD MMM YYYY') : '';
            return startDate && endDate ? `${startDate} - ${endDate}` : (item.date || '-');
          })(),
          duration: (() => {
            if (typeCategory === 'Manual Log') return item.punch_time ? moment.utc(item.punch_time).format('hh:mm A') : (item.time || '-');
            if (typeCategory === 'Overtime') return item.ot_hours ? `${item.ot_hours} Hours` : '-';
            if (typeCategory === 'Permission') return item.permission_hours ? `${item.permission_hours} Hours` : '-';
            if (typeCategory === 'Work From Home') return item.whf_days ? `${item.whf_days} Days` : (item.wfh_type || '-');
            if (typeCategory === 'Training' && item.paycode_details?.name && !item.start_time) return item.paycode_details.name;
            
            // Leave and Training duration calculation
            const start = item.start_time;
            const end = item.end_time;
            if (start && end) {
              const s = new Date(start);
              const e = new Date(end);
              const sMid = new Date(s.getFullYear(), s.getMonth(), s.getDate());
              const eMid = new Date(e.getFullYear(), e.getMonth(), e.getDate());
              const diffDays = Math.round((eMid - sMid) / (1000 * 60 * 60 * 24));
              if (diffDays === 0) {
                let hourDiff = (e - s) / (1000 * 60 * 60);
                if (hourDiff < 0) hourDiff += 24;
                const shiftHours = (shiftDurationSeconds / 3600) || 9;
                const days = hourDiff / shiftHours;
                return days >= 0.98 ? `1.0 ${t(tokens.common.days)}` : `${days.toFixed(1)} ${t(tokens.common.days)}`;
              }
              return `${diffDays + 1}.0 ${t(tokens.common.days)}`;
            }
            
            return item.requested_leave ? `${item.requested_leave} ${t(tokens.common.days)}` : (item.pay_code_name || '-');
          })(),
          submittedOn: dateTimeToShow(item.apply_time),
          awaitingApproval: item.approval_status === 1 ? 'Yes' : 'No',
          icon: Icon,
          reason: item.apply_reason || '-',
          rejectionReason: item.rejection_reason || null,
          workflow: [
            { title: `Request Initiated By ${item.employee_name || 'Employee'}`, date: dateTimeToShow(item.apply_time), status: 'completed' },
            {
              title: item.approval_status === 1 ? 'Awaiting Approval By You' : `${statusText} By ${item.action_by_name || 'Approver'}`,
              date: item.approval_status === 1 ? '' : dateTimeToShow(item.updated_at),
              status: item.approval_status === 1 ? 'pending' : (item.approval_status === 2 ? 'completed' : 'rejected')
            },
          ],
        };
      });

      if (pageNumber === 1) {
        setApprovalsData(allMappedData);
      } else {
        setApprovalsData(prev => {
          // Filter out any duplicates just in case
          const existingIds = new Set(prev.map(item => item.uiKey));
          const uniqueNew = allMappedData.filter(item => !existingIds.has(item.uiKey));
          return [...prev, ...uniqueNew];
        });
      }
      // console.log('DEBUG: Final All Mapped Approvals Data:', JSON.stringify(allMappedData, null, 2));

    } catch (error) {
      console.error('Error fetching approvals:', error);
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
      fetchApprovals(false, nextPage);
    }
  };

  useEffect(() => {
    fetchApprovals(false, 1);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchApprovals(true, 1);
  };

  const filteredData = approvalsData.filter(item => {
    const statusMatch = selectedStatus === 'All' || item.status === selectedStatus;
    const typeMatch = selectedType === 'All' ||
                      (selectedType === 'Leave' && item.typeCategory === 'Leave') ||
                      item.typeCategory === selectedType;
    return statusMatch && typeMatch;
  });

  const handleCardPress = async (item) => {
    setSelectedRequest(item);
    
    try {
      const moduleMap = {
        'Manual Log': 'manual_log',
        'Leave': 'leave',
        'Overtime': 'overtime',
        'Training': 'training',
        'Work From Home': 'work_from_home',
        'Permission': 'permissions'
      };

      const module = moduleMap[item.typeCategory] || 'manual_log';
      const response = await ProfileServices.getRequestApprovers(item.id, module);
      
      if (response && response.approvers) {
        const approverWorkflow = response.approvers.map(app => ({
          title: app.approver_name,
          date: app.approver_position,
          status: app.status === 2 ? 'completed' : (app.status === 3 ? 'rejected' : 'pending')
        }));

        // Merge with existing "Request Initiated" step if present
        const fullWorkflow = [
          ...(item.workflow?.[0]?.title.includes('Request Initiated') ? [item.workflow[0]] : []),
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

  const handleApprove = (request) => {
    setReasonTitle('Approve Request');
    setReasonValue('');
    setReasonError(false);
    setPendingAction({ type: 'approve', request });
    setReasonModalVisible(true);
  };

  const handleReject = (request) => {
    setReasonTitle('Reject Request');
    setReasonValue('');
    setReasonError(false);
    setPendingAction({ type: 'reject', request });
    setReasonModalVisible(true);
  };

  const submitAction = async () => {
    if (!pendingAction || loading) return;

    if (!reasonValue.trim()) {
      setReasonError(true);
      showLocalToast('Please provide a reason', 'error');
      return;
    }

    const { type, request } = pendingAction;
    const isApprove = type === 'approve';
    const isLeave = request.typeCategory === 'Leave';
    const isOvertime = request.typeCategory === 'Overtime';
    const isPermission = request.typeCategory === 'Permission';
    const isWFH = request.typeCategory === 'Work From Home';
    const isTraining = request.typeCategory === 'Training';

    try {
      setLoading(true);
      
      let payload;
      let response;

      if (isLeave) {
        // Leave Payload
        payload = isApprove 
          ? { leave_ids: [request.id], reason: reasonValue.trim(), comments: [] }
          : { leave_ids: [request.id], reason: reasonValue.trim() };
          
        // console.log(`DEBUG: [LEAVE ${type.toUpperCase()}] Request ID:`, request.id);
        // console.log(`DEBUG: [LEAVE ${type.toUpperCase()}] Payload:`, JSON.stringify(payload, null, 2));

        response = isApprove 
          ? await ProfileServices.approveLeave(payload)
          : await ProfileServices.rejectLeave(payload);
      } else if (isOvertime) {
        // Overtime Payload
        payload = { overtime_ids: [request.id], reason: reasonValue.trim() };
        
        // console.log(`DEBUG: [OVERTIME ${type.toUpperCase()}] Request ID:`, request.id);
        // console.log(`DEBUG: [OVERTIME ${type.toUpperCase()}] Payload:`, JSON.stringify(payload, null, 2));

        response = isApprove 
          ? await ProfileServices.approveOvertime(payload)
          : await ProfileServices.rejectOvertime(payload);
      } else if (isPermission) {
        // Permission Payload
        payload = { permissions_ids: [request.id], reason: reasonValue.trim() };
        
        // console.log(`DEBUG: [PERMISSION ${type.toUpperCase()}] Request ID:`, request.id);
        // console.log(`DEBUG: [PERMISSION ${type.toUpperCase()}] Payload:`, JSON.stringify(payload, null, 2));

        response = isApprove 
          ? await ProfileServices.approvePermission(payload)
          : await ProfileServices.rejectPermission(payload);
      } else if (isWFH) {
        // WFH Payload
        payload = { work_from_home_ids: [request.id], reason: reasonValue.trim() };
        
        // console.log(`DEBUG: [WFH ${type.toUpperCase()}] Request ID:`, request.id);
        // console.log(`DEBUG: [WFH ${type.toUpperCase()}] Payload:`, JSON.stringify(payload, null, 2));

        response = isApprove 
          ? await ProfileServices.approveWFH(payload)
          : await ProfileServices.rejectWFH(payload);
      } else if (isTraining) {
        // Training Payload
        payload = { training_ids: [request.id], reason: reasonValue.trim() };
        
        // console.log(`DEBUG: [TRAINING ${type.toUpperCase()}] Request ID:`, request.id);
        // console.log(`DEBUG: [TRAINING ${type.toUpperCase()}] Payload:`, JSON.stringify(payload, null, 2));

        response = isApprove 
          ? await ProfileServices.approveTraining(payload)
          : await ProfileServices.rejectTraining(payload);
      } else {
        // Manual Log Payload
        payload = { manual_log_ids: [request.id], reason: reasonValue.trim() };
        
        // console.log(`DEBUG: [MANUAL LOG ${type.toUpperCase()}] Request ID:`, request.id);
        // console.log(`DEBUG: [MANUAL LOG ${type.toUpperCase()}] Payload:`, JSON.stringify(payload, null, 2));

        response = isApprove 
          ? await ProfileServices.approveManualLog(payload)
          : await ProfileServices.rejectManualLog(payload);
      }

      // console.log(`DEBUG: [${type.toUpperCase()}] Response:`, JSON.stringify(response, null, 2));
      
      // 1. Show Success Toast INSIDE the modal
      showLocalToast(`${request.typeCategory} ${isApprove ? 'approved' : 'rejected'} successfully`, 'success');

      // 2. Delay for 1.5 seconds so user can see the Toast before modal closes
      setTimeout(() => {
        setReasonModalVisible(false);
        setPendingAction(null);
        setSelectedRequest(null);
        setPage(1);
        fetchApprovals(false, 1);
      }, 600);

    } catch (error) {
      console.error(`ERROR: Failed to ${type} request for ID ${request.id}:`, error);
      
      const errorMessage = error?.errorResponse?.detail || error?.message || `Failed to ${type} request`;
      
      // Show Error Toast INSIDE the modal
      showLocalToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#8EA3E3', '#FFFFFF']}
        locations={[0, 0.3]}
        style={styles.background}
      />

      {/* Fixed Header and Filters Section */}
      <View style={{ paddingTop: paddingTop + 12, paddingHorizontal: scale(16) }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1F24" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t(tokens.approvals.title)}</Text>
        </View>

        {/* Status Filter */}
        <View style={styles.statusFilterContainer}>
          <Text style={styles.sectionLabel}>{t(tokens.approvals.status)}</Text>
          <View style={styles.statusTabs}>
            {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusTab,
                  selectedStatus === status && styles.activeStatusTab
                ]}
                onPress={() => {
                  setSelectedStatus(status);
                  setPage(1);
                  fetchApprovals(false, 1);
                }}
              >
                <Text style={[
                  styles.statusTabText,
                  selectedStatus === status && styles.activeStatusTabText
                ]}>{status === 'All' ? t(tokens.approvals.all) : 
                    status === 'Pending' ? t(tokens.actions.pending) : 
                    status === 'Approved' ? t(tokens.actions.approved) : 
                    t(tokens.actions.rejected)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Type Filter */}
        <View style={styles.typeFilterContainer}>
          <Text style={styles.sectionLabel}>{t(tokens.approvals.type)}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeScrollContent}>
            {REQUEST_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeChip,
                  selectedType === type.id && styles.activeTypeChip
                ]}
                onPress={() => {
                  setSelectedType(type.id);
                  setPage(1);
                  fetchApprovals(false, 1);
                }}
              >
                {type.icon && (
                  <View style={{ marginRight: 6 }}>
                    <type.icon
                      width={16}
                      height={16}
                      color={selectedType === type.id ? '#4169E1' : '#62636C'}
                    />
                  </View>
                )}
                <Text style={[
                  styles.typeChipText,
                  selectedType === type.id && styles.activeTypeChipText
                ]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Scrollable List Content */}
      <View style={styles.content}>
        {loading && !refreshing ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#4169E1" />
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={item => item.uiKey}
            scrollEnabled={true}
            renderItem={({ item, index }) => (
              <StaggeredEntrance index={index}>
                <ApprovalCard
                  item={item}
                  onPress={() => handleCardPress(item)}
                />
              </StaggeredEntrance>
            )}
            contentContainerStyle={[styles.listContainer, { paddingBottom: 100 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState 
                title={t(tokens.approvals.noApprovals)}
                description={t(tokens.common.checkBackLater || 'Check back later for new requests to approve')}
              />
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

      <ApprovalDetailsSheet
        visible={!!selectedRequest}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      <ReasonModal
        visible={reasonModalVisible}
        title={reasonTitle}
        value={reasonValue}
        onValueChange={(text) => {
          setReasonValue(text);
          if (reasonError) setReasonError(false);
        }}
        onClose={() => setReasonModalVisible(false)}
        onSubmit={submitAction}
        loading={loading}
        toast={localToast}
        error={reasonError}
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
  statusTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
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
    color: '#62636C',
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
    backgroundColor: '#FFFFFF', // Transparent when inactive? RequestScreen uses White background for inactive. User previously asked to remove background white color for type section tabs.
    // However, RequestScreen uses white. I will stick to RequestScreen logic for now as requested "take reference from the request module UI completely". 
    // If user wants transparent, they can ask again or I should respect the previous instruction?
    // The previous instruction "remove the background white color for the type section tabs" was for the *previous* implementation. 
    // Since I am completely replacing it with RequestScreen UI, I should probably follow RequestScreen UI which has white background.
    // Actually, looking at RequestScreen code: backgroundColor: '#FFFFFF' for typeChip.
    // I will use 'transparent' if not active to match the "remove background" preference if it makes sense, 
    // but RequestScreen looks good with white chips. 
    // Let's stick to RequestScreen styles exactly as requested "completely".
  },
  activeTypeChip: {
    borderColor: '#4169E1',
    backgroundColor: '#EDF2FE',
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
    paddingBottom: verticalScale(40),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#EFF0F3',
    padding: scale(16),
    overflow: 'hidden',
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
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: '#1E1F24',
  },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderBottomLeftRadius: moderateScale(8),
    borderTopRightRadius: moderateScale(8),
    position: 'absolute',
    top: -scale(16),
    right: -scale(16),
  },
  statusText: {
    fontSize: moderateScale(11),
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#EFF0F3',
    marginVertical: verticalScale(12),
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    gap: verticalScale(4),
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: verticalScale(32),
    backgroundColor: '#EFF0F3',
    marginHorizontal: scale(16),
  },
  detailLabel: {
    fontSize: moderateScale(11),
    color: '#62636C',
  },
  detailValue: {
    fontSize: moderateScale(12),
    color: '#1E1F24',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    width: '100%',
    padding: scale(20),
    gap: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#1E1F24',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#EFF0F3',
    borderRadius: moderateScale(12),
    padding: scale(12),
    fontSize: moderateScale(14),
    color: '#1E1F24',
    minHeight: verticalScale(120),
    backgroundColor: '#F9FAFB',
  },
  reasonInputError: {
    borderColor: '#E74C3C',
    borderWidth: 1.5,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: scale(12),
  },
  modalButton: {
    flex: 1,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F2F5',
  },
  submitButton: {
    backgroundColor: '#4169E1',
  },
  cancelButtonText: {
    color: '#62636C',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  // Local Toast Styles
  localToastContainer: {
    position: 'absolute',
    top: verticalScale(20),
    left: scale(20),
    right: scale(20),
    zIndex: 9999,
    alignItems: 'center',
  },
  localToastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(20),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  localToastIcon: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  localToastText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#1E1F24',
    letterSpacing: -0.2,
  },
});
