import axios from 'axios';
import AuthService from './auth';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Add auth token to requests
API.interceptors.request.use(
  (config) => {
    const token = AuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AuthService.logout();
    }
    return Promise.reject(error);
  }
);

export default API;