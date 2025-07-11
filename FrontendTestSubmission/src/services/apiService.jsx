import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3100';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to log outgoing requests
api.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to log responses and calculate timing
api.interceptors.response.use(
  (response) => {
    const responseTime = new Date() - response.config.metadata.startTime;
    response.responseTime = responseTime;
    return response;
  },
  (error) => {
    if (error.config && error.config.metadata) {
      const responseTime = new Date() - error.config.metadata.startTime;
      error.responseTime = responseTime;
    }
    return Promise.reject(error);
  }
);

/**
 * Create a shortened URL
 */
export const createShortUrl = async (urlData) => {
  try {
    const response = await api.post('/shorturls', urlData);
    return {
      success: true,
      data: response.data,
      responseTime: response.responseTime
    };
  } catch (error) {
    console.error('Error creating short URL:', error);
    return {
      success: false,
      error: error.response?.data || { message: 'Network error' },
      responseTime: error.responseTime
    };
  }
};

/**
 * Get statistics for a shortened URL
 */
export const getUrlStatistics = async (shortcode) => {
  try {
    const response = await api.get(`/shorturls/${shortcode}`);
    return {
      success: true,
      data: response.data,
      responseTime: response.responseTime
    };
  } catch (error) {
    console.error('Error getting URL statistics:', error);
    return {
      success: false,
      error: error.response?.data || { message: 'Network error' },
      responseTime: error.responseTime
    };
  }
};


export const createMultipleShortUrls = async (urlDataArray) => {
  const results = [];
  
  for (const urlData of urlDataArray) {
    const result = await createShortUrl(urlData);
    results.push({
      ...result,
      originalData: urlData
    });
  }
  
  return results;
};

export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return {
      success: true,
      data: response.data,
      responseTime: response.responseTime
    };
  } catch (error) {
    console.error('Error checking health:', error);
    return {
      success: false,
      error: error.response?.data || { message: 'Network error' },
      responseTime: error.responseTime
    };
  }
};


export const getApiInfo = async () => {
  try {
    const response = await api.get('/');
    return {
      success: true,
      data: response.data,
      responseTime: response.responseTime
    };
  } catch (error) {
    console.error('Error getting API info:', error);
    return {
      success: false,
      error: error.response?.data || { message: 'Network error' },
      responseTime: error.responseTime
    };
  }
};

export default api;
