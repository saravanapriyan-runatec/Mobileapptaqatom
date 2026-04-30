import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import ProfileServices from '../../Services/API/ProfileServices.jsx';
import AuthService from '../../Services/AuthService';
import { useUser } from './UserContext';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import get from 'lodash/get';
import { formatErrorsToToastMessages } from '../utils/error-format';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const AttendanceContext = createContext();

export const useAttendance = () => useContext(AttendanceContext);

export const AttendanceProvider = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { userDetails } = useUser();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState('--:--');
  const [checkOutTime, setCheckOutTime] = useState('--:--');
  const [totalHours, setTotalHours] = useState('00:00:00');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [shiftInfo, setShiftInfo] = useState({ name: '--', start: '--:--', end: '--:--' });
  const [rawShiftData, setRawShiftData] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [rawCheckIn, setRawCheckIn] = useState(null);
  const [rawCheckOut, setRawCheckOut] = useState(null);
  const [empCode, setEmpCode] = useState(null);
  const [shiftDurationSeconds, setShiftDurationSeconds] = useState(9 * 60 * 60);
  const [locationAddress, setLocationAddress] = useState(t(tokens.attendance.fetchingLocation));
  const [isMissedCheckout, setIsMissedCheckout] = useState(false);
  const [coords, setCoords] = useState({ latitude: 0.0, longitude: 0.0 });
  const [attendanceDate, setAttendanceDate] = useState(new Date()); // Tracks the start date of the active shift
  
  const checkInDateRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const hasSentShiftNotification = useRef(false);

  const cancelAttendanceNotification = async () => {
    if (!Device.isDevice) return;
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {}
  };

  const scheduleAttendanceNotification = async () => {
    if (!Device.isDevice) return;
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t(tokens.notifications.attendanceActive),
          body: t(tokens.notifications.checkInReminders),
          sticky: true,
          color: '#2196F3',
        },
        trigger: null,
      });
    } catch (e) {}
  };

  const scheduleCheckOutNotification = async (duration) => {
    if (!Device.isDevice) return;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t(tokens.notifications.checkOutSuccess),
          body: t(tokens.notifications.sessionSummary, { duration }),
          color: '#27AE60',
        },
        trigger: null,
      });
    } catch (e) {}
  };

  const scheduleShiftCompleteNotification = async () => {
    if (!Device.isDevice || hasSentShiftNotification.current) return;
    try {
      hasSentShiftNotification.current = true;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t(tokens.notifications.shiftCompleted),
          body: t(tokens.notifications.shiftCompletedMsg),
          color: '#F39C12',
          sound: true,
        },
        trigger: null,
      });
    } catch (e) {}
  };

  const resetState = useCallback(async () => {
    setIsCheckedIn(false); setHasCheckedIn(false); setIsSessionCompleted(false); setIsMissedCheckout(false);
    setCheckInTime('--:--'); setCheckOutTime('--:--'); setTotalHours('00:00:00');
    setRawCheckIn(null); setRawCheckOut(null);
    setElapsedSeconds(0); checkInDateRef.current = null;
    setAttendanceDate(new Date());
    hasSentShiftNotification.current = false;
    cancelAttendanceNotification();
  }, []);

  useEffect(() => {
    // Sync moment's global locale with i18next language
    moment.locale(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    const initialize = async () => {
      // --- PERMISSIONS: Request notification permissions on mobile devices ---
      if (Device.isDevice) {
        try {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus !== 'granted') {
            console.warn('DEBUG [AttendanceContext]: Notification permission not granted');
          }
        } catch (error) {
          console.error('DEBUG [AttendanceContext]: Error requesting notification permissions:', error);
        }
      }

      // Check for Expo Go notification limitation on Android
      if (Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient') {
        Toast.show({
          type: 'info',
          text1: t(tokens.attendance.notificationLimitation),
          text2: t(tokens.attendance.expoGoLimitation),
          visibilityTime: 6000,
        });
      }

      if (!userDetails) {
        await resetState();
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const uId = userDetails.id || await AuthService.getUserId();
        if (uId) {
          const username = userDetails.username || (await ProfileServices.getUserDetailsData(uId))?.username;
          if (username) {
            const employee = await ProfileServices.getEmployeeDetailsData(username);
            const empId = employee?.id;
            if (empId) {
              setEmployeeId(empId); setEmpCode(username);
              // Check local storage for today's completion status first for instant UI lock
              const todayStr = moment().locale('en').format('YYYY-MM-DD');
              const localCompletedDate = await SecureStore.getItemAsync(`sessionCompleted_${empId}`);
              if (localCompletedDate === todayStr) {
                setIsSessionCompleted(true);
                setIsCheckedIn(false);
                setHasCheckedIn(true);
              }
              await Promise.all([fetchShiftDetails(empId), resumeActiveSession(empId), fetchLocation()]);
            }
          }
        }
      } catch (err) {
      } finally { setLoading(false); }
    };
    initialize();
  }, [userDetails?.id]);

  useEffect(() => {
    // --- SHIFT-AWARE MIDNIGHT TRANSITION ---
    const checkDateChange = () => {
      const liveToday = moment().locale('en').format('YYYY-MM-DD');
      const stateDate = moment(currentDate).locale('en').format('YYYY-MM-DD');
      
      if (liveToday !== stateDate) {
        // Only trigger a full reset if not currently in an active shift window
        if (!isCheckedIn) {
          // If the user's shift typically starts late (like Shift 2 or 3), 
          // we should be careful not to reset if they are just about to start or in the middle.
          const isLateShift = shiftInfo.start.includes('PM') || parseInt(shiftInfo.start) >= 12;
          const currentHour = new Date().getHours();
          
          // Professional cut-off: 4 AM is usually safe for "New Day" starts
          if (currentHour >= 4 || !isLateShift) {
             setCurrentDate(new Date());
             resetState();
             if (employeeId) resumeActiveSession(employeeId);
          }
        } else {
          // Keep the current calendar date locked to the shift start date if checked in
          if (checkInDateRef.current) {
            setCurrentDate(checkInDateRef.current);
          }
        }
      }
    };
    const dateInterval = setInterval(checkDateChange, 60000);
    return () => clearInterval(dateInterval);
  }, [currentDate, employeeId, isCheckedIn, shiftInfo]);

  useEffect(() => {
    if (rawShiftData) {
      setShiftInfo({
        name: rawShiftData.name,
        start: moment(rawShiftData.start, 'HH:mm:ss').format('hh:mm A'),
        end: moment(rawShiftData.end, 'HH:mm:ss').format('hh:mm A')
      });
    }
    // Re-format check-in/out times on language change
    if (rawCheckIn) setCheckInTime(moment(rawCheckIn).format('hh:mm A'));
    if (rawCheckOut) setCheckOutTime(moment(rawCheckOut).format('hh:mm A'));
  }, [rawShiftData, rawCheckIn, rawCheckOut, i18n.language]);

  const fetchAttendanceStatus = async (id, skipCheckInOverwrite = false, punchData = null) => {
    try {
      if (!id) return;
      const response = await ProfileServices.getRecentActivityData({ id });
      const activities = Array.isArray(response?.results) ? response.results : (response?.id ? [response] : []);
      const todayStr = moment().locale('en').format('YYYY-MM-DD');
      const targetDay = checkInDateRef.current ? moment(checkInDateRef.current).locale('en').format('YYYY-MM-DD') : todayStr;
      const activity = activities.find(a => moment(a.clock_in_time || a.date).locale('en').format('YYYY-MM-DD') === targetDay);
      const formatTime = (t) => t ? moment(t).format('hh:mm A') : '--:--';

      if (activity) {
        const wasPreviouslyCompleted = isSessionCompleted;
        // Determine completion from server
        const completed = !!activity.clock_out_time || (!activity.is_checked_in && !!activity.clock_in_time);
        
        // --- HARDENING: Never revert 'completed' status back to 'false' for the same calendar block ---
        if (completed && moment(activity.clock_in_time || activity.date).locale('en').format('YYYY-MM-DD') === todayStr) {
          setIsSessionCompleted(true);
          setIsCheckedIn(false);
          checkInDateRef.current = null;
          // Persist locally too
          if (id) SecureStore.setItemAsync(`sessionCompleted_${id}`, todayStr).catch(()=>{});
        }
        
        if (!skipCheckInOverwrite) {
          // Only update checked-in status if not already completed
          if (!isSessionCompleted && !completed) {
            setIsCheckedIn(!!activity.is_checked_in);
            setHasCheckedIn(!!activity.clock_in_time);
            if (activity.clock_in_time) {
              setRawCheckIn(new Date(activity.clock_in_time));
              setCheckInTime(formatTime(activity.clock_in_time));
              if (activity.is_checked_in) {
                checkInDateRef.current = new Date(activity.clock_in_time);
                const currentElapsed = Math.floor((Date.now() - checkInDateRef.current.getTime()) / 1000);
                setElapsedSeconds(Math.min(currentElapsed, shiftDurationSeconds));
              }
            }
          }
        } else if (activity.clock_in_time) {
          setRawCheckIn(new Date(activity.clock_in_time));
          setCheckInTime(formatTime(activity.clock_in_time));
        }
        
        if (activity.clock_out_time) {
          setRawCheckOut(new Date(activity.clock_out_time));
          setCheckOutTime(formatTime(activity.clock_out_time));
        }
        
        if (activity.total_working_hours) {
          setTotalHours(activity.total_working_hours);
          // Only sync elapsed seconds from totalHours if completed or just checked out
          if (isSessionCompleted || completed || !isCheckedIn) {
            const parts = activity.total_working_hours.split(':').map(Number);
            if (parts.length === 3) setElapsedSeconds(parts[0] * 3600 + parts[1] * 60 + parts[2]);
          }
          if (completed && !wasPreviouslyCompleted) scheduleCheckOutNotification(activity.total_working_hours);
        }
      } else if (punchData && punchData.length > 0) {
        const inP = punchData.find(p => String(p.punch_state) === '0' || String(p.clock_type) === '0');
        const outP = punchData.find(p => String(p.punch_state) === '1' || String(p.clock_type) === '1');
        if (inP) {
          const inDate = new Date(inP.punch_time || inP.updated_at);
          setRawCheckIn(inDate);
          setCheckInTime(formatTime(inDate));
        }
        if (outP) {
          const outDate = new Date(outP.punch_time || outP.updated_at);
          setRawCheckOut(outDate);
          setCheckOutTime(formatTime(outDate));
          const start = moment(inP.punch_time || inP.updated_at), end = moment(outP.punch_time || outP.updated_at);
          const diffSecs = end.diff(start, 'seconds'); setElapsedSeconds(diffSecs);
          const dur = formatDuration(diffSecs); setTotalHours(dur);
          if (!isSessionCompleted) { setIsSessionCompleted(true); setIsCheckedIn(false); scheduleCheckOutNotification(dur); }
        }
      }
    } catch (err) {}
  };

  const resumeActiveSession = async (id) => {
    try {
      if (!id) return;
      const todayStr = moment().locale('en').format('YYYY-MM-DD');
      const yesterdayStr = moment().locale('en').subtract(1, 'day').format('YYYY-MM-DD');
      
      let res = await ProfileServices.getCheckInData(id, todayStr);
      let allPunches = Array.isArray(res) ? res : (res?.results || (res?.id ? [res] : []));
      
      // Step 1: Check if there's an active "In" today
      const hasActiveToday = allPunches.some(p => (String(p.punch_state) === '0' || String(p.clock_type) === '0')) && 
                             !allPunches.some(p => (String(p.punch_state) === '1' || String(p.clock_type) === '1'));
      
      if (!hasActiveToday) {
        // Step 2: Look at yesterday for a night shift session
        const yRes = await ProfileServices.getCheckInData(id, yesterdayStr);
        const yPunches = Array.isArray(yRes) ? yRes : (yRes?.results || (yRes?.id ? [yRes] : []));
        const latestY = [...yPunches].sort((a,b) => new Date(b.punch_time || b.updated_at) - new Date(a.punch_time || a.updated_at))[0];
        
        // Professional Dynamic Window: Only resume if within ShiftDuration + 6 hours (Max tolerance for late checkouts)
        const maxSessionDuration = (shiftDurationSeconds + (6 * 3600)) * 1000;
        const isRecentY = latestY && (Date.now() - new Date(latestY.punch_time || latestY.updated_at).getTime()) < maxSessionDuration;

        if (latestY && (String(latestY.punch_state) === '0' || String(latestY.clock_type) === '0') && isRecentY) {
          allPunches = yPunches;
        }
      }

      const hasOutToday = allPunches.some(p => (String(p.punch_state) === '1' || String(p.clock_type) === '1'));
      if (hasOutToday) {
        setIsSessionCompleted(true); setIsCheckedIn(false); setHasCheckedIn(true);
        SecureStore.setItemAsync(`sessionCompleted_${id}`, todayStr).catch(()=>{});
        await fetchAttendanceStatus(id, false, allPunches);
        return;
      }
      
      const latest = [...allPunches].sort((a, b) => new Date(b.punch_time || b.updated_at) - new Date(a.punch_time || a.updated_at))[0];
      if (latest && (String(latest.punch_state) === '0' || String(latest.clock_type) === '0')) {
          const pDate = moment(latest.punch_time || latest.updated_at).toDate();
          const maxSessionDuration = (shiftDurationSeconds + (6 * 3600)) * 1000;
          
          if ((Date.now() - pDate.getTime()) < maxSessionDuration) {
            checkInDateRef.current = pDate; setIsCheckedIn(true); setHasCheckedIn(true); setIsSessionCompleted(false);
            setRawCheckIn(pDate);
            setAttendanceDate(pDate);
            setCurrentDate(pDate); // Lock UI to the shift start date
            setCheckInTime(moment(pDate).format('hh:mm A')); 
            
            const resumedElapsed = Math.floor((Date.now() - pDate.getTime()) / 1000);
            setElapsedSeconds(resumedElapsed);
            await fetchAttendanceStatus(id, true, allPunches);
            return;
          }
      }
      await fetchAttendanceStatus(id, false, allPunches);
    } catch (err) { await fetchAttendanceStatus(id); }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (appState.current.match(/inactive|background/) && nextState === 'active' && employeeId) resumeActiveSession(employeeId);
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [employeeId]);

  useEffect(() => {
    let interval = null, pollInterval = null;
    if (isCheckedIn && !isSessionCompleted) {
      scheduleAttendanceNotification();
      interval = setInterval(() => {
        if (checkInDateRef.current) {
          const now = new Date();
          const todayStr = moment(now).locale('en').format('YYYY-MM-DD');
          const checkInDayStr = moment(checkInDateRef.current).locale('en').format('YYYY-MM-DD');

          if (todayStr !== checkInDayStr) {
            setCurrentDate(now);
          }

          const currentElapsed = Math.floor((now.getTime() - checkInDateRef.current.getTime()) / 1000);
          setElapsedSeconds(currentElapsed);
          // Visual cap for totalHours at 9h for the display, but we keep tracking internally
          setTotalHours(formatDuration(Math.min(currentElapsed, shiftDurationSeconds)));
          
          // --- 9-HOUR NOTIFICATION: ONLY Notify, do NOT stop ---
          if (currentElapsed >= shiftDurationSeconds && !hasSentShiftNotification.current) {
                scheduleShiftCompleteNotification();
                hasSentShiftNotification.current = true;
                Toast.show({
                  type: 'info',
                  text1: t(tokens.attendance.workCompleted),
                  text2: t(tokens.attendance.nineHoursCompleted),
                });
          }

          // --- 24-HOUR LIMIT: Auto-stop and lock session ---
          if (currentElapsed >= 86400) { // 24 Hours
            setIsCheckedIn(false);
            setIsSessionCompleted(true);
            setIsMissedCheckout(true);
            checkInDateRef.current = null;
            return;
          }
        }
      }, 1000);
      pollInterval = setInterval(() => { if (employeeId && !isSessionCompleted) resumeActiveSession(employeeId); }, 30000);
    } else {
      cancelAttendanceNotification(); clearInterval(interval); clearInterval(pollInterval);
    }
    return () => { clearInterval(interval); clearInterval(pollInterval); };
  }, [isCheckedIn, isSessionCompleted, employeeId, shiftDurationSeconds]);

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      const now = new Date(), todayStr = moment(now).locale('en').format('YYYY-MM-DD');
      let checkedIn = false;
      try {
        const data = await ProfileServices.getCheckInData(employeeId, todayStr);
        const punches = Array.isArray(data) ? data : (data?.results || (data?.id ? [data] : []));
        checkedIn = punches.some(p => (String(p.punch_state) === '0' || String(p.clock_type) === '0'));
      } catch (e) {
        const resp = await ProfileServices.getRecentActivityData({ id: employeeId });
        checkedIn = !!(get(resp, 'results[0].is_checked_in'));
      }
      if (checkedIn) { Toast.show({ type: 'error', text1: t(tokens.attendance.alreadyCheckedIn) }); await resumeActiveSession(employeeId); return; }
      
      const payload = { latitude: toFixedIfNecessary(coords?.latitude || 0, 6), longitude: toFixedIfNecessary(coords?.longitude || 0, 6), punch_time: new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('.')[0], employee_id: employeeId, clock_type: 0 };
      const response = await ProfileServices.updateClockStatus(payload);
      
      // Update state ONLY after successful API call
      setIsCheckedIn(true); 
      setHasCheckedIn(true); 
      setRawCheckIn(now);
      setAttendanceDate(now);
      setCurrentDate(now);
      setCheckInTime(moment(now).format('hh:mm A'));
      setCheckOutTime('--:--'); 
      setRawCheckOut(null);
      checkInDateRef.current = now; 
      setElapsedSeconds(0); 
      setTotalHours('00:00:00'); 
      hasSentShiftNotification.current = false;
      
      Toast.show({ 
        type: 'success', 
        text1: response?.message || t(tokens.attendance.checkedInSuccess),
        position: 'top' 
      });
      await fetchAttendanceStatus(employeeId);
    } catch (err) { 
      formatErrorsToToastMessages(err);
      await resumeActiveSession(employeeId); 
    } finally { setLoading(false); }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      const now = new Date(), todayStr = moment(now).locale('en').format('YYYY-MM-DD');
      let checkedOut = false;
      try {
        const data = await ProfileServices.getCheckInData(employeeId, todayStr);
        const punches = Array.isArray(data) ? data : (data?.results || (data?.id ? [data] : []));
        checkedOut = punches.some(p => (String(p.punch_state) === '1' || String(p.clock_type) === '1'));
      } catch (e) {}
      
      if (checkedOut) { 
        Toast.show({ type: 'error', text1: t(tokens.attendance.alreadyCheckedOut) }); 
        setIsSessionCompleted(true); setIsCheckedIn(false);
        await resumeActiveSession(employeeId); 
        return; 
      }
      
      const finalDur = formatDuration(elapsedSeconds);
      const payload = { latitude: toFixedIfNecessary(coords.latitude, 6), longitude: toFixedIfNecessary(coords.longitude, 6), punch_time: new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('.')[0], employee_id: employeeId, clock_type: 1 };
      const response = await ProfileServices.updateClockStatus(payload);
      
      // Update state ONLY after successful API call
      setIsCheckedIn(false); 
      setIsSessionCompleted(true); 
      setTotalHours(finalDur); 
      setRawCheckOut(now);
      setCheckOutTime(moment(now).format('hh:mm A')); 
      checkInDateRef.current = null;
      if (employeeId) SecureStore.setItemAsync(`sessionCompleted_${employeeId}`, todayStr).catch(()=>{});
      
      Toast.show({ 
        type: 'success', 
        text1: response?.message || t(tokens.attendance.checkedOutSuccess),
        position: 'top'
      });
      scheduleCheckOutNotification(finalDur); 
      await fetchAttendanceStatus(employeeId);
    } catch (err) { 
      formatErrorsToToastMessages(err);
      setIsCheckedIn(true); 
      setIsSessionCompleted(false); 
    } finally { setLoading(false); }
  };

  const fetchShiftDetails = async (id) => {
    try {
      const today = moment().locale('en').format('YYYY-MM-DD');
      const response = await ProfileServices.getEmployeeShiftDetails({ emp_id: id, start_date: today, end_date: today });
      const shift = (Array.isArray(response) ? response : response?.results)?.[0];
      if (shift) {
        // Calculate dynamic shift duration
        const startTime = moment(shift.start_time, 'HH:mm:ss');
        const endTime = moment(shift.end_time, 'HH:mm:ss');
        if (endTime.isBefore(startTime)) {
          endTime.add(1, 'days');
        }
        const durationSecs = endTime.diff(startTime, 'seconds');
        setShiftDurationSeconds(durationSecs);

        setRawShiftData({
          name: shift.shift?.name || 'General Shift',
          start: shift.start_time,
          end: shift.end_time
        });
      }
    } catch (e) {}
  };

  const fetchLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setCoords(loc.coords); let addr = await Location.reverseGeocodeAsync(loc.coords);
      if (addr?.[0]) setLocationAddress(`${addr[0].name}, ${addr[0].city}`.replace(/^, /, ''));
    } catch (e) {}
  };

  const formatDuration = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const formatRemainingTime = () => {
    const rem = Math.max(shiftDurationSeconds - elapsedSeconds, 0);
    return `${Math.floor(rem/3600)}h ${Math.floor((rem%3600)/60)}m ${t(tokens.attendance.left)}`;
  };

  const toFixedIfNecessary = (v, dp) => +parseFloat(v).toFixed(dp);
  const formatDate = (date) => {
    const d = moment(date);
    const dayName = [t(tokens.days.sunday), t(tokens.days.monday), t(tokens.days.tuesday), t(tokens.days.wednesday), t(tokens.days.thursday), t(tokens.days.friday), t(tokens.days.saturday)][d.day()];
    const monthName = [t(tokens.months.january), t(tokens.months.february), t(tokens.months.march), t(tokens.months.april), t(tokens.months.mayFull), t(tokens.months.june), t(tokens.months.july), t(tokens.months.august), t(tokens.months.september), t(tokens.months.october), t(tokens.months.november), t(tokens.months.december)][d.month()];
    return `${dayName}, ${d.date()} ${monthName} ${d.year()}`;
  };

  return (
    <AttendanceContext.Provider value={{
      isCheckedIn, hasCheckedIn, checkInTime, checkOutTime, totalHours,
      elapsedSeconds, isSessionCompleted, isMissedCheckout, currentDate, SHIFT_DURATION_SECONDS: shiftDurationSeconds,
      shiftInfo, loading, locationAddress, coords, formatDuration, formatRemainingTime,
      employeeId, empCode, formatDate, handleCheckIn, handleCheckOut,
      refreshStatus: () => fetchAttendanceStatus(employeeId)
    }}>
      {children}
    </AttendanceContext.Provider>
  );
};
