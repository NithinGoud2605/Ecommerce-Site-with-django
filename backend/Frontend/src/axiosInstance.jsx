// axiosInstance.js
import axios from 'axios';
import { getCsrfToken } from './utils/csrfToken'; // Adjust the path if needed

// Create an Axios instance with a base URL (modify if necessary)
const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Your Django backend URL
});

// Interceptor to add CSRF token to request headers
axiosInstance.interceptors.request.use(config => {
  const csrfToken = getCsrfToken(); // Get the CSRF token using the utility function
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken; // Add the CSRF token to the headers
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default axiosInstance;
