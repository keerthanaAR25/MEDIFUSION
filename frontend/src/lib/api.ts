import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 300000,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('token');
      Cookies.remove('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const patientsAPI = {
  getAll: () => api.get('/patients'),
  getById: (id: string) => api.get(`/patients/${id}`),
  create: (data: any) => api.post('/patients', data),
  update: (id: string, data: any) => api.put(`/patients/${id}`, data),
};

export const processingAPI = {
  analyze: (formData: FormData) =>
    api.post('/analysis/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
    }),
  getAnalysis: (caseId: string) => api.get(`/analysis/${caseId}`),
};

export const summaryAPI = {
  generate: (caseId: string) => api.post(`/summary/generate/${caseId}`),
  approve: (caseId: string, section: string) =>
    api.post(`/summary/approve/${caseId}/${section}`),
  update: (caseId: string, section: string, content: string) =>
    api.put(`/summary/${caseId}/${section}`, { content }),
  getTranslation: (caseId: string, language: string) =>
    api.get(`/summary/translate/${caseId}/${language}`),
};

export const reportsAPI = {
  getStats: () => api.get('/reports/stats'),
  getLogs: () => api.get('/reports/logs'),
  exportPdf: (caseId: string) =>
    api.get(`/reports/export/${caseId}`, { responseType: 'blob' }),
};

export default api;