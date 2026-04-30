// utils/api.js
import { Platform } from 'react-native';
import AuthService from '../../Services/AuthService';
import packageJSON from '../../package.json';

// API Configuration
const API_CONFIG = {
  BASE_URL: 'https://api-dev-mvp.hr-ms.com',
};

// Get URL for headers
export const getUrlForHeaders = async () => {
  try {
    const urlArray = API_CONFIG.BASE_URL?.split('//');
    const domain = await AuthService.getDomainName();
    let baseHost = urlArray?.[1] || '';
    if (baseHost.endsWith('/')) {
      baseHost = baseHost.slice(0, -1);
    }
    return `${domain}.${baseHost}`;
  } catch (err) {
    console.error('Error getting URL for headers:', err);
    return '';
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  ANNOUNCEMENTS: '/announcement/announcement/',
  // Add more endpoints here as needed
  // USERS: '/users/',
  // REPORTS: '/reports/',
};

// Get common headers with authentication
export const getHeaders = async (customHeaders = {}) => {
  try {
    const token = await AuthService.getToken();
    const sessionToken = await AuthService.getSessionToken();
    const hostname = await getUrlForHeaders();

    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'x-platform-os': Platform.OS,
      'x-platform-version': Platform.Version,
      'x-app-version': packageJSON.version,
      Authorization: `Bearer ${token}`,
      Referer: 'oneworldgames-hybrid',
      hostname: hostname,
      SessionToken: sessionToken,
      ...customHeaders,
    };
  } catch (err) {
    console.error('Error getting headers:', err);
    throw err;
  }
};

// Build full URL with query parameters
export const buildUrl = (endpoint, params = {}) => {
  const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);

  // Add query parameters
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  return url.toString();
};

// Generic API request function with timeout
const DEFAULT_TIMEOUT = 40000;

const fetchWithTimeout = (url, options, timeout = DEFAULT_TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject({
            code: 900,
            detail: 'Connection Timeout, Please check your Internet',
          }),
        timeout,
      ),
    ),
  ]);
};

// Generic API request function
export const apiRequest = async (endpoint, options = {}) => {
  const { params = {}, customHeaders = {}, ...fetchOptions } = options;

  try {
    const url = buildUrl(endpoint, params);
    const headers = await getHeaders(customHeaders);

    const response = await fetchWithTimeout(url, {
      ...fetchOptions,
      headers,
    });

    // Check response status
    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        // You can trigger logout here if needed
        // triggerGlobalLogout();
        throw new Error('Session expired. Please log in again.');
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.indexOf('application/json') !== -1) {
      if (response.status === 204) {
        return {};
      }
      return await response.json();
    }

    return await response.text();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Announcements API functions
export const announcementsAPI = {
  // Fetch announcements with pagination
  getAll: async (page = 1, pageSize = 10) => {
    const data = await apiRequest(API_ENDPOINTS.ANNOUNCEMENTS, {
      method: 'GET',
      params: { page, page_size: pageSize },
    });
    console.log('DEBUG: announcementsAPI.getAll Response:', JSON.stringify(data, null, 2));
    return data;
  },

  // Get single announcement by ID
  getById: async (id) => {
    return await apiRequest(`${API_ENDPOINTS.ANNOUNCEMENTS}${id}/`, {
      method: 'GET',
    });
  },

  // Create new announcement
  create: async (data) => {
    return await apiRequest(API_ENDPOINTS.ANNOUNCEMENTS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update announcement
  update: async (id, data) => {
    return await apiRequest(`${API_ENDPOINTS.ANNOUNCEMENTS}${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete announcement
  delete: async (id) => {
    return await apiRequest(`${API_ENDPOINTS.ANNOUNCEMENTS}${id}/`, {
      method: 'DELETE',
    });
  },
};

// Export configuration for external use if needed
export const getApiConfig = () => ({
  baseUrl: API_CONFIG.BASE_URL,
});

export default {
  apiRequest,
  announcementsAPI,
  buildUrl,
  getHeaders,
  getUrlForHeaders,
  API_ENDPOINTS,
  getApiConfig,
};