import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVICES } from '../constants/config';

const mediaApi = axios.create({
  baseURL: SERVICES.MEDIA,
  timeout: 600000, // 10 minutes
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

// Request interceptor for Auth token and Multipart handling
mediaApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Robust FormData detection for React Native
      const isFormData = config.data && (
        config.data instanceof FormData ||
        (typeof config.data === 'object' && config.data._parts)
      );

      if (isFormData) {
        // Axios 1.x + React Native: DO NOT set Content-Type.
        // If we set it to anything (even null), it can break the boundary generation.
        if (config.headers.has('Content-Type')) {
          config.headers.delete('Content-Type');
        }
        // Force the transformRequest to be a no-op for FormData
        config.transformRequest = [(data) => data];
      }

      console.log(`DEBUG: mediaApi Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    } catch (e: any) {
      console.error('DEBUG: mediaApi interceptor error:', e.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for detailed error logging
mediaApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('DEBUG: Request timed out. Large files might need more time or better connection.');
    }
    
    console.error('DEBUG: mediaApi Error:', error.message);
    if (error.response) {
      console.error('DEBUG: Server responded with:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('DEBUG: No response received. Potential Reasons: Port 5005 blocked, Server down, or IP mismatch.');
      // Special check for common React Native fetch issues
      if (error.message.includes('Network Error')) {
        console.error('DEBUG: This usually means the server IP is unreachable from your phone.');
      }
    }
    return Promise.reject(error);
  }
);

export default mediaApi;
