import APIService from '../APIService';
import { API_URL } from '../../src/utils/config';


const LoanServices = {

  getUserDetails() {
    console.log('DEBUG: LoanServices.getUserDetails called');
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/api/v1/booking/user/information`,
          method: 'GET',
        },
        (error, data) => {
          console.log('DEBUG [LoanServices]: getUserDetails response:', JSON.stringify(data, null, 2));
          if (error) {
            console.error('DEBUG [LoanServices]: getUserDetails error:', error);
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },

  postLoanDetails(options) {
    console.log('DEBUG: LoanServices.postLoanDetails called with:', JSON.stringify(options, null, 2));
    return new Promise((resolve, reject) => {

      APIService.request(
        {
          url: `${API_URL}/v1/employeeloan/`,
          method: 'POST',
          data: options,
        },
        (error, data) => {
          console.log('DEBUG [LoanServices]: postLoanDetails response:', JSON.stringify(data, null, 2));
          if (error) {
            console.error('DEBUG [LoanServices]: postLoanDetails error:', error);
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getOutstandinBalance(userId) {
    console.log('DEBUG: LoanServices.getOutstandinBalance called for userId:', userId);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/employeenewloanrequest/calculate_outstanding_amount_empId/?employee_id=${userId}`,
          method: 'GET',
        },
        (error, data) => {
          console.log('DEBUG [LoanServices]: getOutstandinBalance response:', JSON.stringify(data, null, 2));
          if (error) {
            console.error('DEBUG [LoanServices]: getOutstandinBalance error:', error);
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getTotalEmiBalance(userId) {
    console.log('DEBUG: LoanServices.getTotalEmiBalance called for userId:', userId);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/employeenewloanrequest/calculate_emi_amount_empId/?employee_id=${userId}`,
          method: 'GET',
        },
        (error, data) => {
          console.log('DEBUG [LoanServices]: getTotalEmiBalance response:', JSON.stringify(data, null, 2));
          if (error) {
            console.error('DEBUG [LoanServices]: getTotalEmiBalance error:', error);
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getTotalEmiPaid(userId) {
    console.log('DEBUG: LoanServices.getTotalEmiPaid called for userId:', userId);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/employeenewloanrequest/total_emi_paid_by_empid/?employee_id=${userId}`,
          method: 'GET',
        },
        (error, data) => {
          console.log('DEBUG [LoanServices]: getTotalEmiPaid response:', JSON.stringify(data, null, 2));
          if (error) {
            console.error('DEBUG [LoanServices]: getTotalEmiPaid error:', error);
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getTotalLoanAmount(userId) {
    console.log('DEBUG: LoanServices.getTotalLoanAmount called for userId:', userId);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/employeenewloanrequest/total_loan_amount_by_empid/?employee_id=${userId}`,
          method: 'GET',
        },
        (error, data) => {
          console.log('DEBUG [LoanServices]: getTotalLoanAmount response:', JSON.stringify(data, null, 2));
          if (error) {
            console.error('DEBUG [LoanServices]: getTotalLoanAmount error:', error);
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getRunningLoan(userId) {
    console.log('DEBUG: LoanServices.getRunningLoan called for userId:', userId);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/employeenewloanrequest/get_runningloan_requests_empId/?employee_id=${userId}`,
          method: 'GET',
        },
        (error, data) => {
          console.log('DEBUG [LoanServices]: getRunningLoan response:', JSON.stringify(data, null, 2));
          if (error) {
            console.error('DEBUG [LoanServices]: getRunningLoan error:', error);
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getAllLoan(id) {
    console.log('DEBUG: LoanServices.getAllLoan called for id:', id);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/employeeloan/?employee_id=${id}&page=1&page_size=10&search=`,
          method: 'GET',
        },
        (error, data) => {
          console.log('DEBUG [LoanServices]: getAllLoan response:', JSON.stringify(data, null, 2));
          if (error) {
            console.error('DEBUG [LoanServices]: getAllLoan error:', error);
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getRequestedLoan(id) {
    console.log('DEBUG: LoanServices.getRequestedLoan called for id:', id);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/employeeloan/retrieve_by_employee_id/?employee_id=${id}`,
          method: 'GET',
        },
        (error, data) => {
          console.log('DEBUG [LoanServices]: getRequestedLoan response:', JSON.stringify(data, null, 2));
          if (error) {
            console.error('DEBUG [LoanServices]: getRequestedLoan error:', error);
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getClearedLoan(userId) {
    console.log('DEBUG: LoanServices.getClearedLoan called for userId:', userId);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/employeenewloanrequest/get_clearedloan_requests_empId/?employee_id=${userId}`,
          method: 'GET',
        },
        (error, data) => {
          console.log('DEBUG [LoanServices]: getClearedLoan response:', JSON.stringify(data, null, 2));
          if (error) {
            console.error('DEBUG [LoanServices]: getClearedLoan error:', error);
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },
  getDeductionLoan(id) {
    console.log('DEBUG: LoanServices.getDeductionLoan called for id:', id);
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/employeenewloanrequest/upcoming_deduction/?id=${id}`,
          method: 'GET',
        },
        (error, data) => {
          console.log('DEBUG [LoanServices]: getDeductionLoan response:', JSON.stringify(data, null, 2));
          if (error) {
            console.error('DEBUG [LoanServices]: getDeductionLoan error:', error);
            reject(error);
            return;
          }
          resolve(data);
        },
      );
    });
  },


};

export default LoanServices;
