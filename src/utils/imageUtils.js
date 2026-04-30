import { API_URL } from './config';

/**
 * Normalizes a profile image URL.
 * Handles both absolute URLs and relative paths from the backend.
 * 
 * @param {string} url - The profile URL from the API
 * @returns {string|null} - The absolute URL or null if invalid
 */
export const getAbsoluteProfileUrl = (url, cacheBuster = null) => {
  if (!url || url === 'null' || url.trim() === '') {
    return null;
  }

  let finalUrl = url;
  // If it's a relative path, prepend the API_URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const path = url.startsWith('/') ? url : `/${url}`;
    finalUrl = `${baseUrl}${path}`;
  }

  // Removed URL-based cache buster because it causes 403/404 on strict backends 
  // or URL encoding issues in Fresco (Android).
  console.log('DEBUG [imageUtils] generated absolute URL:', finalUrl);
  return finalUrl;
};
