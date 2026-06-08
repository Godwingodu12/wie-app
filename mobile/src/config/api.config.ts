// mobile/src/config/api.config.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LOCAL_IP } from '../constants/config';

export const MOCK_MODE = false;

export const SERVICES = {
  AUTH: `http://${LOCAL_IP}:5000/api/auth/`,
  USER: `http://${LOCAL_IP}:5005/api/user/`,
  MEDIA: `http://${LOCAL_IP}:5010/api/`,
  CONNECTION: `http://${LOCAL_IP}:5012/api/`,
  CHAT: `http://${LOCAL_IP}:5004/api/chat/`,
  NOTIFICATION: `http://${LOCAL_IP}:5006/api/notification/`,
  TICKET: `http://${LOCAL_IP}:5003/api/ticket/`,
  TRANSACTION: `http://${LOCAL_IP}:5007/api/transaction/`,
  FOLLOW: `http://${LOCAL_IP}:5009/api/`,
};

const api = axios.create({
  baseURL: SERVICES.USER,
  timeout: 30000,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
