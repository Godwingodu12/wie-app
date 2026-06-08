import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVICES } from '../config/api.config';

const api = axios.create({
  baseURL: SERVICES.NOTIFICATION,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const baseUrl = config.baseURL?.endsWith('/') ? config.baseURL : `${config.baseURL}/`;
      let relativeUrl = config.url || '';
      if (relativeUrl.startsWith('/')) relativeUrl = relativeUrl.substring(1);
      
      console.log('DEBUG: notificationApi Request:', config.method?.toUpperCase(), `${baseUrl}${relativeUrl}`);
      
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e: any) {
      console.error('DEBUG: notificationApi interceptor error:', e.message);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const notificationService = {
  async getNotifications() {
    try {
      const response = await api.get('/get-notifications');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const response = await api.patch(`/notification-read/${notificationId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async markAllAsRead() {
    try {
      const response = await api.patch('/mark-all-read');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async deleteNotification(notificationId: string) {
    try {
      const response = await api.delete(`/delete-notification/${notificationId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  }
};

export default notificationService;
