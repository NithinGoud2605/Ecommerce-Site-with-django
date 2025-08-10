import axios from 'axios';
import { getCsrfToken } from './utils/csrfToken';

// Prefer env override, fallback to existing production URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://handmadehub.onrender.com';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (userInfo && userInfo.token) {
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
