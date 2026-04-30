import APIService, { getUrlForHeaders } from '../APIService';
import { API_URL } from '../../src/utils/config';
const AuthServices = {
  sendSignUp(options) {
    return new Promise(async (resolve, reject) => {
      const domainName = await getUrlForHeaders()
      APIService.fetch(
        `${API_URL}/api/v1/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            hostname: domainName,
          },
          body: JSON.stringify(options),
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

  sendSignIn(options) {
    return new Promise(async (resolve, reject) => {
      const domainName = await getUrlForHeaders()
      // console.log('--- SIGN IN REQUEST ---');
      // console.log('URL:', `${API_URL}/login/`);
      // console.log('Hostname Header:', domainName);
      // console.log('Payload:', JSON.stringify(options, null, 2));

      return APIService.fetch(
        `${API_URL}/login/`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'hostname': domainName,
          },
          body: JSON.stringify(options),
        },
        (error, data) => {
          // console.log('--- SIGN IN RESPONSE ---');
          if (error) {
            // console.log('Error Log:', JSON.stringify(error, null, 2));
            // console.log('Data Log (body):', JSON.stringify(data, null, 2));
            // Ensure we reject with an object that contains both the error details and the body
            reject({ ...error, ...data });
            return;
          }
          // console.log('Success Log:', JSON.stringify(data, null, 2));
          resolve(data);
        },
      );
    });
  },
  sendOtp(options) {
    return new Promise((resolve, reject) => {
      APIService.fetch(
        `${API_URL}/tenant/t1/user_password/reset_password/`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
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
      APIService.fetch(
        `${API_URL}/tenant/t1/user_password/change_password/`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
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
  sendForgotOtp({ email }) {
    return new Promise((resolve, reject) => {
      APIService.fetch(
        `${API_URL}/tenant/t1/user_password/forgot_password/?email=${email}`,
        {
          method: 'PUT',
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
};

export default AuthServices;
