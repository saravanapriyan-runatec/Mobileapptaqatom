import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Dimensions,
  SafeAreaView,
  Modal,
  Alert,
  ActivityIndicator,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import AuthService from '../../Services/AuthService';
import ProfileServices from '../../Services/API/ProfileServices';
import Toast from 'react-native-toast-message';
import { formatErrorsToToastMessages } from '../utils/error-format';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import { useAttendance } from '../context/AttendanceContext';

const { width } = Dimensions.get('window');

const FormField = ({ label, children }) => (
  <View style={styles.formField}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const InputButton = ({ value, placeholder, icon, onPress }) => (
  <TouchableOpacity style={styles.inputContainer} onPress={onPress}>
    <Text style={[styles.inputText, !value && styles.placeholderText]}>
      {value || placeholder}
    </Text>
    {icon && <Ionicons name={icon} size={20} color="#62636C" />}
  </TouchableOpacity>
);

const TimeInput = ({ value, placeholder, onPress }) => (
  <TouchableOpacity style={styles.inputContainer} onPress={onPress}>
    <Text style={[styles.inputText, !value && styles.placeholderText]}>
      {value || placeholder}
    </Text>
    <Ionicons name="time-outline" size={20} color="#62636C" />
  </TouchableOpacity>
);

const DateInput = ({ value, placeholder, onPress }) => (
  <TouchableOpacity style={styles.inputContainer} onPress={onPress}>
    <Text style={[styles.inputText, !value && styles.placeholderText]}>
      {value || placeholder}
    </Text>
    <Ionicons name="calendar-outline" size={20} color="#62636C" />
  </TouchableOpacity>
);

const getPunchStates = (t) => [
  { id: 0, label: t(tokens.punchStates.checkIn) },
  { id: 1, label: t(tokens.punchStates.checkOut) },
  { id: 2, label: t(tokens.punchStates.breakIn) },
  { id: 3, label: t(tokens.punchStates.breakOut) },
  { id: 4, label: t(tokens.punchStates.overtimeIn) },
  { id: 5, label: t(tokens.punchStates.overtimeOut) }
];
const getOtTypes = (t) => [
  { id: 'regular', label: t(tokens.otTypes.regular) },
  { id: 'weekly', label: t(tokens.otTypes.weekly) },
  { id: 'holiday', label: t(tokens.otTypes.holiday) },
  { id: 'comp_off', label: t(tokens.otTypes.compOff) }
];
const getWfhTypes = (t) => [
  { id: 'hybrid', label: t(tokens.wfhTypes.hybrid) },
  { id: 'permanent', label: t(tokens.wfhTypes.permanent) },
  { id: 'temporary', label: t(tokens.wfhTypes.temporary) }
];
const getPaycodes = (t) => [
  { id: 'internal', label: t(tokens.paycodes.internalTraining) },
  { id: 'external', label: t(tokens.paycodes.externalTraining) },
  { id: 'certification', label: t(tokens.paycodes.certification) },
  { id: 'seminar', label: t(tokens.paycodes.seminar) }
];

const SummaryRow = ({ label, value, isLast }) => (
  <View style={[styles.summaryRow, !isLast && { borderBottomWidth: 1, borderBottomColor: '#F0F2F5', paddingBottom: 12, marginBottom: 12 }]}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const LocalToast = ({ visible, message, type }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

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

const DropdownInput = ({ value, placeholder, options, onSelect }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);

  const openDropdown = () => {
    buttonRef.current.measure((fx, fy, width, height, px, py) => {
      // Figma design asks for 8px gap below the input field
      setPosition({ top: py + height + 8, left: px, width: width });
      setVisible(true);
    });
  };

  return (
    <>
      <TouchableOpacity
        ref={buttonRef}
        style={styles.inputContainer}
        onPress={openDropdown}
      >
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#62636C" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={[
            styles.dropdownMenu,
            {
              top: position.top,
              left: position.left,
              width: position.width,
            }
          ]}>
            <ScrollView
              style={{ maxHeight: 250 }}
              showsVerticalScrollIndicator={true}
              bounces={false}
            >
              <View>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={option?.id !== undefined ? `dropdown-item-${option.id}-${index}` : `dropdown-item-${index}`}
                    style={styles.dropdownItem}
                    onPress={() => {
                      onSelect(option);
                      setVisible(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{option.label || option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const InfoBanner = ({ text, highlight }) => (
  <View style={styles.infoBanner}>
    <Ionicons name="information-circle-outline" size={20} color="#4169E1" />
    <Text style={styles.infoText}>
      {text} <Text style={styles.infoHighlight}>{highlight}</Text>
    </Text>
  </View>
);

const NewRequestScreen = ({ onBack, type, editingData, onRefresh }) => {
  const { t } = useTranslation();
  const { SHIFT_DURATION_SECONDS, employeeId: contextEmployeeId, shiftInfo } = useAttendance();
  // Safe fallback to 9 hours if shift duration is not yet available
  const shiftDurationSeconds = SHIFT_DURATION_SECONDS || (9 * 3600);
  const [localToast, setLocalToast] = useState(null);
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top;

  const [dates, setDates] = useState({});
  const [times, setTimes] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const [currentField, setCurrentField] = useState(null);

  // Form States
  const [reason, setReason] = useState('');
  const [punchState, setPunchState] = useState('');
  const setPunchStateDirty = (val) => { setPunchState(val); setIsDirty(true); };
  const [leaveType, setLeaveType] = useState('');
  const setLeaveTypeDirty = (val) => { setLeaveType(val); setIsDirty(true); };
  const [otType, setOtType] = useState('');
  const setOtTypeDirty = (val) => { setOtType(val); setIsDirty(true); };
  const [wfhType, setWfhType] = useState('');
  const setWfhTypeDirty = (val) => { setWfhType(val); setIsDirty(true); };
  const [paycode, setPaycode] = useState('');
  const setPaycodeDirty = (val) => { setPaycode(val); setIsDirty(true); };
  const [isHalfDay, setIsHalfDay] = useState(false);
  const setIsHalfDayDirty = (val) => { setIsHalfDay(val); setIsDirty(true); };
  const [halfDayType, setHalfDayType] = useState('1st Half');
  const setHalfDayTypeDirty = (val) => { setHalfDayType(val); setIsDirty(true); };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isDirty, setIsDirty] = useState(!editingData);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
  const [trainingPaycodes, setTrainingPaycodes] = useState([]);
  const [paycodesLoading, setPaycodesLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [permissionBalance, setPermissionBalance] = useState(null);
  const [permissionBalanceLoading, setPermissionBalanceLoading] = useState(false);

  // File Picker
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        let newDocs = [];
        for (const file of result.assets) {
          try {
            const base64 = await FileSystem.readAsStringAsync(file.uri, {
              encoding: 'base64',
            });
            newDocs.push({
              filename: file.name || 'document',
              image_binary: base64,
              content_type: file.mimeType || 'application/octet-stream'
            });
          } catch (readError) {
            console.error('Error reading file:', readError);
            Alert.alert('Read Error', `Could not read file ${file.name}`);
          }
        }

        if (newDocs.length > 0) {
          setAttachments(prev => [...prev, ...newDocs]);
          setIsDirty(true);
        }
      }
    } catch (err) {
      // console.log('Error picking document', err);
      Alert.alert('Upload Error', 'Failed to pick document.');
    }
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setIsDirty(true);
  };

  // Fetch leave types when type is 'leave'
  React.useEffect(() => {
    if (type === 'leave') {
      setLeaveTypesLoading(true);
      ProfileServices.getLeaveTypeList()
        .then(res => {
          const items = (res?.result || [])
            .filter(item => item.name && item.name.trim().toLowerCase() !== 'annual')
            .map(item => ({
              id: item.name,
              label: item.name,
              available_balance: item.available_balance,
              used_leaves: item.used_leaves
            }));
          setLeaveTypes(items);
          // console.log('DEBUG: Leave Types:', JSON.stringify(items, null, 2));
        })
        .catch(err => console.error('Leave Types Error:', err))
        .finally(() => setLeaveTypesLoading(false));
    }
  }, [type]);

  // Fetch training paycodes when type is 'training'
  React.useEffect(() => {
    if (type === 'training') {
      const getPayCodeList = async () => {
        try {
          setPaycodesLoading(true);
          const paycodeIds = [5];
          const response = await ProfileServices.getPayCodeLists(paycodeIds);
          const { training_paycodes } = response; // APIService returns data directly

          // Map to include label for DropdownInput
          const items = (training_paycodes || []).map(item => ({
            ...item,
            id: item.id || item.paycode,
            label: item.name || item.pay_code_name || item.pay_code || String(item.id),
          }));

          setTrainingPaycodes(items);
          // console.log('DEBUG: Training Paycodes:', JSON.stringify(items, null, 2));
        } catch (err) {
          console.error(err);
        } finally {
          setPaycodesLoading(false);
        }
      };
      getPayCodeList();
    }
  }, [type]);

  // Fetch managers when entering review mode
  React.useEffect(() => {
    if (isReviewing) {
      const getManagersList = async () => {
        try {
          setManagersLoading(true);
          // Use context ID or fetch if missing
          let empID = contextEmployeeId;
          
          if (!empID) {
            const authUserId = await AuthService.getUserId();
            const userDetails = await ProfileServices.getUserDetailsData(authUserId);
            const employee = await ProfileServices.getEmployeeDetailsData(userDetails?.username);
            empID = employee?.id;
          }

          if (empID) {
            const typeToContent = {
              manual_log: 'manual_log',
              leave: 'leave',
              overtime: 'overtime',
              training: 'training',
              permission: 'permissions',
              wfh: 'work_from_home',
            };
            const content = typeToContent[type] || type;
            const response = await ProfileServices.getManagers(empID, content);
            // console.log('DEBUG: Manager List Response:', JSON.stringify(response, null, 2));
            setManagers(response?.nodes || []);
          }
        } catch (error) {
          console.error('Error fetching managers:', error);
        } finally {
          setManagersLoading(false);
        }
      };
      getManagersList();
    }
  }, [isReviewing, type, contextEmployeeId]);

  // Fetch permission balance when type is 'permission'
  React.useEffect(() => {
    if (type === 'permission') {
      const fetchBalance = async () => {
        try {
          setPermissionBalanceLoading(true);
          let empID = contextEmployeeId;

          if (!empID) {
            const authUserId = await AuthService.getUserId();
            const userDetails = await ProfileServices.getUserDetailsData(authUserId);
            const employee = await ProfileServices.getEmployeeDetailsData(userDetails?.username);
            empID = employee?.id;
          }

          if (empID) {
            const response = await ProfileServices.getPermissionBalance(empID);
            // console.log('DEBUG [NewRequestScreen]: Permission Balance Response:', JSON.stringify(response, null, 2));
            setPermissionBalance(response);
          }
        } catch (error) {
          console.error('Error fetching permission balance:', error);
        } finally {
          setPermissionBalanceLoading(false);
        }
      };
      fetchBalance();
    }
  }, [type, contextEmployeeId]);

  // Initialize Edit Mode
  React.useEffect(() => {
    if (editingData) {
      // console.log('DEBUG: Edit Mode Initializing with data:', JSON.stringify(editingData, null, 2));
      if (type === 'manual_log') {
        // Find matching punch state by ID (most reliable) or label
        const matchingPunch = getPunchStates(t).find(p =>
          (editingData.punch_state !== undefined && String(p.id) === String(editingData.punch_state)) ||
          p.label === editingData.type
        );
        if (matchingPunch) setPunchState(matchingPunch);

        // Use rawPunchTime for reliable date/time parsing
        // Replace space with 'T' if needed for cross-platform Date parsing of "YYYY-MM-DD HH:mm:ss"
        const punchTimeStr = editingData.rawPunchTime ? String(editingData.rawPunchTime).replace(' ', 'T') : null;
        const requestDate = punchTimeStr ? new Date(punchTimeStr) : new Date();

        if (!isNaN(requestDate.getTime())) {
          setDates(prev => ({ ...prev, manual_date: requestDate }));
          setTimes(prev => ({ ...prev, manual_punch: requestDate }));
        }
        setReason(editingData.reason || '');
      } else if (type === 'leave') {
        const leaveVal = editingData.leave_details?.name || editingData.leave_name || editingData.type;
        const leaveId = editingData.leave_details?.id || editingData.leave_type;

        // console.log('DEBUG: Looking for Leave Type match for:', leaveVal, 'or ID:', leaveId);

        const matchingLeave = leaveTypes.find(l =>
          (l.label && leaveVal && String(l.label).toLowerCase() === String(leaveVal).toLowerCase()) ||
          (l.id && leaveId && String(l.id) === String(leaveId)) ||
          (l.id && leaveVal && String(l.id) === String(leaveVal))
        );

        // console.log('DEBUG: Found Matching Leave:', JSON.stringify(matchingLeave, null, 2));

        setLeaveType(matchingLeave || leaveVal || '');

        // Handle dates for leave
        const fromDate = editingData.start_time || editingData.from_date;
        const toDate = editingData.end_time || editingData.to_date;

        if (fromDate) {
          const startD = new Date(fromDate);
          setDates(prev => ({ ...prev, leave_from: startD }));
          setTimes(prev => ({ ...prev, leave_start: startD }));
        }
        if (toDate) {
          const endD = new Date(toDate);
          setDates(prev => ({ ...prev, leave_to: endD }));
          setTimes(prev => ({ ...prev, leave_end: endD }));
        }

        setReason(editingData.reason || editingData.apply_reason || '');

        // Initialize attachments with proper object structure
        if (editingData.attachments && Array.isArray(editingData.attachments)) {
          const loadAttachments = async () => {
            let mappedDocs = [];
            for (const item of editingData.attachments) {
              if (typeof item === 'string') {
                const parts = item.split('/');
                const filenameWithParams = parts[parts.length - 1];
                const rawFilename = filenameWithParams.split('?')[0];
                const cleanFilename = rawFilename.includes('_') ? rawFilename.split('_').slice(1).join('_') : rawFilename;

                try {
                  const fileUri = FileSystem.cacheDirectory + cleanFilename;
                  const { uri } = await FileSystem.downloadAsync(item, fileUri);
                  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

                  let contentType = 'application/octet-stream';
                  if (cleanFilename.toLowerCase().endsWith('.pdf')) contentType = 'application/pdf';
                  else if (cleanFilename.toLowerCase().endsWith('.png')) contentType = 'image/png';
                  else if (cleanFilename.toLowerCase().endsWith('.jpg') || cleanFilename.toLowerCase().endsWith('.jpeg')) contentType = 'image/jpeg';

                  mappedDocs.push({
                    filename: cleanFilename || 'attachment',
                    content_type: contentType,
                    image_binary: base64,
                    isExisting: true
                  });
                } catch (error) {
                  // console.log('Failed to download existing attachment to base64:', error);
                  // Fallback to URL format just in case
                  mappedDocs.push({ filename: cleanFilename, url: item, isExisting: true });
                }
              } else {
                mappedDocs.push(item);
              }
            }
            setAttachments(mappedDocs);
          };
          loadAttachments();
        }
      } else if (type === 'overtime') {
        // Match the OT type from OT_TYPES list
        const matchingOtType = getOtTypes(t).find(o =>
          String(o.id).toLowerCase() === String(editingData.ot_type || '').toLowerCase()
        );
        setOtType(matchingOtType || editingData.ot_type || '');
        // console.log('DEBUG OT: Matched OT Type:', matchingOtType);

        // Set date from start_time
        if (editingData.start_time) {
          const startDate = new Date(editingData.start_time);
          // console.log('DEBUG OT: Start Time Date Object:', startDate);
          if (!isNaN(startDate.getTime())) {
            setDates(prev => ({ ...prev, ot_date: startDate }));
            setTimes(prev => ({ ...prev, ot_start: startDate }));
          }
        }

        // Set end time from end_time
        if (editingData.end_time) {
          const endDate = new Date(editingData.end_time);
          // console.log('DEBUG OT: End Time Date Object:', endDate);
          if (!isNaN(endDate.getTime())) {
            setTimes(prev => ({ ...prev, ot_end: endDate }));
          }
        }

        // console.log('DEBUG OT: Reason:', editingData.reason || editingData.apply_reason);
        setReason(editingData.reason || editingData.apply_reason || '');
      } else if (type === 'permission') {
        const startDate = editingData.start_time ? new Date(editingData.start_time) : null;
        const endDate = editingData.end_time ? new Date(editingData.end_time) : null;

        if (startDate && !isNaN(startDate.getTime())) {
          setDates(prev => ({ ...prev, perm_date: startDate }));
          setTimes(prev => ({ ...prev, perm_from: startDate }));
        }
        if (endDate && !isNaN(endDate.getTime())) {
          setTimes(prev => ({ ...prev, perm_to: endDate }));
        }
        setReason(editingData.reason || editingData.apply_reason || '');
      } else if (type === 'wfh') {
        const matchingWfhType = getWfhTypes(t).find(w =>
          String(w.id).toLowerCase() === String(editingData.wfh_type || '').toLowerCase()
        );
        setWfhType(matchingWfhType || editingData.wfh_type || '');

        const startDate = editingData.start_time ? new Date(editingData.start_time) : null;
        const endDate = editingData.end_time ? new Date(editingData.end_time) : null;

        if (startDate && !isNaN(startDate.getTime())) {
          setDates(prev => ({ ...prev, wfh_start_date: startDate }));
          setTimes(prev => ({ ...prev, wfh_start_time: startDate }));
        }
        if (endDate && !isNaN(endDate.getTime())) {
          setDates(prev => ({ ...prev, wfh_end_date: endDate }));
          setTimes(prev => ({ ...prev, wfh_end_time: endDate }));
        }
        setReason(editingData.reason || editingData.apply_reason || '');
      } else if (type === 'training') {
        const pId = editingData.pay_code || editingData.paycode;
        const matchingPaycode = trainingPaycodes.find(p =>
          String(p.id).toLowerCase() === String(pId || '').toLowerCase()
        );
        setPaycode(matchingPaycode || pId || '');

        const startDate = editingData.start_time ? new Date(editingData.start_time) : null;
        const endDate = editingData.end_time ? new Date(editingData.end_time) : null;

        if (startDate && !isNaN(startDate.getTime())) {
          setDates(prev => ({ ...prev, training_start_date: startDate }));
          setTimes(prev => ({ ...prev, training_start_time: startDate }));
        }
        if (endDate && !isNaN(endDate.getTime())) {
          setDates(prev => ({ ...prev, training_end_date: endDate }));
          setTimes(prev => ({ ...prev, training_end_time: endDate }));
        }
        setReason(editingData.reason || editingData.apply_reason || '');
      }
    } else {
      // Initialize defaults for New Request
      const today = new Date();
      if (type === 'leave') {
        setDates(prev => ({
          ...prev,
          leave_from: today,
          leave_to: today
        }));
        // Default to 9:00 AM to 6:00 PM (typical shift)
        const sT = new Date(2000, 0, 1, 9, 0);
        const eT = new Date(2000, 0, 1, 18, 0);
        setTimes(prev => ({
          ...prev,
          leave_start: sT,
          leave_end: eT
        }));
      }
    }
    setLocalToast(null);
    setIsDirty(!editingData); // Reset dirty state on load
  }, [editingData, type, leaveTypes, trainingPaycodes]);

  const handleReview = () => {
    if (type === 'manual_log') {
      if (!dates.manual_date || !punchState || !times.manual_punch || !reason) {
        Toast.show({
          type: 'error',
          text1: t(tokens.messages.missingFields),
          text2: t(tokens.messages.fillRequiredFields),
          position: 'bottom'
        });
        return;
      }
    } else if (type === 'leave') {
      if (!leaveType || !dates.leave_from || !dates.leave_to || !reason) {
        Toast.show({
          type: 'error',
          text1: t(tokens.messages.missingFields),
          text2: t(tokens.messages.fillRequiredFields),
          position: 'bottom'
        });
        return;
      }
    } else if (type === 'overtime') {
      if (!otType || !dates.ot_date || !times.ot_start || !times.ot_end || !reason) {
        Toast.show({
          type: 'error',
          text1: t(tokens.messages.missingFields),
          text2: t(tokens.messages.fillRequiredFields),
          position: 'bottom'
        });
        return;
      }
    } else if (type === 'wfh') {
      if (!wfhType || !dates.wfh_start_date || !times.wfh_start_time || !dates.wfh_end_date || !times.wfh_end_time || !reason) {
        Toast.show({
          type: 'error',
          text1: t(tokens.messages.missingFields),
          text2: t(tokens.messages.fillRequiredFields),
          position: 'bottom'
        });
        return;
      }
    } else if (type === 'training') {
      if (!paycode || !dates.training_start_date || !times.training_start_time || !dates.training_end_date || !times.training_end_time || !reason) {
        Toast.show({
          type: 'error',
          text1: t(tokens.messages.missingFields),
          text2: t(tokens.messages.fillRequiredFields),
          position: 'bottom'
        });
        return;
      }
    } else {
      if (!reason) {
        Toast.show({
          type: 'error',
          text1: t(tokens.messages.missingFields),
          text2: t(tokens.messages.provideJustification),
          position: 'bottom'
        });
        return;
      }
    }
    setIsReviewing(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);

      // 1. Get Auth User ID -> Username -> Emp ID
      const authUserId = await AuthService.getUserId();
      // console.log('DEBUG 1: NewRequest AuthUserId:', authUserId);

      const userDetails = await ProfileServices.getUserDetailsData(authUserId);
      // console.log('DEBUG 2: NewRequest UserDetails:', JSON.stringify(userDetails, null, 2));
      const username = userDetails?.username;

      const employee = await ProfileServices.getEmployeeDetailsData(username);
      // console.log('DEBUG 3: NewRequest EmployeeDetails:', JSON.stringify(employee, null, 2));
      const empID = employee?.id;

      if (!empID) {
        throw new Error('Could not retrieve employee ID.');
      }

      if (type === 'manual_log') {
        const payload = {
          employee: Number(empID),
          punch_state: Number(punchState.id),
          punch_time: `${dates.manual_date.toISOString().split('T')[0]} ${formatTime24(times.manual_punch)}:00`,
          apply_reason: reason,
          attachments: [],
          comments: []
        };

        // console.log(`DEBUG: ${editingData ? 'Updating' : 'Submitting'} Manual Log:`, JSON.stringify(payload, null, 2));

        const response = editingData
          ? await ProfileServices.updateManualLogRequest(editingData.id, payload)
          : await ProfileServices.addManualLogRequest(payload);

        // console.log(`DEBUG: Manual Log ${editingData ? 'Update' : 'Create'} Response:`, response);

        if (onRefresh) onRefresh();

        setLocalToast({
          type: 'success',
          message: editingData ? t(tokens.messages.requestUpdatedSuccess) : t(tokens.messages.requestCreatedSuccess)
        });

        setTimeout(() => {
          setLocalToast(null);
          onBack();
        }, 600);
      } else if (type === 'leave') {
        // Helper to format date to local YYYY-MM-DD 00:00:00 without UTC shift
        const formatLocalDateAPI = (d, t) => {
          if (!d) return '';
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const timeStr = t ? formatTime24(t) + ':00' : '00:00:00';
          return `${y}-${m}-${day} ${timeStr}`;
        };

        const payload = {
          employee: Number(empID),
          leave_name: leaveType?.id || leaveType,
          start_time: formatLocalDateAPI(dates.leave_from, times.leave_start),
          end_time: formatLocalDateAPI(dates.leave_to, times.leave_end),
          apply_reason: reason,
          attachments: attachments.some(a => a.image_binary)
            ? attachments.map(a => {
              // If it's a newly added attachment
              if (a.image_binary) {
                return {
                  filename: a.filename,
                  image_binary: a.image_binary,
                  content_type: a.content_type,
                };
              }
              // If it's an existing AWS attachment, send the raw URL string
              return a.url;
            })
            : [],
          comments: []
        };

        // Removed payload.id assignment because ID is passed in the URL

        // console.log(`DEBUG: ${editingData ? 'Updating' : 'Submitting'} Leave Request:`, JSON.stringify(payload, null, 2));

        const response = editingData
          ? await ProfileServices.editLeaveRequest({ id: editingData.id, options: payload })
          : await ProfileServices.addLeaveRequest(payload);

        // console.log(`DEBUG: Leave Request111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111 ${editingData ? 'Update' : 'Create'} Response:`, response);

        if (onRefresh) onRefresh();

        setLocalToast({
          type: 'success',
          message: editingData ? t(tokens.messages.requestUpdatedSuccess) : t(tokens.messages.requestSubmittedSuccess)
        });

        setTimeout(() => {
          setLocalToast(null);
          onBack();
        }, 600);
      } else if (type === 'overtime') {
        const formatLocalDateAPI = (d, t) => {
          if (!d) return '';
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const timeStr = t ? formatTime24(t) + ':00' : '00:00:00';
          return `${y}-${m}-${day} ${timeStr}`;
        };

        const payload = {
          employee: Number(empID),
          ot_type: otType?.id || otType,
          start_time: formatLocalDateAPI(dates.ot_date, times.ot_start),
          end_time: formatLocalDateAPI(dates.ot_date, times.ot_end),
          apply_reason: reason,
          attachments: attachments.some(a => a.image_binary)
            ? attachments.map(a => {
              if (a.image_binary) {
                return {
                  filename: a.filename,
                  image_binary: a.image_binary,
                  content_type: a.content_type,
                };
              }
              return a.url;
            })
            : [],
          comments: []
        };

        // console.log('DEBUG OT: Formatted Start Time:', payload.start_time);
        // console.log('DEBUG OT: Formatted End Time:', payload.end_time);
        // console.log(`DEBUG: ${editingData ? 'Updating' : 'Submitting'} Overtime Request Payload:`, JSON.stringify(payload, null, 2));

        const response = editingData
          ? await ProfileServices.editOvertimeRequest({ id: editingData.id, options: payload })
          : await ProfileServices.addOvertimeRequest(payload);

        // console.log(`DEBUG: Overtime Request ${editingData ? 'Update' : 'Create'} Response:`, response);

        if (onRefresh) onRefresh();

        setLocalToast({
          type: 'success',
          message: editingData ? t(tokens.messages.requestUpdatedSuccess) : t(tokens.messages.requestSubmittedSuccess)
        });

        setTimeout(() => {
          setLocalToast(null);
          onBack();
        }, 600);
      } else if (type === 'permission') {
        const formatLocalDateAPI = (d, t) => {
          if (!d) return '';
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const timeStr = t ? formatTime24(t) + ':00' : '00:00:00';
          return `${y}-${m}-${day} ${timeStr}`;
        };

        const payload = {
          employee: Number(empID),
          start_time: formatLocalDateAPI(dates.perm_date, times.perm_from),
          end_time: formatLocalDateAPI(dates.perm_date, times.perm_to),
          apply_reason: reason,
          attachments: [],
          comments: []
        };

        // console.log(`DEBUG: ${editingData ? 'Updating' : 'Submitting'} Permission Request:`, JSON.stringify(payload, null, 2));

        const response = editingData
          ? await ProfileServices.editPermissionRequest({ id: editingData.id, options: payload })
          : await ProfileServices.addPermissionRequest(payload);

        // console.log(`DEBUG: Permission Request ${editingData ? 'Update' : 'Create'} Response:`, response);

        if (onRefresh) onRefresh();

        setLocalToast({
          type: 'success',
          message: editingData ? t(tokens.messages.requestUpdatedSuccess) : t(tokens.messages.requestSubmittedSuccess)
        });

        setTimeout(() => {
          setLocalToast(null);
          onBack();
        }, 600);
      } else if (type === 'wfh') {
        const formatLocalDateAPI = (d, t) => {
          if (!d) return '';
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const timeStr = t ? formatTime24(t) + ':00' : '00:00:00';
          return `${y}-${m}-${day} ${timeStr}`;
        };

        const payload = {
          employee: Number(empID),
          wfh_type: wfhType?.id || wfhType,
          start_time: formatLocalDateAPI(dates.wfh_start_date, times.wfh_start_time),
          end_time: formatLocalDateAPI(dates.wfh_end_date, times.wfh_end_time),
          apply_reason: reason,
          attachments: [],
          comments: []
        };

        // console.log(`DEBUG: ${editingData ? 'Updating' : 'Submitting'} WFH Request:`, JSON.stringify(payload, null, 2));

        const response = editingData
          ? await ProfileServices.editWorkFromHomeRequest({ id: editingData.id, options: payload })
          : await ProfileServices.addWorkFromHomeRequest(payload);

        // console.log(`DEBUG: WFH Request ${editingData ? 'Update' : 'Create'} Response:`, response);

        if (onRefresh) onRefresh();

        setLocalToast({
          type: 'success',
          message: editingData ? t(tokens.messages.requestUpdatedSuccess) : t(tokens.messages.requestSubmittedSuccess)
        });

        setTimeout(() => {
          setLocalToast(null);
          onBack();
        }, 600);
      } else if (type === 'training') {
        const formatLocalDateAPI = (d, t) => {
          if (!d) return '';
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const timeStr = t ? formatTime24(t) + ':00' : '00:00:00';
          return `${y}-${m}-${day} ${timeStr}`;
        };

        const payload = {
          employee: Number(empID),
          pay_code: paycode?.id || paycode,
          start_time: formatLocalDateAPI(dates.training_start_date, times.training_start_time),
          end_time: formatLocalDateAPI(dates.training_end_date, times.training_end_time),
          apply_reason: reason,
          attachments: [],
          comments: []
        };

        // console.log(`DEBUG: ${editingData ? 'Updating' : 'Submitting'} Training Request:`, JSON.stringify(payload, null, 2));

        const response = editingData
          ? await ProfileServices.editTrainingRequest(editingData.id, payload)
          : await ProfileServices.addTrainingRequest(payload);

        // console.log(`DEBUG: Training Request ${editingData ? 'Update' : 'Create'} Response:`, response);

        if (onRefresh) onRefresh();

        setLocalToast({
          type: 'success',
          message: editingData ? t(tokens.messages.requestUpdatedSuccess) : t(tokens.messages.requestSubmittedSuccess)
        });

        setTimeout(() => {
          setLocalToast(null);
          onBack();
        }, 600);
      } else {
        Toast.show({
          type: 'info',
          text1: t(tokens.common.beta),
          text2: t(tokens.messages.betaFeatureInfo),
          position: 'bottom'
        });
      }
    } catch (error) {
      console.error('Submission Error:', JSON.stringify(error, null, 2));
      const toastMessage = formatErrorsToToastMessages(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (isReviewing) return t(tokens.requests.requestSummary);
    if (editingData) {
      if (type === 'leave') return t(tokens.requests.editLeaveRequest);
      if (type === 'manual_log') return t(tokens.requests.editManualLog);
      return t(tokens.requests.editRequest);
    }

    switch (type) {
      case 'leave': return t(tokens.requests.newLeaveRequest);
      case 'overtime': return t(tokens.requests.newOvertimeRequest);
      case 'wfh': return t(tokens.requests.newWfhRequest);
      case 'training': return t(tokens.requests.newTrainingRequest);
      case 'manual_log': return t(tokens.requests.manualLogRequest);
      default: return t(tokens.requests.newRequest);
    }
  };

  const onConfirmDate = React.useCallback((params) => {
    setShowPicker(false);
    if (params.date && currentField) {
      setDates(prev => ({ ...prev, [currentField]: params.date }));
      setIsDirty(true);
    }
  }, [currentField]);

  const onConfirmTime = React.useCallback((params) => {
    setShowPicker(false);
    if (params && currentField) {
      const { hours, minutes } = params;
      // Always use a consistent base date (e.g., Year 2000) for "time-only" fields 
      // to avoid multi-day difference issues in duration calculations.
      const d = new Date(2000, 0, 1);
      d.setHours(hours, minutes, 0, 0);
      setTimes(prev => ({ ...prev, [currentField]: d }));
      setIsDirty(true);
    }
  }, [currentField]);

  const openDatePicker = (field) => {
    setPickerMode('date');
    setCurrentField(field);
    setShowPicker(true);
  };

  const openTimePicker = (field) => {
    setPickerMode('time');
    setCurrentField(field);
    setShowPicker(true);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatTime24 = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // Calculation Logic
  const getLeaveDays = () => {
    if (isHalfDay) return `0.5 ${t(tokens.common.days)}`;

    const start = dates.leave_from;
    const end = dates.leave_to;
    const startTime = times.leave_start;
    const endTime = times.leave_end;

    if (start && end) {
      // Normalize dates to midnight to avoid time-of-day discrepancy
      const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      
      const diffTime = e - s;
      if (diffTime < 0) return `0.0 ${t(tokens.common.days)}`;
      
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      // If same day, show hours as days fraction based on shift
      if (diffDays === 0) {
        // Use the picked times if available, otherwise fallback to standard shift hours (but default to 1.0 if times missing)
        if (startTime && endTime) {
          const sT = new Date(2000, 0, 1, startTime.getHours(), startTime.getMinutes());
          const eT = new Date(2000, 0, 1, endTime.getHours(), endTime.getMinutes());
          let hDiff = (eT - sT) / (1000 * 60 * 60);
          if (hDiff < 0) hDiff += 24;
          
          const shiftHours = (shiftDurationSeconds / 3600) || 9; // Fallback to 9h if 0
          const daysFrac = hDiff / shiftHours;
          
          // If the difference is roughly equal to shift hours (or more), just show 1.0
          if (daysFrac >= 0.98) return `1.0 ${t(tokens.common.days)}`;
          
          return `${daysFrac.toFixed(1)} ${t(tokens.common.days)}`;
        }
      }

      return `${diffDays + 1}.0 ${t(tokens.common.days)}`;
    }
    return `0.0 ${t(tokens.common.days)}`;
  };

  const getTrainingDuration = () => {
    const start = dates.training_start_date;
    const end = dates.training_end_date;

    if (start && end) {
      // Normalize dates to midnight to avoid time-of-day issues
      const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      const diffTime = e - s;
      if (diffTime < 0) return "0.0";

      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays + 1}.0`;
    }
    return "0.0";
  };

  const getWfhDuration = () => {
    const start = dates.wfh_start_date;
    const end = dates.wfh_end_date;

    if (start && end) {
      const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      const diffTime = e - s;
      if (diffTime < 0) return "0.0";

      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays + 1}.0`;
    }
    return "0.0";
  };

  const getHours = (startKey, endKey) => {
    const start = times[startKey];
    const end = times[endKey];

    if (start && end) {
      // Normalize both to the same base date to calculate purely the time difference
      const s = new Date(2000, 0, 1, start.getHours(), start.getMinutes());
      const e = new Date(2000, 0, 1, end.getHours(), end.getMinutes());
      
      let diff = (e - s) / (1000 * 60 * 60);
      // Handle overnight wrap (e.g., 22:00 to 02:00)
      if (diff < 0) diff += 24;
      return `${diff.toFixed(1)} ${t(tokens.common.hours)}`;
    }
    return `0.0 ${t(tokens.common.hours)}`;
  };

  const renderContent = () => {
    switch (type) {
      case 'manual_log':
        return (
          <>
            <FormField label={t(tokens.common.date)}>
              <DateInput
                value={formatDate(dates.manual_date)}
                placeholder="DD MMM YYYY"
                onPress={() => openDatePicker('manual_date')}
              />
            </FormField>
            <FormField label={t(tokens.requests.punchState)}>
              <DropdownInput
                placeholder={t(tokens.common.select)}
                value={punchState?.label}
                options={getPunchStates(t)}
                onSelect={setPunchStateDirty}
              />
            </FormField>

            <FormField label={t(tokens.requests.punchTime)}>
              <TimeInput
                value={formatTime(times.manual_punch)}
                placeholder="--:--"
                onPress={() => openTimePicker('manual_punch')}
              />
            </FormField>

            {/*
            <View style={styles.row}>
              <View style={styles.col}>
                <FormField label="Actual Check In">
                  <TimeInput
                    value={formatTime(times.manual_in)}
                    placeholder="--:--"
                    onPress={() => openTimePicker('manual_in')}
                  />
                </FormField>
              </View>
              <View style={styles.colSpacing} />
              <View style={styles.col}>
                <FormField label="Actual Check Out">
                  <TimeInput
                    value={formatTime(times.manual_out)}
                    placeholder="--:--"
                    onPress={() => openTimePicker('manual_out')}
                  />
                </FormField>
              </View>
            </View>
            */}
            <InfoBanner 
              text={t(tokens.requests.scheduledShift)} 
              highlight={shiftInfo?.start && shiftInfo?.end && shiftInfo.start !== '--:--' 
                ? `${shiftInfo.start} - ${shiftInfo.end}` 
                : "09:00AM - 06:00PM"} 
            />
          </>
        );
      case 'leave':
        return (
          <>
            <FormField label={t(tokens.requests.leaveType)}>
              <DropdownInput
                placeholder={leaveTypesLoading ? t(tokens.common.loading) : t(tokens.common.select)}
                value={leaveType?.label || leaveType}
                options={leaveTypes}
                onSelect={(item) => { setLeaveType(item); setIsDirty(true); }}
              />
            </FormField>
            <View style={styles.row}>
              <View style={styles.col}>
                <FormField label={t(tokens.requests.fromDate)}>
                  <DateInput
                    value={formatDate(dates.leave_from)}
                    placeholder="DD/MM/YYYY"
                    onPress={() => openDatePicker('leave_from')}
                  />
                </FormField>
              </View>
              <View style={styles.colSpacing} />
              <View style={styles.col}>
                <FormField label={t(tokens.requests.startTime) || 'Start Time'}>
                  <TimeInput
                    value={formatTime(times.leave_start)}
                    placeholder="HH:MM"
                    onPress={() => openTimePicker('leave_start')}
                  />
                </FormField>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <FormField label={t(tokens.requests.toDate)}>
                  <DateInput
                    value={formatDate(dates.leave_to)}
                    placeholder="DD/MM/YYYY"
                    onPress={() => openDatePicker('leave_to')}
                  />
                </FormField>
              </View>
              <View style={styles.colSpacing} />
              <View style={styles.col}>
                <FormField label={t(tokens.requests.endTime) || 'End Time'}>
                  <TimeInput
                    value={formatTime(times.leave_end)}
                    placeholder="HH:MM"
                    onPress={() => openTimePicker('leave_end')}
                  />
                </FormField>
              </View>
            </View>

            {/* <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsHalfDay(!isHalfDay)}
            >
              <View style={[styles.checkbox, isHalfDay && styles.checkboxChecked]}>
                {isHalfDay && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Half Day Request</Text>
            </TouchableOpacity> */}

            {/* {isHalfDay && (
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, halfDayType === '1st Half' && styles.toggleButtonActive]}
                  onPress={() => setHalfDayType('1st Half')}
                >
                  <Text style={[styles.toggleText, halfDayType === '1st Half' && styles.toggleTextActive]}>1st Half</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, halfDayType === '2nd Half' && styles.toggleButtonActive]}
                  onPress={() => setHalfDayType('2nd Half')}
                >
                  <Text style={[styles.toggleText, halfDayType === '2nd Half' && styles.toggleTextActive]}>2nd Half</Text>
                </TouchableOpacity>
              </View>
            )} */}

            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{t(tokens.requests.requestedDays)}</Text>
                <Text style={styles.statValue}>{getLeaveDays()}</Text>
              </View>
            </View>
          </>
        );
      case 'overtime':
        return (
          <>
            <FormField label={t(tokens.requests.otType)}>
              <DropdownInput
                placeholder={t(tokens.common.select)}
                value={otType?.label || otType}
                options={getOtTypes(t)}
                onSelect={(val) => { setOtType(val); setIsDirty(true); }}
              />
            </FormField>
            <FormField label={t(tokens.common.date)}>
              <DateInput
                value={formatDate(dates.ot_date)}
                placeholder="DD MMM YYYY"
                onPress={() => openDatePicker('ot_date')}
              />
            </FormField>
            <View style={styles.row}>
              <View style={styles.col}>
                <FormField label={t(tokens.requests.otStartTime)}>
                  <TimeInput
                    value={formatTime(times.ot_start)}
                    placeholder="--:--"
                    onPress={() => openTimePicker('ot_start')}
                  />
                </FormField>
              </View>
              <View style={styles.colSpacing} />
              <View style={styles.col}>
                <FormField label={t(tokens.requests.otEndTime)}>
                  <TimeInput
                    value={formatTime(times.ot_end)}
                    placeholder="--:--"
                    onPress={() => openTimePicker('ot_end')}
                  />
                </FormField>
              </View>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{t(tokens.requests.totalHours)}</Text>
                <Text style={styles.statValue}>{getHours('ot_start', 'ot_end')}</Text>
              </View>
            </View>
          </>
        );
      case 'permission':
        return (
          <>
            <FormField label={t(tokens.common.date)}>
              <DateInput
                value={formatDate(dates.perm_date)}
                placeholder="DD MMM YYYY"
                onPress={() => openDatePicker('perm_date')}
              />
            </FormField>
            <View style={styles.row}>
              <View style={styles.col}>
                <FormField label={t(tokens.requests.fromTime)}>
                  <TimeInput
                    value={formatTime(times.perm_from)}
                    placeholder="--:--"
                    onPress={() => openTimePicker('perm_from')}
                  />
                </FormField>
              </View>
              <View style={styles.colSpacing} />
              <View style={styles.col}>
                <FormField label={t(tokens.requests.toTime)}>
                  <TimeInput
                    value={formatTime(times.perm_to)}
                    placeholder="--:--"
                    onPress={() => openTimePicker('perm_to')}
                  />
                </FormField>
              </View>
            </View>
            {/* <InfoBanner text={t(tokens.requests.perDayTimeLimit)} highlight="2 hours" /> */}
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{t(tokens.requests.availablePermission)}</Text>
                <Text style={styles.statValue}>
                  {permissionBalanceLoading ? '...' : (
                    permissionBalance && Array.isArray(permissionBalance) && permissionBalance.length > 0
                      ? `${permissionBalance[0].allowed_permissions?.split(':').slice(0, 2).join(':') || '00:00'} ${t(tokens.common.hours)}`
                      : `00:00 ${t(tokens.common.hours)}`
                  )}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>{t(tokens.requests.totalHours)}</Text>
                <Text style={styles.statValue}>{getHours('perm_from', 'perm_to')}</Text>
              </View>
            </View>
          </>
        );
      case 'wfh':
        return (
          <>
            <FormField label={t(tokens.requests.wfhType)}>
              <DropdownInput
                placeholder={t(tokens.common.select)}
                value={wfhType?.label || wfhType}
                options={getWfhTypes(t)}
                onSelect={setWfhTypeDirty}
              />
            </FormField>
            <View style={styles.row}>
              <View style={styles.col}>
                <FormField label={t(tokens.requests.fromDate)}>
                  <DateInput
                    value={formatDate(dates.wfh_start_date)}
                    placeholder="YYYY-MM-DD"
                    onPress={() => openDatePicker('wfh_start_date')}
                  />
                </FormField>
              </View>
              <View style={styles.colSpacing} />
              <View style={styles.col}>
                <FormField label={t(tokens.requests.fromTime)}>
                  <TimeInput
                    value={formatTime(times.wfh_start_time)}
                    placeholder="hh:mm:ss"
                    onPress={() => openTimePicker('wfh_start_time')}
                  />
                </FormField>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.col}>
                <FormField label={t(tokens.requests.toDate)}>
                  <DateInput
                    value={formatDate(dates.wfh_end_date)}
                    placeholder="YYYY-MM-DD"
                    onPress={() => openDatePicker('wfh_end_date')}
                  />
                </FormField>
              </View>
              <View style={styles.colSpacing} />
              <View style={styles.col}>
                <FormField label={t(tokens.requests.toTime)}>
                  <TimeInput
                    value={formatTime(times.wfh_end_time)}
                    placeholder="hh:mm:ss"
                    onPress={() => openTimePicker('wfh_end_time')}
                  />
                </FormField>
              </View>
            </View>
            <FormField label={t(tokens.common.duration)}>
              <View style={[styles.inputContainer, { backgroundColor: '#F8F9FA' }]}>
                <Text style={styles.inputText}>{getWfhDuration()}</Text>
                <Ionicons name="time-outline" size={20} color="#62636C" />
              </View>
            </FormField>
          </>
        );
      case 'training':
        return (
          <>
            <View style={styles.row}>
              <View style={styles.col}>
                <FormField label={t(tokens.requests.fromDate)}>
                  <DateInput
                    value={formatDate(dates.training_start_date)}
                    placeholder="YYYY-MM-DD"
                    onPress={() => openDatePicker('training_start_date')}
                  />
                </FormField>
              </View>
              <View style={styles.colSpacing} />
              <View style={styles.col}>
                <FormField label={t(tokens.requests.fromTime)}>
                  <TimeInput
                    value={formatTime(times.training_start_time)}
                    placeholder="hh:mm:ss"
                    onPress={() => openTimePicker('training_start_time')}
                  />
                </FormField>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.col}>
                <FormField label={t(tokens.requests.toDate)}>
                  <DateInput
                    value={formatDate(dates.training_end_date)}
                    placeholder="YYYY-MM-DD"
                    onPress={() => openDatePicker('training_end_date')}
                  />
                </FormField>
              </View>
              <View style={styles.colSpacing} />
              <View style={styles.col}>
                <FormField label={t(tokens.requests.toTime)}>
                  <TimeInput
                    value={formatTime(times.training_end_time)}
                    placeholder="hh:mm:ss"
                    onPress={() => openTimePicker('training_end_time')}
                  />
                </FormField>
              </View>
            </View>
            <FormField label={t(tokens.requests.paycode)}>
              <DropdownInput
                placeholder={paycodesLoading ? t(tokens.common.loading) : t(tokens.common.select)}
                value={paycode?.label || paycode}
                options={trainingPaycodes}
                onSelect={setPaycodeDirty}
              />
            </FormField>
            <FormField label={t(tokens.common.duration)}>
              <View style={[styles.inputContainer, { backgroundColor: '#F8F9FA' }]}>
                <Text style={styles.inputText}>{getTrainingDuration()}</Text>
                <Ionicons name="time-outline" size={20} color="#62636C" />
              </View>
            </FormField>
          </>
        );
      default:
        return null;
    }
  };

  const formatLocalDateSummary = (d) => {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${m}/${y}`;
  };

  const renderSummary = () => {
    return (
      <View>
        <View style={styles.section}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name={
                  type === 'leave' ? 'calendar-outline' :
                    type === 'overtime' ? 'time-outline' :
                      type === 'manual_log' ? 'finger-print-outline' :
                        type === 'wfh' ? 'home-outline' :
                          type === 'training' ? 'school-outline' :
                            type === 'permission' ? 'document-text-outline' :
                              'clipboard-outline'
                }
                size={24}
                color="#1E1F24"
                style={{ marginRight: 12 }}
              />
              <Text style={styles.cardTitle}>
                {type === 'leave' ? t(tokens.requests.leaveRequest) :
                  type === 'overtime' ? t(tokens.requests.overtimeRequest) :
                    type === 'manual_log' ? t(tokens.requests.manualLogRequest) :
                      type === 'wfh' ? t(tokens.requests.wfhRequest) :
                        type === 'training' ? t(tokens.requests.trainingRequest) :
                          type === 'permission' ? t(tokens.requests.permissionRequest) :
                            getTitle().replace('New ', '')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsReviewing(false)}>
              <Ionicons name="create-outline" size={22} color="#62636C" />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryGrid}>
            {type === 'leave' ? (
              <>
                <SummaryRow label={t(tokens.common.type)} value={leaveType?.label || leaveType} />
                <SummaryRow
                  label={t(tokens.common.date)}
                  value={`${formatLocalDateSummary(dates.leave_from)} - ${formatLocalDateSummary(dates.leave_to)}`}
                />
                <SummaryRow
                  label={t(tokens.dashboard.totalDuration)}
                  value={isHalfDay ? halfDayType : getLeaveDays()}
                  isLast={true}
                />
              </>
            ) : type === 'manual_log' ? (
              <>
                <SummaryRow label={t(tokens.common.date)} value={formatDate(dates.manual_date)} />
                <SummaryRow label={t(tokens.common.requestType)} value={t(tokens.requests.manualLogRequest)} />
                <SummaryRow label={t(tokens.common.punchState)} value={punchState?.label} />
                <SummaryRow label={t(tokens.common.punchTime)} value={formatTime(times.manual_punch)} isLast={true} />
              </>
            ) : type === 'overtime' ? (
              <>
                <SummaryRow label={t(tokens.requests.otType)} value={otType?.label || otType || '--'} />
                <SummaryRow label={t(tokens.common.date)} value={formatLocalDateSummary(dates.ot_date)} />
                <SummaryRow label={t(tokens.requests.otStartTime)} value={formatTime(times.ot_start) || '--'} />
                <SummaryRow label={t(tokens.requests.otEndTime)} value={formatTime(times.ot_end) || '--'} />
                <SummaryRow label={t(tokens.dashboard.totalDuration)} value={getHours('ot_start', 'ot_end')} isLast={true} />
              </>
            ) : type === 'permission' ? (
              <React.Fragment key="perm-summary">
                <SummaryRow label={t(tokens.common.date)} value={formatDate(dates.perm_date)} />
                <SummaryRow label={t(tokens.requests.fromTime)} value={formatTime(times.perm_from) || '--'} />
                <SummaryRow label={t(tokens.requests.toTime)} value={formatTime(times.perm_to) || '--'} />
                <SummaryRow label={t(tokens.dashboard.totalDuration)} value={getHours('perm_from', 'perm_to')} isLast={true} />
              </React.Fragment>
            ) : type === 'wfh' ? (
              <>
                <SummaryRow label={t(tokens.requests.wfhType)} value={wfhType?.label || wfhType || '--'} />
                <SummaryRow
                  label={`${t(tokens.requests.fromDate)} / ${t(tokens.requests.fromTime)}`}
                  value={`${formatLocalDateSummary(dates.wfh_start_date)} ${formatTime(times.wfh_start_time)}`}
                />
                <SummaryRow
                  label={`${t(tokens.requests.toDate)} / ${t(tokens.requests.toTime)}`}
                  value={`${formatLocalDateSummary(dates.wfh_end_date)} ${formatTime(times.wfh_end_time)}`}
                />
                <SummaryRow
                  label={t(tokens.dashboard.totalDuration)}
                  value={`${getWfhDuration()} ${t(tokens.common.days)}`}
                  isLast={true}
                />
              </>
            ) : type === 'training' ? (
              <>
                <SummaryRow label={t(tokens.requests.paycode)} value={paycode?.label || paycode || '--'} />
                <SummaryRow
                  label={`${t(tokens.requests.fromDate)} / ${t(tokens.requests.fromTime)}`}
                  value={`${formatLocalDateSummary(dates.training_start_date)} ${formatTime(times.training_start_time)}`}
                />
                <SummaryRow
                  label={`${t(tokens.requests.toDate)} / ${t(tokens.requests.toTime)}`}
                  value={`${formatLocalDateSummary(dates.training_end_date)} ${formatTime(times.training_end_time)}`}
                />
                <SummaryRow
                  label={t(tokens.dashboard.totalDuration)}
                  value={`${getTrainingDuration()} ${t(tokens.common.days)}`}
                  isLast={true}
                />
              </>
            ) : (
              <React.Fragment key="other-summary">
                <SummaryRow label={t(tokens.common.date)} value={formatDate(dates.perm_date)} />
                <SummaryRow label={t(tokens.common.requestType)} value={t(tokens.requests[type + 'Request']) || type} isLast={true} />
              </React.Fragment>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.cardSectionTitle}>{t(tokens.expense.approvalWorkflow)}</Text>

          <View style={styles.workflowItem}>
            <View style={styles.workflowPoint}>
              <View style={styles.pointCircle}>
                <Text style={styles.pointNumber}>1</Text>
              </View>
              {(managers.length > 0 || managersLoading) && (
                <View style={styles.dashedLineContainer}>
                  {[...Array(5)].map((_, i) => (
                    <View key={`dash-wf1-${i}`} style={styles.dash} />
                  ))}
                </View>
              )}
            </View>
            <View style={styles.workflowContent}>
              <Text style={styles.workflowTitle}>{t(tokens.expense.requestSubmitted)}</Text>
            </View>
          </View>

          {managersLoading ? (
            <View style={[styles.workflowItem, { minHeight: 40 }]}>
              <View style={styles.workflowPoint}>
                <View style={[styles.pointCircle, { backgroundColor: '#F5F6F8', borderColor: '#D1D3D9' }]}>
                  <Text style={[styles.pointNumber, { color: '#62636C' }]}>2</Text>
                </View>
              </View>
              <View style={styles.workflowContent}>
                <Text style={styles.workflowTitle}>{t(tokens.common.loadingManagers)}</Text>
              </View>
            </View>
          ) : managers.length > 0 ? (
            managers.map((manager, index) => (
              <View key={`manager-step-${index}`} style={[styles.workflowItem, { minHeight: 40 }]}>
                <View style={styles.workflowPoint}>
                  <View style={[styles.pointCircle, { backgroundColor: '#F5F6F8', borderColor: '#D1D3D9' }]}>
                    <Text style={[styles.pointNumber, { color: '#62636C' }]}>{index + 2}</Text>
                  </View>
                  {index < managers.length - 1 && (
                    <View style={styles.dashedLineContainer}>
                      {[...Array(5)].map((_, i) => (
                        <View key={`dash-m-${index}-${i}`} style={styles.dash} />
                      ))}
                    </View>
                  )}
                </View>
                <View style={styles.workflowContent}>
                  <Text style={styles.workflowTitle}>{manager.role === 'manager' ? t(tokens.expense.managerApproval) : t(tokens.expense.workflowApproval)}</Text>
                  <Text style={styles.workflowSub}>{t(tokens.common.managerLabel)}{manager.approver_name}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.workflowItem, { minHeight: 40 }]}>
              <View style={styles.workflowPoint}>
                <View style={[styles.pointCircle, { backgroundColor: '#F5F6F8', borderColor: '#D1D3D9' }]}>
                  <Text style={[styles.pointNumber, { color: '#62636C' }]}>2</Text>
                </View>
              </View>
              <View style={styles.workflowContent}>
                <Text style={styles.workflowTitle}>{t(tokens.expense.managerApproval)}</Text>
                <Text style={styles.workflowSub}>{t(tokens.common.managerLabel)}--</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <LocalToast
        visible={!!localToast}
        message={localToast?.message}
        type={localToast?.type}
      />
      
      {/* Fixed Background */}
      <LinearGradient
        colors={['#8EA3E3', '#FFFFFF']}
        locations={[0, 0.3]}
        style={styles.backgroundFixed}
      />

      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: paddingTop + 16, zIndex: 2 }]}>
        <TouchableOpacity
          onPress={isReviewing ? () => setIsReviewing(false) : onBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1E1F24" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTitle()}</Text>
      </View>

      {/* Scrollable Form Content */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {isReviewing ? (
            renderSummary()
          ) : (
            <>
              {/* Request Details Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t(tokens.requests.requestDetails)}</Text>
                {renderContent()}
              </View>

              {/* Justification Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t(tokens.requests.justification)}</Text>
                <FormField label={t(tokens.expense.reason)}>
                  <TextInput
                    style={styles.textArea}
                    placeholder={t(tokens.common.enterHere)}
                    placeholderTextColor="#9E9E9E"
                    multiline
                    numberOfLines={4}
                    value={reason}
                    onChangeText={(text) => { setReason(text); setIsDirty(true); }}
                    textAlignVertical="top"
                  />
                </FormField>
              </View>

              {/* Attachments Section (Leave Only) */}
              {type === 'leave' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t(tokens.requests.attachments)}</Text>
                  {attachments.length > 0 && (
                    <View style={attachments.length > 0 && { marginTop: 12 }}>
                      <View style={styles.attachmentList}>
                        {attachments.map((doc, idx) => (
                          <View key={doc.filename || `attach-${idx}`} style={styles.attachmentItem}>
                            <Ionicons name="image-outline" size={20} color="#4169E1" />
                            <Text style={styles.attachmentName} numberOfLines={1} ellipsizeMode="middle">
                              {doc.filename}
                            </Text>
                            <TouchableOpacity onPress={() => removeAttachment(idx)}>
                              <Ionicons name="trash-outline" size={22} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  <View style={[styles.attachmentContainer, attachments.length > 0 && { marginTop: 12 }]}>
                    <Ionicons name="cloud-upload-outline" size={32} color="#4169E1" />
                    <View style={{ alignItems: 'center', marginVertical: 8 }}>
                      <Text style={styles.uploadText}>{t(tokens.requests.chooseFile)}</Text>
                      <Text style={styles.uploadSubText}>{t(tokens.requests.maxFileSizeText)}</Text>
                    </View>
                    <TouchableOpacity style={styles.browseButton} onPress={pickDocument}>
                      <Text style={styles.browseButtonText}>{t(tokens.requests.browseFile)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Fixed Footer Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: '#FFFFFF' }]}>
        {!isReviewing && (
          <TouchableOpacity
            style={[styles.submitButton, editingData && !isDirty && { opacity: 0.45 }]}
            onPress={handleReview}
            disabled={editingData ? !isDirty : false}
          >
            <Text style={styles.submitButtonText}>{editingData ? t(tokens.actions.updateReview) : t(tokens.actions.reviewSubmit)}</Text>
          </TouchableOpacity>
        )}
        {isReviewing && (
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
            onPress={handleConfirmSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>{editingData ? t(tokens.actions.confirmUpdate) : t(tokens.actions.confirmSubmit)}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Date/Time Pickers */}
      {(showPicker && pickerMode === 'date') && (
        <DatePickerModal
          locale="en"
          mode="single"
          visible={true}
          onDismiss={() => setShowPicker(false)}
          date={dates[currentField] || new Date()}
          onConfirm={onConfirmDate}
          validRange={(/manual/i.test(type) || /overtime/i.test(type)) ? { endDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) } : undefined}
        />
      )}
      <TimePickerModal
        locale="en"
        visible={showPicker && pickerMode === 'time'}
        onDismiss={() => setShowPicker(false)}
        onConfirm={onConfirmTime}
        hours={times[currentField] ? times[currentField].getHours() : new Date().getHours()}
        minutes={times[currentField] ? times[currentField].getMinutes() : new Date().getMinutes()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Dimensions.get('window').height * 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E1F24',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFF0F3',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1F24',
    marginBottom: 16,
  },
  cardHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#1E1F24',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EFF0F3',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#FFF',
  },
  inputText: {
    fontSize: 14,
    color: '#1E1F24',
  },
  placeholderText: {
    color: '#9E9E9E',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#EFF0F3',
    borderRadius: 8,
    padding: 12,
    height: 100,
    fontSize: 14,
    color: '#1E1F24',
    backgroundColor: '#FFF',
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  colSpacing: {
    width: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(65, 105, 225, 0.05)', // Light blue
    padding: 12,
    borderRadius: 0,
    marginBottom: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#4169E1',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#4169E1',
  },
  infoHighlight: {
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#9E9E9E',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4169E1',
    borderColor: '#4169E1',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1E1F24',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#4169E1',
  },
  toggleText: {
    fontSize: 13,
    color: '#62636C',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#FFF',
  },
  statsContainer: {
    backgroundColor: 'rgba(239, 240, 243, 0.5)',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#9E9E9E', // Muted gray
    fontWeight: '400',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1E1F24',
    fontWeight: '600',
  },
  summaryGrid: {
    marginTop: 8,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1F24',
    marginBottom: 20,
  },
  workflowItem: {
    flexDirection: 'row',
    minHeight: 50,
  },
  workflowPoint: {
    alignItems: 'center',
    width: 24,
    marginRight: 16,
  },
  pointCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EDF2FE',
    borderWidth: 1.5,
    borderColor: '#4169E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointNumber: {
    fontSize: 12,
    color: '#4169E1',
    fontWeight: '700',
  },
  dashedLineContainer: {
    flex: 1,
    width: 2,
    alignItems: 'center',
    marginVertical: 4,
  },
  dash: {
    width: 1,
    height: 2,
    backgroundColor: '#D1D3D9',
    marginVertical: 1,
  },
  workflowContent: {
    flex: 1,
    paddingTop: 2,
  },
  workflowTitle: {
    fontSize: 14,
    color: '#1E1F24',
    fontWeight: '600',
  },
  workflowSub: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#B9BBC6',
    opacity: 0.2,
  },
  attachmentContainer: {
    borderWidth: 1,
    borderColor: '#EFF0F3',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#EDF2FE',
  },
  uploadText: {
    fontSize: 12,
    color: '#1E1F24',
    fontWeight: '500',
  },
  uploadSubText: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 4,
  },
  browseButton: {
    backgroundColor: '#4169E1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  attachmentList: {
    marginTop: 8,
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFF0F3',
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    color: '#1E1F24',
    marginLeft: 12,
    marginRight: 12,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EFF0F3',
  },
  submitButton: {
    backgroundColor: '#4169E1',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownMenu: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 8,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24, // #0000003d is approx 24% opacity
    shadowRadius: 6,
    elevation: 5, // Changed from 4 to 5
    zIndex: 1000, // Added zIndex
    maxHeight: 250, // Added maxHeight
    borderWidth: 1,
    borderColor: '#EFF0F3',
  },
  dropdownItem: {
    padding: 12,
    borderRadius: 4,
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#1E1F24',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    lineHeight: 16,
  },
  // Local Toast Styles
  localToastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  localToastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    // Premium Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  localToastIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  localToastText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1F24',
    letterSpacing: -0.2,
  },
});

export default NewRequestScreen;