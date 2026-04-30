import * as FileSystem from 'expo-file-system/legacy';

import APIService, { getUrlForHeaders } from '../APIService';
import AuthService from '../AuthService';
import { API_URL } from '../../src/utils/config';


const ProfileServices = {
  getUserDetails() {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/api/v1/booking/user/information`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getEmployeeNameDetails() {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/employee/subordinate_to_manager/`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getResignations(employeeId) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/resign/resignation_status_without_pagination/?id=${employeeId}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getPayrollHistoryData(empId) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/payroll/p1/payruns/emp_history/?emp_id=${empId}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getPayrollHistory(empId) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/payroll/p1/payruns/emp_history/?emp_id=${empId}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getpayrollDetails(payrollId) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/payroll/${payrollId}/`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getSalaryStructure(earning, id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/employee/get_salary_components/?q=${earning}&emp=${id}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getHolidayDetails(userId, selectedYear) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/holiday/get_holidays/?employee_id=${userId}&year=${selectedYear}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getPayrollHistoryFullData(sumId, payrunId) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/payroll/p1/payruns/emp_salary_details/?summary_id=${sumId}&payrun_id=${payrunId}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  // downloadPaySlip(pay_run_id, employee_id) {
  //   
  //   console.log(
  //     `${API_URL}/file/get_all_payslips/?pay_run_id=${pay_run_id}&employee_id=${employee_id}`,
  //   );

  //   return new Promise(async (resolve, reject) => {
  //     resolve({
  //       data: `${API_URL}/file/get_all_payslips/?pay_run_id=${pay_run_id}&employee_id=${employee_id}`,
  //     });

  //     // 

  //     const session = await AuthService.getSessionToken();
  //     const token = await AuthService.getToken();
  //     const domainName = await AuthService.getDomainName();

  //     const res = await fetch(
  //       `${API_URL}/file/get_all_payslips/?pay_run_id=${pay_run_id}&employee_id=${employee_id}`,
  //       {
  //         method: 'GET',
  //         headers: {
  //           sessionToken: session,
  //           Authorization: `Bearer ${token}`,
  //           domainName: domainName,
  //           hostName: domainName,
  //         },
  //       },
  //     );
  //     // const data = await res.json();
  //     // APIService.staticRequest(
  //     //   {
  //     //     url: `${API_URL}/file/get_all_payslips/?pay_run_id=${pay_run_id}&employee_id=${employee_id}`,
  //     //     method: 'GET',
  //     //   },
  //     //   (error, data) => {
  //     //     
  //     //     if (error) {
  //     //       
  //     //       reject(error);
  //     //       return;
  //     //     }
  //     //     
  //     //     resolve(data);
  //     //   },
  //     // );
  //     const pdfBlob = new Blob([get(res, 'data')], {type: 'application/pdf'});
  //     
  //     const pdfurl = URL.createObjectURL(pdfBlob);
  //     
  //     const data = res;
  //     resolve(data);
  //   });
  // },

  // downloadPaySlip(pay_run_id, employee_id) {
  //   

  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const session = await AuthService.getSessionToken();
  //       const token = await AuthService.getToken();
  //       const domainName = await getUrlForHeaders();
  //       const pdfUrl = `${API_URL}/file/get_all_payslips/?pay_run_id=${pay_run_id}&employee_id=${employee_id}`;

  //       

  //       const {config, fs} = RNFetchBlob;
  //       const downloadDir =
  //         Platform.OS === 'ios' ? fs.dirs.DocumentDir : fs.dirs.DownloadDir;

  //       const response = await config({
  //         fileCache: true,
  //         addAndroidDownloads: {
  //           useDownloadManager: true,
  //           notification: true,
  //           path: `${downloadDir}/${`payslip`}.pdf`,
  //           description: 'Downloading PDF file.',
  //         },
  //         path: `${downloadDir}/payslip.pdf`,
  //       }).fetch('GET', pdfUrl, {
  //         sessionToken: session,
  //         Authorization: `Bearer ${token}`,
  //         hostName: domainName,
  //       });

  //       );
  //       resolve({
  //         path: response.path(),
  //         success: true,
  //       });
  //     } catch (error) {
  //       
  //       reject(error);
  //     }
  //   });
  // },



  // FIXED: Updated downloadPaySlip to use new FileSystem API instead of deprecated createDownloadResumable

  downloadPaySlip(pay_run_id, employee_id, filename) {
    return new Promise(async (resolve, reject) => {
      try {
        const sessionToken = await AuthService.getSessionToken();
        const token = await AuthService.getToken();
        const domainName = await getUrlForHeaders();

        const pdfUrl = `${API_URL}/file/get_all_payslips/?pay_run_id=${pay_run_id}&employee_id=${employee_id}`;
        const finalFilename = filename || `payslip_${pay_run_id}_${employee_id}.pdf`;
        const downloadUri = `${FileSystem.cacheDirectory}${finalFilename}`;

        // console.log("📥 Downloading from:", pdfUrl);
        // console.log("💾 Saving to:", downloadUri);

        console.log("📥 [DEBUG] Starting download from:", pdfUrl);

        // ✅ NEW API - Use downloadAsync instead of createDownloadResumable
        const downloadResult = await FileSystem.downloadAsync(
          pdfUrl,
          downloadUri,
          {
            headers: {
              sessionToken,
              Authorization: `Bearer ${token}`,
              hostName: domainName,
            },
          }
        );

        console.log("📥 [DEBUG] Download Status:", downloadResult.status);
        console.log("📥 [DEBUG] Download result path:", downloadResult.uri);

        // console.log("✅ Download complete:", downloadResult);

        // Verify file exists
        const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);

        if (!fileInfo.exists || fileInfo.size === 0) {
          throw new Error('Downloaded file is missing or empty');
        }

        // console.log("📁 File verified:", fileInfo);

        // Handle platform-specific sharing

        // Return the file path - let the component handle sharing
        resolve({
          path: downloadResult.uri,
          success: true
        });

      } catch (error) {
        console.error("❌ Download error:", error);
        reject(error);
      }
    });
  }
  ,
  updateClockStatus(options) {

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/clockInOut/`,
          method: 'POST',
          data: options,
        },
        (error, data) => {
          if (error) {
            console.error("❌ [API ERROR] updateClockStatus:", error);
            reject(error);
            return;
          }
          console.log("✅ [API RESPONSE] updateClockStatus:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  postResignationDetails(options) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/resign/`,
          method: 'POST',
          data: options,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  resetPassword(options) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/tenant/t1/user_changepassword/change_password_web/`,
          method: 'PUT',
          data: options,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  // resetPassword(options) {
  //   return new Promise((resolve, reject) => {
  //     APIService.fetch(
  //       `${API_URL}/tenant/t1/user_password/change_password/`,
  //       {
  //         method: 'PUT',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify(options),
  //       },
  //       (error, data) => {
  //         
  //         if (error) {
  //           reject(error);
  //           return;
  //         }
  //         resolve(data);
  //       },
  //     );
  //   });
  // },
  updateProfilePic(code, file) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/employee/getProfileURL/?emp_code=${code}&file_format=png`,
          method: 'GET',
          // data: file,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
          console.log("responce data", data);

        },
      );
    });
  },
  editUserDetails(file, id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/employee/${id}/`,
          method: 'PUT',
          data: file,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  sendImagesToS3(options) {

    return new Promise((resolve, reject) => {
      APIService.fetch(
        options.S3URL,
        {
          method: 'PUT',
          headers: {
            'Content-Type': options.type ? options.type : 'image/jpg',
          },
          body: options.file,
        },
        (error, data) => {

          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  getRecentActivityData({ id, start_date, end_date }) {
    let url = `${API_URL}/attendance/clockInOut/recents/?id=${id}`;
    if (start_date) url += `&start_date=${start_date}`;
    if (end_date) url += `&end_date=${end_date}`;

    console.log("🚀 [API CALL] getRecentActivityData URL:", url);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error("❌ [API ERROR] getRecentActivityData:", error);
            reject(error);
            return;
          }
          console.log("✅ [API RESPONSE] getRecentActivityData:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  getTotalExpense(id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/Expense/total_expense_and_expense_percentage/?employee_id=${id}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            // console.log('DEBUG [ProfileServices]: getTotalExpense Error:', error);
            reject(error);
            return;
          }
          // console.log('DEBUG [ProfileServices]: getTotalExpense response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  getTotalPendingExpense(id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/Expense/get_pending_total_amount/?employee_id=${id}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            // console.log('DEBUG [ProfileServices]: getTotalPendingExpense Error:', error);
            reject(error);
            return;
          }
          // console.log('DEBUG [ProfileServices]: getTotalPendingExpense response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  getTotalApprovedExpense(id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/Expense/get_approved_total_amount/?employee_id=${id}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            // console.log('DEBUG [ProfileServices]: getTotalApprovedExpense Error:', error);
            reject(error);
            return;
          }
          // console.log('DEBUG [ProfileServices]: getTotalApprovedExpense response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  getTotalRejectedExpense(id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/Expense/get_rejected_total_amount/?employee_id=${id}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            // console.log('DEBUG [ProfileServices]: getTotalRejectedExpense Error:', error);
            reject(error);
            return;
          }
          // console.log('DEBUG [ProfileServices]: getTotalRejectedExpense response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  getExpenseGraph(id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/Expense/get_sixmonth_expenses/?employee_id=${id}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            // console.log('DEBUG [ProfileServices]: getExpenseGraph Error:', error);
            reject(error);
            return;
          }
          // console.log('DEBUG [ProfileServices]: getExpenseGraph response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  RecentShiftDetails(id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/emp_schedule/get_today_schedule/?emp_id=${id}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          // console.log('DEBUG: ProfileServices.RecentShiftDetails Raw Response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  getShiftDetails({ id, start, end }) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/emp_schedule/get_shift_for_employee/?emp_id=${id}&start_date=${start}&end_date=${end}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getAllReports({ id, start, end, page, size }) {
    return new Promise((resolve, reject) => {
      const url = `${API_URL}/attendance/reports/first_last/?&start_date=${start}&end_date=${end}&employees=${id}&page=${page + 1}&page_size=${size}`;
      // console.log("📡 [ALL REPORTS] Request URL:", url);
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error("❌ [ALL REPORTS] Error:", error);
            reject(error);
            return;
          }
          // console.log('✅ [ALL REPORTS] Response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  getExpenseDetails(userId) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/Expense/retrieve_by_employee_id/?employee_id=${userId}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            // console.log('DEBUG [ProfileServices]: getExpenseDetails Error:', error);
            reject(error);
            return;
          }
          // console.log('DEBUG [ProfileServices]: getExpenseDetails response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  getEmployeeDetailsData(id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/employee/getBy_empCode/?emp_code=${id}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  submitExpenseData(options) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/Expense/`,
          method: 'POST',
          data: options,
        },
        (error, data) => {
          if (error) {
            // console.log('DEBUG [ProfileServices]: submitExpenseData Error:', error);
            reject(error);
            return;
          }
          // console.log('DEBUG [ProfileServices]: submitExpenseData response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  getEmployeeFullDetails(id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/employee/${id}/`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getManagers(employeeId, content) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/workflow/workflow_config/get_managers/?employee=${employeeId}&content=${content}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  putEmployeeFullDetails(id, payload) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/employee/${id}/`,
          method: 'PUT',
          data: payload,
        },

        (error, data) => {
          if (error) {
            reject(error);

            // console.log("ooo",error);

            return;
          }
          resolve(data);
        },
      );
    });
  }
  ,

  getUserDetailsData(id) {

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/tenant/t1/tenantGet/${id}/`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getRecentActivityAllData({ id, start, end }) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/clockInOut/recentByDate/?emp_id=${id}&start=${start}&end=${end}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getRecentShiftAllData({ id, start, end }) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/emp_schedule/get_schedule_by_date/?emp_id=${id}&start=${start}&end=${end}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  addManualLogRequest(payload) {
    console.log("📡 [API CALL] addManualLogRequest Payload:", JSON.stringify(payload, null, 2));
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_manualLog_request/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            console.error("❌ [API ERROR] addManualLogRequest:", error);
            reject(error);
            return;
          }
          console.log("✅ [API RESPONSE] addManualLogRequest:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  editManualLogRequest({ options, id }) {

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/manual_log/${id}/`,
          method: 'PUT',
          data: options,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  revokeManualLogRequest(ids) {
    // console.log('DEBUG: revokeManualLogRequest IDs:', ids);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_manualLog_request/revoke/`,
          method: 'POST',
          data: { manual_log_ids: ids },
        },
        (error, data) => {
          if (error) {
            console.error('DEBUG: Revoke Manual Log Error:', error);
            reject(error);
            return;
          }
          // console.log('DEBUG: Revoke Manual Log Response:', data);
          resolve(data);
        },
      );
    });
  },

  updateManualLogRequest(id, options) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_manualLog_request/${id}/`,
          method: 'PUT',
          data: options,
        },
        (error, data) => {
          if (error) {
            console.error('DEBUG: Update Manual Log Error:', error);
            reject(error);
            return;
          }
          // console.log('DEBUG: Update Manual Log Response:', data);
          resolve(data);
        },
      );
    });
  },

  deleteManualLogRequest(id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_manualLog_request/${id}/`,
          method: 'DELETE',
        },
        (error, data) => {
          if (error) {
            console.error('DEBUG: Delete Manual Log Error:', error);
            reject(error);
            return;
          }
          // console.log('DEBUG: Delete Manual Log Response:', data);
          resolve(data);
        },
      );
    });
  },

  getManualLogData({ page = 0, size = 10, id }) {
    // console.log(`DEBUG: Calling getManualLogData for emp_id: ${id}, page: ${page + 1}`);
    const url = `${API_URL}/attendance/employee_manualLog_request/list_by_employee/?page=${page + 1}&page_size=${size}&emp_id=${id}`;
    // console.log(`DEBUG: Manual Log API URL: ${url}`);

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error('DEBUG: Manual Log API Error:', error);
            reject(error);
            return;
          }
          console.log('✅ [API RESPONSE] getManualLogData:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  // addLeaveRequest(options) {
  //   return new Promise((resolve, reject) => {
  //     APIService.request(
  //       {
  //         url: `${API_URL}/attendance/leave/`,
  //         method: 'POST',
  //         data: options,
  //       },
  //       (error, data) => {
  //         if (error) {
  //           reject(error);
  //           return;
  //         }
  //         resolve(data);
  //       },
  //     );
  //   });
  // },

  editLeaveRequest({ options, id }) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_leave_request/${id}/`,
          method: 'PUT',
          data: options,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  getLeaveData(employeeId, page = 1, pageSize = 10) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/leave/list_by_employee/?emp_id=${employeeId}&page=${page}&page_size=${pageSize}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  addOvertimeRequest(options) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_overtime_request/`,
          method: 'POST',
          data: options,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  editOvertimeRequest({ options, id }) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_overtime_request/${id}/`,
          method: 'PUT',
          data: options,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  getOvertimeData({ page = 0, size = 10, id }) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_overtime_request/list_by_employee/?page=${page + 1}&page_size=${size}&emp_id=${id}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  getOvertimeRequestById(id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_overtime_request/${id}/`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  revokeOvertimeRequest(overtime_ids) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_overtime_request/revoke/`,
          method: 'POST',
          data: { overtime_ids },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  deleteOvertimeRequest(id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_overtime_request/${id}/`,
          method: 'DELETE',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  addPermissionRequest(options) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/permissions_request/`,
          method: 'POST',
          data: options,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  editPermissionRequest({ options, id }) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/permissions_request/${id}/`,
          method: 'PUT',
          data: options,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  getPermissionData({ page = 1, size = 10, id }) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/permissions_request/list_by_employee/?page=${page}&page_size=${size}&emp_id=${id}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  getPermissionRequestById(id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/permissions_request/${id}/`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  revokePermissionRequest(permissions_ids) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/permissions_request/revoke/`,
          method: 'POST',
          data: { permissions_ids },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  deletePermissionRequest(id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/permissions_request/${id}/`,
          method: 'DELETE',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  editTrainingRequest({ options, id }) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/training/${id}/`,
          method: 'PUT',
          data: options,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  getTrainingData(employeeId) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/training/list_by_employee/?emp_id=${employeeId}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  addWorkFromHomeRequest(options) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/work_from_home_request/`,
          method: 'POST',
          data: options,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  editWorkFromHomeRequest({ options, id }) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/work_from_home_request/${id}/`,
          method: 'PUT',
          data: options,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  getWorkFromHomeRequest({ page = 1, size = 10, id }) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/work_from_home_request/list_by_employee/?page=${page}&page_size=${size}&emp_id=${id}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  revokeWorkFromHomeRequest(work_from_home_ids) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/work_from_home_request/revoke/`,
          method: 'POST',
          data: { work_from_home_ids },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  deleteWorkFromHomeRequest(id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/work_from_home_request/${id}/`,
          method: 'DELETE',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  // addPermissionsRequest(options) {
  //   return new Promise((resolve, reject) => {
  //     APIService.request(
  //       {
  //         url: `${API_URL}/attendance/permissions/`,
  //         method: 'POST',
  //         data: options,
  //       },
  //       (error, data) => {
  //         if (error) {
  //           reject(error);
  //           return;
  //         }
  //         resolve(data);
  //       },
  //     );
  //   });
  // },

  // editPermissionsRequest({ options, id }) {
  //   return new Promise((resolve, reject) => {
  //     APIService.request(
  //       {
  //         url: `${API_URL}/attendance/permissions/${id}/`,
  //         method: 'PUT',
  //         data: options,
  //       },
  //       (error, data) => {
  //         if (error) {
  //           reject(error);
  //           return;
  //         }
  //         resolve(data);
  //       },
  //     );
  //   });
  // },

  // getPermissionsRequest(employeeId) {
  //   return new Promise((resolve, reject) => {
  //     APIService.request(
  //       {
  //         url: `${API_URL}/attendance/permissions/list_by_employee/?emp_id=${employeeId}`,
  //         method: 'GET',
  //       },
  //       (error, data) => {
  //         if (error) {
  //           reject(error);
  //           return;
  //         }
  //         resolve(data);
  //       },
  //     );
  //   });
  // },
  getApprovalManualLogData(employeeId) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_manualLog_request/list_for_approver/`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  getApprovalLeaveData(employeeId) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/leave/list_for_approver/`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  getApprovalOvertimeData(employeeId) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/overtime/list_for_approver/`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  getApprovalTrainingData(employeeId) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/training/list_for_approver/`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getApprovalWorkFormHomeData(employeeId) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/work_from_home_request/list_for_approver/`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getApprovalPermissionData(employeeId) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/permissions/list_for_approver/`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  getPayCodeLists(paycodeIds) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/pay_code/get_paycodes/`,
          method: 'POST',
          data: { paycode: paycodeIds },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  addTrainingRequest(payload) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/training_request/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  listTrainingRequests(empId, page = 1, pageSize = 10) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/training_request/list_by_employee/?page=${page}&page_size=${pageSize}&emp_id=${empId}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  editTrainingRequest(id, payload) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/training_request/${id}/`,
          method: 'PUT',
          data: payload,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  deleteTrainingRequest(id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/training_request/${id}/`,
          method: 'DELETE',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  revokeTrainingRequests(training_ids) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/training_request/revoke/`,
          method: 'POST',
          data: { training_ids },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  postManualLogApprove(options, approveReason) {
    // console.log('DEBUG: postManualLogApprove Request:', { manual_log_ids: [options], reason: approveReason });
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/manual_log/approve/`,
          method: 'POST',
          data: { manual_log_ids: [options], reason: approveReason },
        },
        (error, data) => {
          if (error) {
            console.error('DEBUG: postManualLogApprove Error:', error);
            reject(error);
            return;
          }
          // console.log('DEBUG: postManualLogApprove Response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  postManualLogReject(options, rejectReason) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/manual_log/reject/`,
          method: 'POST',
          data: { manual_log_ids: [options], reason: rejectReason },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  postLeaveApprove(options, reason) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/leave/approve/`,
          method: 'POST',
          data: { leave_ids: [options], reason: reason },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  postLeaveReject(options, reason) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/leave/reject/`,
          method: 'POST',
          data: { leave_ids: [options], reason: reason },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  postOvertimeApprove(options, reason) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/overtime/approve/`,
          method: 'POST',
          data: { overtime_ids: [options], reason: reason },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  postOvertimeReject(options, reason) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/overtime/reject/`,
          method: 'POST',
          data: { overtime_ids: [options], reason: reason },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  postTrainingApprove(options, reason) {
    // console.log('Inside postTrainingApprove:', options, reason);
    return new Promise((resolve, reject) => {
      const payload = { training_ids: [options], reason };
      // console.log("Sending payload to API:", payload);

      APIService.request(
        {
          url: `${API_URL}/attendance/training/approve/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            // console.log("API ERROR:", error);
            reject(error);
            return;
          }
          // console.log("API RESPONSE:", data);
          resolve(data);
        },
      );
    });
  }
  ,

  postTrainingReject(options, reason) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/training/reject/`,
          method: 'POST',
          data: { training_ids: [options], reason: reason },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  postWorkFromHomeApprove(options, reason) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/work_from_home/approve/`,
          method: 'POST',
          data: { work_from_home_ids: [options], reason: reason },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  postWorkFromhomeReject(options, reason) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/work_from_home/reject/`,
          method: 'POST',
          data: { work_from_home_ids: [options], reason: reason },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  postPermissionApprove(options, reason) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/permissions/approve/`,
          method: 'POST',
          data: { permission_ids: [options], reason: reason },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  postPermissionReject(options, reason) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/permissions/reject/`,
          method: 'POST',
          data: { permission_ids: [options], reason: reason },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getPayCodeLists(paycodeIds) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/pay_code/get_paycodes/?&paycode=${paycodeIds}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  postManualLogRevoke(id) {
    // console.log('DEBUG: postManualLogRevoke ID:', id);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/manual_log/revoke/`,
          method: 'POST',
          data: { manual_log_ids: [id] },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  postLeaveRevoke(options) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/leave/revoke/`,
          method: 'POST',
          data: { leave_ids: [options] },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  postOvertimeRevoke(options) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/overtime/revoke/`,
          method: 'POST',
          data: { overtime_ids: [options] },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  postWorkFromHomeRevoke(options) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/work_from_home/revoke/`,
          method: 'POST',
          data: { work_from_home_ids: [options] },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  postPermissionsRevoke(options) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/permissions/revoke/`,
          method: 'POST',
          data: { permission_ids: [options] },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  postTrainingRevoke(options) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/training/revoke/`,
          method: 'POST',
          data: { training_ids: [options] },
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  deleteManualRequest({ id }) {

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/manual_log/${id}/`,
          method: 'DELETE',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  deleteLeaveRequest({ id }) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/leave/${id}/`,
          method: 'DELETE',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  // deleteOvertimeRequest({ id }) {

  //   return new Promise((resolve, reject) => {
  //     APIService.request(
  //       {
  //         url: `${API_URL}/attendance/overtime/${id}/`,
  //         method: 'DELETE',
  //       },
  //       (error, data) => {
  //         if (error) {
  //           reject(error);
  //           return;
  //         }
  //         resolve(data);
  //       },
  //     );
  //   });
  // },
  deleteWorkFromRequest({ id }) {

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/work_from_home/${id}/`,
          method: 'DELETE',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  // deleteTrainingRequest({ id }) {
  //   return new Promise((resolve, reject) => {
  //     APIService.request(
  //       {
  //         url: `${API_URL}/attendance/training/${id}/`,
  //         method: 'DELETE',
  //       },
  //       (error, data) => {
  //         if (error) {
  //           reject(error);
  //           return;
  //         }
  //         resolve(data);
  //       },
  //     );
  //   });
  // },

  getLeaveBalance(employeeId) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/leave_year_balance/get_employee_balance/?emp_id=${employeeId}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getPermissionBalance(employeeId) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/permissions/get_employee_balance/?emp_id=${employeeId}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  getNotifications(page = 1, pageSize = 10) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/notify/notify/?page=${page}&page_size=${pageSize}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          // console.log('DEBUG [ProfileServices]: getNotifications response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  getUnreadNotifications(page = 1, pageSize = 10, cacheBuster = '') {
    let url = `${API_URL}/notify/notify/unread_notifications/?page=${page}&page_size=${pageSize}`;
    if (cacheBuster) {
      url += `&cb=${cacheBuster}`;
    }

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          // console.log('DEBUG [ProfileServices]: getUnreadNotifications response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  markNotifyAsRead(options) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/notify/notify/mark_as_read/`,
          method: 'POST',
          data: options,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  getLeaveTypeList() {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_leave_request/leave_list/`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  addLeaveRequest(payload) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_leave_request/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  getLeaveData(empId) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_leave_request/list_by_employee/?page=1&page_size=10&emp_id=${empId}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          console.log("✅ [API RESPONSE] getLeaveData:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  revokeLeaveRequest(payload) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_leave_request/revoke/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  deleteLeaveRequest(id) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_leave_request/${id}/`,
          method: 'DELETE',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  getManualLogApprovals(page = 1, pageSize = 10) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_manualLog_request/list_for_approver/?page=${page}&page_size=${pageSize}&search=`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error('DEBUG: getManualLogApprovals Error:', error);
            reject(error);
            return;
          }
          // console.log('DEBUG: getManualLogApprovals Response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  approveManualLog(payload) {
    // console.log("Approve Manual Log Payload:", JSON.stringify(payload, null, 2));
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_manualLog_request/approve/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          // console.log("Approve Manual Log Response:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  rejectManualLog(payload) {
    // console.log("Reject Manual Log Payload:", JSON.stringify(payload, null, 2));
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_manualLog_request/reject/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          // console.log("Reject Manual Log Response:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  getLeaveApprovals(page = 1, pageSize = 10) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_leave_request/list_for_approver/?page=${page}&page_size=${pageSize}&search=`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          // console.log("DEBUG [ProfileServices]: Leave Requests (Approver):", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  approveLeave(payload) {
    // console.log("Approve Leave Payload:", JSON.stringify(payload, null, 2));
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_leave_request/approve/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          // console.log("Approve Leave Response:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  rejectLeave(payload) {
    // console.log("Reject Leave Payload:", JSON.stringify(payload, null, 2));
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_leave_request/reject/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          // console.log("Reject Leave Response:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  getOvertimeApprovals(page = 1, pageSize = 10) {
    const url = `${API_URL}/attendance/employee_overtime_request/list_for_approver/?page=${page}&page_size=${pageSize}&search=`;
    // console.log('DEBUG: [API CALL] getOvertimeApprovals URL:', url);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error('DEBUG: Overtime Approvals Error:', error);
            reject(error);
            return;
          }
          // console.log('DEBUG: Overtime Approvals Response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  approveOvertime(payload) {
    // console.log("Approve Overtime Payload:", JSON.stringify(payload, null, 2));
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_overtime_request/approve/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          // console.log("Approve Overtime Response:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  rejectOvertime(payload) {
    // console.log("Reject Overtime Payload:", JSON.stringify(payload, null, 2));
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_overtime_request/reject/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          // console.log("Reject Overtime Response:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  updateLeaveRequest(id, payload) {
    // console.log("Edit Leave Request Payload:", JSON.stringify(payload, null, 2));
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_leave_request/${id}/`,
          method: 'PUT',
          data: payload,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  // --- Permission Approvals ---
  getPermissionApprovals(page = 1, pageSize = 10) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/permissions_request/list_for_approver/?page=${page}&page_size=${pageSize}&search=`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  approvePermission(payload) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/permissions_request/approve/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  rejectPermission(payload) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/permissions_request/reject/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  // --- WFH Approvals ---
  getWFHApprovals(page = 1, pageSize = 10) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/work_from_home_request/list_for_approver/?page=${page}&page_size=${pageSize}&search=`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  approveWFH(payload) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/work_from_home_request/approve/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  rejectWFH(payload) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/work_from_home_request/reject/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  // --- Training Approvals ---
  getTrainingApprovals(page = 1, pageSize = 10) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/training_request/list_for_approver/?page=${page}&page_size=${pageSize}&search=`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error('DEBUG: getTrainingApprovals Error:', error);
            reject(error);
            return;
          }
          // console.log('DEBUG: getTrainingApprovals Response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  approveTraining(payload) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/training_request/approve/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            console.error('DEBUG: approveTraining Error:', error);
            reject(error);
            return;
          }
          // console.log('DEBUG: approveTraining Response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  rejectTraining(payload) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/training_request/reject/`,
          method: 'POST',
          data: payload,
        },
        (error, data) => {
          if (error) {
            console.error('DEBUG: rejectTraining Error:', error);
            reject(error);
            return;
          }
          // console.log('DEBUG: rejectTraining Response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  getAssignedTasks(params = {}) {
    const { page = 1, page_size = 10, search = '', type = 'All' } = params;
    const url = `${API_URL}/workflow/tasks/assigned/?page=${page}&page_size=${page_size}&search=${search}&type=${type}`;
    console.log('DEBUG [ProfileServices]: Calling getAssignedTasks with URL:', url);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error('DEBUG [ProfileServices]: getAssignedTasks Error:', error);
            reject(error);
            return;
          }
          console.log('DEBUG [ProfileServices]: getAssignedTasks Success. Full Response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  async updateTaskStatus(id, status = 'COMPLETED') {
    const org_code = await AuthService.getOrgCode();
    const url = `${API_URL}/workflow/tasks/${id}/status-update/`;
    const payload = { status, org_code };

    console.log('--------------------------------------------------');
    console.log('🏁 [API CALL] updateTaskStatus (FINAL PARENT COMPLETION)');
    console.log('URL:', url);
    console.log('PAYLOAD:', JSON.stringify(payload, null, 2));
    console.log('--------------------------------------------------');

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'PUT',
          data: payload
        },
        (error, data) => {
          if (error) {
            console.error('❌ [API ERROR] updateTaskStatus:', error);
            reject(error);
            return;
          }
          console.log('✅ [API RESPONSE] updateTaskStatus:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  // updateAssetTaskStatus is now deprecated. Use updateTaskStatus for parent tasks 
  // and updateAssetStatusData for individual assets.
  getTaskAssets(taskId) {
    const url = `${API_URL}/workflow/task-assets/by-parent-task/?task_id=${taskId}`;
    console.log('DEBUG [ProfileServices]: Calling getTaskAssets with URL:', url);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error('DEBUG [ProfileServices]: getTaskAssets Error:', error);
            reject(error);
            return;
          }
          console.log('DEBUG [ProfileServices]: getTaskAssets Success. Response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  getAllApprovals(page = 1, pageSize = 10) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/employee_manualLog_request/list_all_approvals/?page=${page}&page_size=${pageSize}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getCheckInData(empId, date) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    console.log("--------------------------------------------------");
    console.log("⏰ CHECK-IN DEBUG REQUEST");
    console.log("--------------------------------------------------");
    console.log("🎯 API Endpoint:", `${API_URL}/attendance/clockInOut/get_checkin_data/`);
    console.log("👤 Employee ID:", empId);
    console.log("📅 Target Date:", date);
    console.log("⏰ Current App Time:", currentTime);
    console.log("--------------------------------------------------\n");
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/attendance/clockInOut/get_checkin_data/?emp_id=${empId}&date=${date}&time=${currentTime}`,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          console.log("\n---------- [API DEBUG: getCheckInData] ----------");
          console.log("URL:", `${API_URL}/attendance/clockInOut/get_checkin_data/?emp_id=${empId}&date=${date}&time=${currentTime}`);
          console.log("RESPONSE:", JSON.stringify(data, null, 2));
          console.log("--------------------------------------------------\n");
          resolve(data);
        },
      );
    });
  },
  getTaskRetrieve(taskId) {
    const url = `${API_URL}/workflow/tasks/${taskId}/assigned-retrieve/`;
    console.log('DEBUG [ProfileServices]: Calling getTaskRetrieve with URL:', url);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error('DEBUG [ProfileServices]: getTaskRetrieve Error:', error);
            reject(error);
            return;
          }
          console.log('DEBUG [ProfileServices]: getTaskRetrieve Success. Response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  getFlightTicketInfo(taskId) {
    const url = `${API_URL}/workflow/flight_ticket/get_travel_info/?task=${taskId}`;
    console.log('DEBUG [ProfileServices]: Calling getFlightTicketInfo with URL:', url);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error('DEBUG [ProfileServices]: getFlightTicketInfo Error:', error);
            reject(error);
            return;
          }
          console.log('DEBUG [ProfileServices]: getFlightTicketInfo Success. Response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  getLoanDeductionDetails(taskId) {
    const url = `${API_URL}/workflow/tasks/${taskId}/loan-deduction-details/`;
    console.log('DEBUG [ProfileServices]: Calling getLoanDeductionDetails with URL:', url);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error('DEBUG [ProfileServices]: getLoanDeductionDetails Error:', error);
            reject(error);
            return;
          }
          console.log('DEBUG [ProfileServices]: getLoanDeductionDetails Success. Response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  getFinalSettlementDetails(taskId) {
    const url = `${API_URL}/workflow/tasks/${taskId}/final-settlement-details/`;
    console.log('DEBUG [ProfileServices]: Calling getFinalSettlementDetails with URL:', url);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error('DEBUG [ProfileServices]: getFinalSettlementDetails Error:', error);
            reject(error);
            return;
          }
          console.log('DEBUG [ProfileServices]: getFinalSettlementDetails Success. Response:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  updateAssetCondition(assetId, condition) {
    const url = `${API_URL}/workflow/task-assets/${assetId}/status-update/`;
    const payload = { condition: condition.toUpperCase() };

    console.log('--------------------------------------------------');
    console.log('📡 [API CALL] updateAssetCondition');
    console.log('URL:', url);
    console.log('PAYLOAD:', JSON.stringify(payload, null, 2));
    console.log('--------------------------------------------------');

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'PUT',
          data: payload
        },
        (error, data) => {
          if (error) {
            console.error('❌ [API ERROR] updateAssetCondition:', error);
            reject(error);
            return;
          }
          console.log('✅ [API RESPONSE] updateAssetCondition:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  updateAssetStatusData(assetId, payloadData) {
    const url = `${API_URL}/workflow/task-assets/${assetId}/status-update/`;
    const payload = typeof payloadData === 'string' ? { status: payloadData.toUpperCase() } : payloadData;

    console.log('--------------------------------------------------');
    console.log('📡 [API CALL] updateAssetStatusData');
    console.log('URL:', url);
    console.log('PAYLOAD:', JSON.stringify(payload, null, 2));
    console.log('--------------------------------------------------');

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'PUT',
          data: payload
        },
        (error, data) => {
          if (error) {
            console.error('❌ [API ERROR] updateAssetStatusData:', error);
            reject(error);
            return;
          }
          console.log('✅ [API RESPONSE] updateAssetStatusData:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  updateTaskStatusWithComments(taskId, commentsArray) {
    const url = `${API_URL}/workflow/tasks/${taskId}/status-update/`;
    const payload = { comments: commentsArray };

    console.log('--------------------------------------------------');
    console.log('📡 [API CALL] updateTaskStatusWithComments');
    console.log('URL:', url);
    console.log('PAYLOAD:', JSON.stringify(payload, null, 2));
    console.log('--------------------------------------------------');

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'PUT',
          data: payload
        },
        (error, data) => {
          if (error) {
            console.error('❌ [API ERROR] updateTaskStatusWithComments:', error);
            reject(error);
            return;
          }
          console.log('✅ [API RESPONSE] updateTaskStatusWithComments:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  uploadTaskAttachment(taskId, attachmentsArray) {
    const url = `${API_URL}/workflow/tasks/${taskId}/upload-attachment/`;
    const payload = { attachments: attachmentsArray };

    console.log('--------------------------------------------------');
    console.log('📡 [API CALL] uploadTaskAttachment');
    console.log('URL:', url);
    console.log('PAYLOAD:', JSON.stringify({ attachments: attachmentsArray.map(a => ({ filename: a.filename, image_binary: "..." })) }, null, 2));
    console.log('--------------------------------------------------');

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'POST',
          data: payload
        },
        (error, data) => {
          if (error) {
            console.error('❌ [API ERROR] uploadTaskAttachment:', error);
            reject(error);
            return;
          }
          console.log('✅ [API RESPONSE] uploadTaskAttachment:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  getAttendanceSummary(payload) {
    // console.log("📡 [API CALL] getAttendanceSummary Payload:", JSON.stringify(payload, null, 2));

    const { emp_code, start_date, end_date } = payload || {};
    if (!start_date || !end_date) {
      console.warn("⚠️ Attendance API: Missing dates in payload!", payload);
    }
    const url = `${API_URL}/v1/employee/employee_attendance/?emp_code=${emp_code || ''}&start_date=${start_date || ''}&end_date=${end_date || ''}`;

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error("❌ [API ERROR] getAttendanceSummary:", error);
            reject(error);
            return;
          }
          // console.log("✅ [API RESPONSE] getAttendanceSummary:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  getEmployeeShiftDetails(payload) {
    const { emp_id, start_date, end_date } = payload || {};
    if (!start_date || !end_date) {
      console.warn("⚠️ Shift Details API: Missing dates in payload!", payload);
    }
    const url = `${API_URL}/attendance/emp_schedule/get_shift_for_employee/?emp_id=${emp_id || ''}&start_date=${start_date || ''}&end_date=${end_date || ''}`;
    console.log("📡 [API CALL] getEmployeeShiftDetails Payload:", JSON.stringify(payload, null, 2));
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error("❌ [API ERROR] getEmployeeShiftDetails:", error);
            reject(error);
            return;
          }
          console.log("✅ [API RESPONSE] getEmployeeShiftDetails:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },


  submitRegularization(payload) {
    const url = `${API_URL}/attendance/employee_manualLog_request/regularization/`;
    console.log("🚀 [API CALL] submitRegularization (POST) Payload:", JSON.stringify(payload, null, 2));
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'POST',
          data: payload
        },
        (error, data) => {
          if (error) {
            console.error("❌ [API ERROR] submitRegularization:", error);
            reject(error);
            return;
          }
          console.log("✅ [API RESPONSE] submitRegularization:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  getAllRegularizationRequests({ emp_id, page = 1, page_size = 10 }) {
    const url = `${API_URL}/attendance/employee_manualLog_request/list_by_employee/?page=${page}&page_size=${page_size}&emp_id=${emp_id}`;
    // console.log("🚀 Calling API: getAllRegularizationRequests (list_by_employee) with URL:", url);

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error("❌ Error in getAllRegularizationRequests:", error);
            reject(error);
            return;
          }
          // console.log("✅ Response from getAllRegularizationRequests:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  getAllTypesRequests(payload) {
    const employee = payload.employee || payload.emp_id || '';
    const start_date = payload.start_date || '';
    const end_date = payload.end_date || '';
    const page = payload.page || 1;
    const page_size = payload.page_size || 10;
    // console.log('DEBUG: getAllTypesRequests Payload:', payload);
    // console.log("mydatas", start_date, end_date);

    const url = `${API_URL}/attendance/employee_manualLog_request/all_requests/?employee=${employee}&start_date=${start_date}&end_date=${end_date}&page=${page}&page_size=${page_size}`;
    console.log("📡 [API CALL] getAllTypesRequests URL:", url);

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error("❌ [API ERROR] getAllTypesRequests:", error);
            reject(error);
            return;
          }
          console.log("✅ [API RESPONSE] getAllTypesRequests:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  getRecentActivityAllData({ emp_id, start, end }) {
    const url = `${API_URL}/attendance/clockInOut/recentByDate/?emp_id=${emp_id}&start=${start}&end=${end}`;
    // console.log("🚀 Calling API: getRecentActivityAllData (recentByDate) with URL:", url);

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error("❌ [API ERROR] getRecentActivityAllData:", error);
            reject(error);
            return;
          }
          console.log("✅ [API RESPONSE] getRecentActivityAllData:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },

  getEmployeeAttendanceStatus(payload) {
    const emp_code = payload.emp_code || payload.employee || '';
    const start_date = payload.start_date || '';
    const end_date = payload.end_date || '';

    const url = `${API_URL}/attendance/employee_manualLog_request/get_employee_attendance_status/?emp_code=${emp_code}&start_date=${start_date}&end_date=${end_date}`;
    // console.log('📡 [FINAL-FIX] getEmployeeAttendanceStatus URL:', url);

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error('❌ [API ERROR] getEmployeeAttendanceStatus:', error);
            reject(error);
            return;
          }
          // console.log('✅ [API RESPONSE] getEmployeeAttendanceStatus:', data);
          resolve(data);
        },
      );
    });
  },

  getRequestApprovers(id, module) {
    const url = `${API_URL}/workflow/workflow_config/get_request_approvers/?id=${id}&module=${module}`;
    // console.log("📡 [API CALL] getRequestApprovers URL:", url);

    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: url,
          method: 'GET',
        },
        (error, data) => {
          if (error) {
            console.error("❌ [API ERROR] getRequestApprovers:", error);
            reject(error);
            return;
          }
          // console.log("✅ [API RESPONSE] getRequestApprovers:", JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
};

export default ProfileServices;
