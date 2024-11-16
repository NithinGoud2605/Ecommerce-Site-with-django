import axios from 'axios';
import { getCsrfToken } from './utils/csrfToken';

const axiosInstance = axios.create({
  baseURL: 'https://handmadehub.onrender.com/',  // Production URL
});

axiosInstance.interceptors.request.use(config => {
  const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;

  // Only add Authorization and CSRF headers if the endpoint requires authentication
  if (!config.url.includes('/api/users/register/') && !config.url.includes('/api/token/')) {
    if (userInfo && userInfo.token) {
      config.headers['Authorization'] = `Bearer ${userInfo.token}`;
    }

    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }

  return config;
}, error => {
  return Promise.reject(error);
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Detailed Error Response:', error.response);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
