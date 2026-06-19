import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVICES, MOCK_MODE } from '../constants/config';

const ticketApi = axios.create({
  baseURL: SERVICES.TICKETS,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token and handle Content-Type
ticketApi.interceptors.request.use(
  async (config) => {
    try {
      const baseUrl = config.baseURL?.endsWith('/') ? config.baseURL : `${config.baseURL}/`;
      let relativeUrl = config.url || '';
      if (relativeUrl.startsWith('/')) relativeUrl = relativeUrl.substring(1);
      
      console.log('DEBUG: ticketApi Request:', config.method?.toUpperCase(), `${baseUrl}${relativeUrl}`);
      
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
      console.error('DEBUG: ticketApi interceptor error:', e.message);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const ticketUserService = {
  async getInitialEvents() {
    if (MOCK_MODE) return { events: [], categories: [] };
    try {
      const response = await ticketApi.get('initial-events');
      const data = response.data.data;
      if (data) {
        return {
          events: data.eventsByCategory ? Object.values(data.eventsByCategory).flat() : [],
          categories: data.categories || []
        };
      }
      return { events: [], categories: [] };
    } catch (error: any) {
      console.error('getInitialEvents error:', error);
      if (error.response) {
        console.error('Server responded with:', error.response.status, error.response.data);
      }
      return { events: [], categories: [] };
    }
  },

  async getPopularEvents(limit = 10) {
    if (MOCK_MODE) return [];
    try {
      const response = await ticketApi.get(`popular-events?limit=${limit}`);
      return response.data.data.events;
    } catch (error: any) {
      console.error('getPopularEvents error:', error);
      if (error.response) {
        console.error('Server responded with:', error.response.status, error.response.data);
      }
      return [];
    }
  },

  async getCategoryBasedEvents(category: string) {
    if (MOCK_MODE) return [];
    try {
      const response = await ticketApi.get(`category-events?category=${encodeURIComponent(category)}`);
      return response.data.data;
    } catch (error: any) {
      console.error('getCategoryBasedEvents error:', error);
      if (error.response) {
        console.error('Server responded with:', error.response.status, error.response.data);
      }
      return null;
    }
  }
};
