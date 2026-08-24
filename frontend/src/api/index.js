import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getWeatherReports = async (filters = {}) => {
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

export const triggerScrape = async () => {
  try {
    // Trigger twscrape (port 8000)
    await axios.post('http://localhost:8000/scrape');
  } catch (e) {
    console.error("Twscrape trigger failed", e);
  }
  
  try {
    // Trigger apify-scraper (port 8001)
    await axios.post('http://localhost:8001/scrape');
  } catch (e) {
    console.error("Apify trigger failed", e);
  }
  return { status: "Scrapes triggered" };
};

export default apiClient;
