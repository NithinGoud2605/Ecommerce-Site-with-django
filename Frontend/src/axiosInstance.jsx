import axios from 'axios';
import { getCsrfToken } from './utils/csrfToken'; // Ensure this path is correct

// Create an Axios instance with a dynamic base URL
const axiosInstance = axios.create({
  baseURL:
    process.env.NODE_ENV === 'production'
      ? 'https://handmadehub-4c471829f515.herokuapp.com'
      : 'http://127.0.0.1:8000',
});

// Interceptor to add JWT token and CSRF token to request headers
axiosInstance.interceptors.request.use(
  (config) => {
    // Add JWT token to Authorization header if available
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.token) {
      config.headers['Authorization'] = `Bearer ${userInfo.token}`;
    }

    // Add CSRF token for specific request methods
    if (['post', 'put', 'delete'].includes(config.method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
