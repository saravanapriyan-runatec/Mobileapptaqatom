import get from 'lodash/get';
import ObjectStorage from './ObjectStorageService';
import { jwtDecode } from '../src/utils/auth/jwt/utils';
export const DOMAIN_KEY = 'domain_name'
export default {
  async setAuthToken(authToken) {
    return await ObjectStorage.setItem('auth_token', { access_token: authToken });
  },
  async setSessionToken(sessionToken) {
    return await ObjectStorage.setItem('session', { session_token: sessionToken });
  },
  async setDomainName(name) {
    return await ObjectStorage.setItem(DOMAIN_KEY, { domain: name });
  },
  async setAuth(auth) {
    return await ObjectStorage.setItem('auth', auth);
  },
  async isLoggedIn() {
    const data = await ObjectStorage.getItem('auth', {});
    // Check both potential keys for the access token
    return !!(data.access_token || data.access);
  },
  async getToken() {
    const data = await ObjectStorage.getItem('auth_token', {});
    return get(data, 'access_token');
  },
  async getSessionToken() {
    const data = await ObjectStorage.getItem('session', {});
    return get(data, 'session_token');
  },
  async getDomainName() {
    const data = await ObjectStorage.getItem(DOMAIN_KEY, {});
    return get(data, 'domain');
  },
  async getOrgCode() {
    return await this.getDomainName();
  },
  async getMetamaskSession() {
    const data = await ObjectStorage.getItem(
      '@walletconnect/qrcode-modal-react-native:session',
      {},
    );
    return data;
  },
  async getUser() {
    const data = await ObjectStorage.getItem('auth', {});
    return data;
  },
  async getUserName() {
    const data = await ObjectStorage.getItem('auth', {});
    // console.log('DEBUG: AuthService Raw Auth Data:', JSON.stringify(data, null, 2));
    return get(data, 'name');
  },
  async getUserUsername() {
    const data = await ObjectStorage.getItem('auth', {});
    return get(data, 'username');
  },
  async getUserId() {
    const data = await ObjectStorage.getItem('auth', {});

    // 1. Try common keys in stored data
    const storedId = data.user_id || data.id || data.emp_id || data.employee_id || data.user?.id;
    if (storedId) return storedId;

    // 2. Fallback: Extract from JWT access token
    let token = data.access || data.access_token;

    // 3. Deeper Fallback: Check auth_token storage
    if (!token) {
      const authData = await ObjectStorage.getItem('auth_token', {});
      token = authData.access_token;
    }

    if (token) {
      try {
        const decoded = jwtDecode(token);
        // console.log('DEBUG: AuthService Decoded Token:', decoded);
        return decoded.user_id || decoded.id || decoded.sub;
      } catch (err) {
        console.error('Error decoding token in getUserId:', err);
      }
    }

    return undefined;
  },

  async getUserImage() {
    const data = await ObjectStorage.getItem('auth', {});
    return get(data, 'picture');
  },
  async logout() {
    await ObjectStorage.setItem('auth_token', {});
    await ObjectStorage.setItem('auth', {});
    await ObjectStorage.setItem('session', {});
  },
  async setLoggedInAccounts(email) {
    const data = await ObjectStorage.getItem('logged_in_accounts');
    let accounts = [];
    if (Array.isArray(data)) {
      if (data.includes(email)) {
        return;
      }
      accounts = [...data, email];
    } else {
      accounts.push(email);
    }
    return await ObjectStorage.setItem('logged_in_accounts', accounts);
  },
  async getLoggedInAccounts() {
    const data = await ObjectStorage.getItem('logged_in_accounts');
    return data;
  },
};
