import axios from 'axios';
import { getCsrfToken } from './utils/csrfToken';

const axiosInstance = axios.create({
  baseURL: 'https://handmadehub-4c471829f515.herokuapp.com',  // Update to your production URL
});

axiosInstance.interceptors.request.use(config => {
  // Add JWT token to Authorization header only if userInfo is available
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (userInfo && userInfo.token) {
    config.headers['Authorization'] = `Bearer ${userInfo.token}`;
  }

  // Add CSRF token if it exists
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }

  return config;
}, error => {
  return Promise.reject(error);
});

export default axiosInstance;
