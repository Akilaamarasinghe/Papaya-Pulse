import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Backend API Configuration
// To use on different networks:
// 1. Find your computer's IP address (ipconfig on Windows, ifconfig on Mac/Linux)
// 2. Set it in app.json under "extra.apiUrl"
// 3. Make sure your backend server allows connections from all IPs (0.0.0.0)

const getBaseURL = () => {
  try {
    // Check if API URL is set in app.json
    const configuredApiUrl = Constants.expoConfig?.extra?.apiUrl;
    
    if (configuredApiUrl && typeof configuredApiUrl === 'string') {
      console.log('Using configured API URL:', configuredApiUrl);
      return configuredApiUrl;
    }
    
    // If running on web browser
    if (Platform.OS === 'web') {
      return 'http://localhost:3000/api';
    }
    
    // For mobile devices, try to use the manifest debugger host
    // This automatically uses the right IP when using Expo
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      try {
        // Try modern expo-constants API first
        const manifest = Constants.manifest2 || Constants.manifest;
        const debuggerHost = manifest?.debuggerHost || Constants.expoConfig?.hostUri;
        
        if (debuggerHost && typeof debuggerHost === 'string') {
          const host = debuggerHost.split(':')[0];
          if (host && host.length > 0) {
            const apiUrl = `http://${host}:3000/api`;
            console.log('Auto-detected API URL:', apiUrl);
            return apiUrl;
          }
        }
      } catch (e) {
        console.warn('Failed to auto-detect IP:', e);
      }
    }
    
    // Default fallback - use a placeholder IP that user needs to update
    console.warn('Could not auto-detect IP. Please set apiUrl in app.json');
    return 'http://192.168.1.100:3000/api'; // Default placeholder
  } catch (error) {
    console.error('Error in getBaseURL:', error);
    return 'http://192.168.1.100:3000/api'; // Fallback
  }
};

const API_BASE_URL = getBaseURL();

// Validate that we have a valid URL
if (!API_BASE_URL || typeof API_BASE_URL !== 'string') {
  console.error('Invalid API_BASE_URL:', API_BASE_URL);
  throw new Error('API Base URL is not properly configured');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Increased to 60 seconds for slow networks
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
