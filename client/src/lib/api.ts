import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export const auth = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const goals = {
  create: (data: { goals: any[] }) => api.post('/goals', data),
  getMy: (year?: number) => api.get(`/goals/my${year ? `?year=${year}` : ''}`),
  getTeam: (params?: { year?: number; employeeId?: string }) => api.get('/goals/team', { params }),
  getAll: (year?: number) => api.get('/goals/all', { params: { year } }),
  update: (id: string, data: any) => api.put(`/goals/${id}`, data),
  submit: (id: string) => api.post(`/goals/${id}/submit`),
  submitAll: () => api.post('/goals/submit-all'),
  approve: (id: string, data: any) => api.post(`/goals/${id}/approve`, data),
  reject: (id: string, data: any) => api.post(`/goals/${id}/reject`, data),
  share: (data: any) => api.post('/goals/share', data),
};

export const checkIns = {
  create: (data: any) => api.post('/checkins', data),
  getMy: (year?: number) => api.get(`/checkins/my${year ? `?year=${year}` : ''}`),
  getTeam: (params?: any) => api.get('/checkins/team', { params }),
  update: (id: string, data: any) => api.put(`/checkins/${id}`, data),
  getCompletionStatus: (params?: any) => api.get('/checkins/completion-status', { params }),
};

export const admin = {
  getUsers: () => api.get('/admin/users'),
  createUser: (data: any) => api.post('/admin/users', data),
  getGoals: (year?: number) => api.get('/admin/goals', { params: { year } }),
  unlockGoal: (id: string) => api.put(`/admin/goals/${id}/unlock`),
  getAuditLogs: (limit?: number) => api.get('/admin/audit', { params: { limit } }),
  getAchievementReport: (params?: any) => api.get('/admin/reports/achievements', { params }),
  getDashboard: () => api.get('/admin/dashboard'),
};

export default api;
