import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVICES } from '../constants/config';

const mediaApi = axios.create({
  baseURL: SERVICES.MEDIA,
  timeout: 60000,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

// Add a request interceptor to include the auth token and handle Content-Type
mediaApi.interceptors.request.use(
  async (config) => {
    try {
      const baseUrl = config.baseURL?.endsWith('/') ? config.baseURL : `${config.baseURL}/`;
      let relativeUrl = config.url || '';
      if (relativeUrl.startsWith('/')) relativeUrl = relativeUrl.substring(1);
      
      console.log('DEBUG: mediaApi Request:', config.method?.toUpperCase(), `${baseUrl}${relativeUrl}`);
      
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Robust FormData detection for React Native
      const isFormData = config.data && (config.data instanceof FormData || (typeof config.data === 'object' && config.data._parts));

      // Automatically set JSON Content-Type ONLY if it's a plain object and NOT FormData
      if (config.data && !isFormData && typeof config.data === 'object') {
        config.headers['Content-Type'] = 'application/json';
      }
      
      // If it IS FormData, ensure we DON'T set Content-Type so Axios/Fetch can set the boundary
      if (isFormData) {
        delete config.headers['Content-Type'];
      }
    } catch (e: any) {
      console.error('DEBUG: mediaApi interceptor error:', e.message);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default mediaApi;
