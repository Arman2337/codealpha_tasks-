import axios from 'axios';

// Create axios instance with base URL
const instance = axios.create({
  // const token = localStorage.getItem('token');
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
instance.interceptors.request.use(
  (config) => {
    if (config.url && !config.url.startsWith('http')) {
      config.url = `http://localhost:5000${config.url}`;
    }
    
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

// Add response interceptor to handle errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response || error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Override axios defaults to ensure all requests use port 5000
axios.defaults.baseURL = 'http://localhost:5000';

export default instance; 