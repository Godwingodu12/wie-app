import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LOCAL_IP } from '../constants/config';

const api = axios.create({
  baseURL: `http://${LOCAL_IP}:5005/api/user`, // Adjust based on common usage
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
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
