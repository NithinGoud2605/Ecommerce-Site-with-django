import axios from 'axios';
import { getCsrfToken } from './utils/csrfToken'; // Ensure this path is correct

// Create an Axios instance with a base URL (modify if necessary)
const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Your Django backend URL
});

// Interceptor to add JWT token and CSRF token to request headers
axiosInstance.interceptors.request.use(config => {
  // Add JWT token to Authorization header
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (userInfo && userInfo.token) {
    config.headers['Authorization'] = `Bearer ${userInfo.token}`;
  }

  // Add CSRF token for requests that require it (e.g., POST, PUT, DELETE)
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }

  return config;
}, error => {
  return Promise.reject(error);
});

export default axiosInstance;
