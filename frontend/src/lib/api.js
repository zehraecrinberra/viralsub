import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';
const api = axios.create({ baseURL: `${API_BASE}/api` });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('vs_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => Promise.reject(err.response?.data || err)
);

export default api;
