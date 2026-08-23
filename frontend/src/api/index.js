import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getReports = async (filters = {}) => {
  const params = {};
  if (filters.eventType) params.eventType = filters.eventType;
  if (filters.state) params.state = filters.state;
  if (filters.city) params.city = filters.city;
  if (filters.severity) params.severity = filters.severity;

  const response = await apiClient.get('/api/v1/reports', { params });
  return response.data;
};

export const getReportById = async (id) => {
  const response = await apiClient.get(`/api/v1/reports/${id}`);
  return response.data;
};

export const getHealth = async () => {
  const response = await apiClient.get('/api/v1/health');
  return response.data;
};

export default apiClient;
