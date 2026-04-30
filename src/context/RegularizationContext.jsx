import React, { createContext, useState, useContext, useEffect } from 'react';
import ProfileServices from '../../Services/API/ProfileServices';
import moment from 'moment';
import { useUser } from './UserContext';

const RegularizationContext = createContext();

export const RegularizationProvider = ({ children }) => {
  const { userDetails } = useUser();
  const [requests, setRequests] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initial data fetch
  useEffect(() => {
    if (userDetails?.id) {
      fetchRequests();
    }
  }, [userDetails?.id]);

  const fetchAttendanceStatus = async (customStart, customEnd) => {
    try {
      if (!userDetails?.username) return;

      const startDate = customStart || moment().subtract(1, 'month').format('YYYY-MM-DD');
      const endDate = customEnd || moment().format('YYYY-MM-DD');

      // Get employee details for numeric ID (required for shifts)
      const employee = await ProfileServices.getEmployeeDetailsData(userDetails.username);
      const empIdForShift = employee?.id;

      const [attendanceResponse, shiftResponse] = await Promise.all([
        ProfileServices.getAttendanceSummary({
          emp_code: userDetails.username,
          start_date: startDate,
          end_date: endDate
        }),
        empIdForShift ? ProfileServices.getEmployeeShiftDetails({
          emp_id: empIdForShift,
          start_date: startDate,
          end_date: endDate
        }) : Promise.resolve([])
      ]);
      // console.log("✅ [CONTEXT] Attendance Summary Response:", JSON.stringify(attendanceResponse, null, 2));

      const attendanceData = attendanceResponse?.employee_attendance || (Array.isArray(attendanceResponse) ? attendanceResponse : (attendanceResponse?.results || []));
      const shiftDataList = Array.isArray(shiftResponse) ? shiftResponse : (shiftResponse?.results || []);

      // Merge shift data into attendance data
      const finalMergedData = attendanceData.map(item => {
        const itemDateStr = moment(item.date).format('YYYY-MM-DD');
        const correspondingShift = shiftDataList.find(s => moment(s.date).format('YYYY-MM-DD') === itemDateStr);
        
        if (correspondingShift) {
          const totalBreakMins = correspondingShift.break_times?.reduce((sum, b) => sum + (b.duration || 0), 0) || 0;
          return {
            ...item,
            shift_name: correspondingShift.shift?.name || item.shift_name,
            total_break_time: totalBreakMins > 0 ? `${totalBreakMins} Minutes` : '--',
            shift_start: correspondingShift.start_time || item.shift_start,
            shift_end: correspondingShift.end_time || item.shift_end
          };
        }
        return item;
      });

      setAttendanceStatus(finalMergedData);
      // console.log("✅ [CONTEXT] Final Merged Attendance Data:", JSON.stringify(finalMergedData, null, 2));
    } catch (error) {
      console.error("🔴 [ERROR] fetchAttendanceStatus:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const empID = userDetails?.id;
      if (!empID) return;

      const startDate = moment().locale('en').subtract(1, 'month').format('YYYY-MM-DD');
      const endDate = moment().locale('en').format('YYYY-MM-DD');

      const [response, shiftResponse] = await Promise.all([
        ProfileServices.getAllTypesRequests({
          employee: empID,
          start_date: startDate,
          end_date: endDate
        }),
        ProfileServices.getEmployeeShiftDetails({
          emp_id: empID,
          start_date: startDate,
          end_date: endDate
        })
      ]);
      console.log('DEBUG [RegularizationContext]: Raw getAllTypesRequests response:', JSON.stringify(response, null, 2));

      const shiftDataList = Array.isArray(shiftResponse) ? shiftResponse : (shiftResponse?.results || []);
      const data = (Array.isArray(response) ? response : (response?.results || [])).map(item => {
        let typeId = item.typeId;
        
        // Map type string to internal typeId if missing
        if (!typeId && item.type) {
          const typeMap = {
            'Training': 'training',
            'Manual Log': 'manual_log',
            'Work From Home': 'wfh',
            'Permission': 'permission',
            'Leave': 'leave',
            'Overtime': 'overtime'
          };
          typeId = typeMap[item.type];
        }

        if (!typeId) {
          if (item.leave_type) typeId = 'leave';
          else if (item.overtime_hours) typeId = 'overtime';
          else if (item.manual_log_details || item.actual_check_in) typeId = 'manual_log';
          else if (item.training_name) typeId = 'training';
          else if (item.wfh_date) typeId = 'wfh';
          else typeId = 'manual_log';
        }

        const statusMap = {
          0: 'Pending', 1: 'Pending', 2: 'Approved', 3: 'Rejected', 4: 'Revoked',
          '0': 'Pending', '1': 'Pending', '2': 'Approved', '3': 'Rejected', '4': 'Revoked'
        };

        const mappedStatus = statusMap[item.status] || item.status || 'Pending';

        const itemDateStr = item.date;
        const correspondingShift = shiftDataList.find(s => s.date === itemDateStr);
        
        let shift_name = item.shift_name;
        let total_break_time = item.total_break_time;
        
        if (correspondingShift) {
          shift_name = correspondingShift.shift?.name || shift_name;
          const totalBreakMins = correspondingShift.break_times?.reduce((sum, b) => sum + (b.duration || 0), 0) || 0;
          total_break_time = totalBreakMins > 0 ? `${totalBreakMins} Minutes` : '--';
        }

        return { ...item, typeId, status: mappedStatus, shift_name, total_break_time };
      });
      
      setRequests(data);
    } catch (error) {
      console.error("Error fetching all requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const addRequest = async (newRequest) => {
    try {
      setLoading(true);
      const empID = userDetails?.id;
      if (!empID) throw new Error('No employee ID found');
      
      const payload = {
        employee: empID,
        date: moment(newRequest.date).locale('en').format('YYYY-MM-DD'),
        actual_check_in: newRequest.checkIn ? (newRequest.checkIn instanceof Date ? moment(newRequest.checkIn).locale('en').format("HH:mm:ss") : moment(newRequest.checkIn, ["hh:mm A", "h:mm A"]).locale('en').format("HH:mm:ss")) : null,
        actual_check_out: newRequest.checkOut ? (newRequest.checkOut instanceof Date ? moment(newRequest.checkOut).locale('en').format("HH:mm:ss") : moment(newRequest.checkOut, ["hh:mm A", "h:mm A"]).locale('en').format("HH:mm:ss")) : null,
        reason: newRequest.reason || "No reason provided"
      };

      const response = await ProfileServices.submitRegularization(payload);
      console.log("📝 [REGULARIZATION CONTEXT] Request Success Response:", JSON.stringify(response, null, 2));
      fetchRequests(); // Refresh
      return response;
    } catch (error) {
      console.error("Error submitting regularization:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = (id) => {
    setRequests(prevRequests => prevRequests.filter(req => req.id !== id));
  };

  return (
    <RegularizationContext.Provider value={{ requests, attendanceStatus, loading, addRequest, deleteRequest, fetchRequests, fetchAttendanceStatus }}>
      {children}
    </RegularizationContext.Provider>
  );
};

export const useRegularization = () => {
  const context = useContext(RegularizationContext);
  if (!context) {
    throw new Error('useRegularization must be used within a RegularizationProvider');
  }
  return context;
};
