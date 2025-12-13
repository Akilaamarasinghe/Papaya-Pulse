import axios from 'axios';
import { Platform } from 'react-native';

// Backend API Configuration
// Your computer's IP: 172.20.10.4

const getBaseURL = () => {
  // If running on web browser
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  
  // If running on Android (Emulator or Physical Device)
  if (Platform.OS === 'android') {
    return 'http://172.20.10.4:5000/api';
  }
  
  // If running on iOS (Simulator or Physical Device)
  if (Platform.OS === 'ios') {
    return 'http://172.20.10.4:5000/api';
  }
  
  // Default fallback
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add auth token to requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Log the API URL for debugging
console.log('📡 API Base URL:', API_BASE_URL);

export default api;
