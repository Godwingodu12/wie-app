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

// Add a request interceptor to include the auth token
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
    if (MOCK_MODE) return [];
    try {
      const response = await ticketApi.get('initial-events');
      const data = response.data.data;
      if (data && data.eventsByCategory) {
        // Flatten all events from all categories
        return Object.values(data.eventsByCategory).flat();
      }
      return [];
    } catch (error: any) {
      console.error('getInitialEvents error:', error);
      if (error.response) {
        console.error('Server responded with:', error.response.status, error.response.data);
      }
      return [];
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
