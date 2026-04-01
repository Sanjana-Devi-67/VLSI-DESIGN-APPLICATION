import axios from 'axios';

// Use environment variable or default to relative path (proxied by Vite/Nginx)
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    console.error(`[API Error] ${message}`);
    return Promise.reject(error);
  }
);

// ── API Methods ──────────────────────────────────────────────────

/**
 * Get the list of required features for manual prediction.
 */
export const getRequiredFeatures = async () => {
  const response = await api.get('/features');
  return response.data;
};

/**
 * Run defect prediction based on manual feature inputs.
 */
export const predictManual = async (features) => {
  const response = await api.post('/predict_manual', { features });
  return response.data;
};

/**
 * Get historical predictions.
 */
export const getPredictions = async (skip = 0, limit = 50) => {
  const response = await api.get(`/predictions?skip=${skip}&limit=${limit}`);
  return response.data;
};

/**
 * Get uploaded files.
 */
export const getUploads = async (skip = 0, limit = 50) => {
  const response = await api.get(`/uploads?skip=${skip}&limit=${limit}`);
  return response.data;
};

/**
 * Upload CSV file for prediction.
 */
export const uploadCSVForPrediction = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload_predict', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Health check.
 */
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
