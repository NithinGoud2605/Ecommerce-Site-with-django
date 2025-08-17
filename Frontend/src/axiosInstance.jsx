import axios from 'axios';
import { getCsrfToken } from './utils/csrfToken';

// Prefer env override; otherwise use current origin to avoid CORS in dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    let userInfo = null;
    try { userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null'); } catch {}

    // Only attach Authorization for our JWT-based backend tokens, not Supabase sessions
    if (userInfo && userInfo.token && userInfo.provider !== 'supabase') {
      config.headers['Authorization'] = `Bearer ${userInfo.token}`;
    }

    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error('Detailed Error Response:', error?.response);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
