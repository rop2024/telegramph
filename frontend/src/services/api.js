import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/updatedetails', data),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
};

// Receivers API
export const receiversAPI = {
  getAll: (params) => api.get('/receivers', { params }),
  getById: (id) => api.get(`/receivers/${id}`),
  create: (data) => api.post('/receivers', data),
  update: (id, data) => api.put(`/receivers/${id}`, data),
  delete: (id) => api.delete(`/receivers/${id}`),
  bulkCreate: (data) => api.post('/receivers/bulk/create', data),
  bulkDelete: (data) => api.delete('/receivers/bulk/delete', { data }),
  getStats: () => api.get('/receivers/stats/summary'),
};

// Drafts API
export const draftsAPI = {
  getAll: (params) => api.get('/drafts', { params }),
  getById: (id) => api.get(`/drafts/${id}`),
  create: (data) => api.post('/drafts', data),
  update: (id, data) => api.put(`/drafts/${id}`, data),
  delete: (id) => api.delete(`/drafts/${id}`),
  duplicate: (id) => api.post(`/drafts/${id}/duplicate`),
  bulkDelete: (data) => api.delete('/drafts/bulk/delete', { data }),
  updateStatus: (id, status) => api.patch(`/drafts/${id}/status`, { status }),
  getStats: () => api.get('/drafts/stats/summary'),
  addReceiver: (id, receiverId) => api.post(`/drafts/${id}/receivers`, { receiverId }),
  removeReceiver: (id, receiverId) => api.delete(`/drafts/${id}/receivers/${receiverId}`),
};

// Mail API
export const mailAPI = {
  sendTest: (data) => api.post('/mail/send-test', data),
  send: (data) => api.post('/mail/send', data),
  sendBulk: (data) => api.post('/mail/send-bulk', data),
  getLogs: (params) => api.get('/mail/logs', { params }),
  getAnalytics: (params) => api.get('/mail/analytics', { params }),
  getStatus: () => api.get('/mail/status'),
  retry: (id) => api.post(`/mail/retry/${id}`),
};

export default api;