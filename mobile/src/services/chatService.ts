import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVICES } from '../config/api.config';

const api = axios.create({
  baseURL: SERVICES.CHAT.replace('/api/chat', '/api/wie-chat'), // Base for wie-chat routes
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const baseUrl = config.baseURL?.endsWith('/') ? config.baseURL : `${config.baseURL}/`;
      let relativeUrl = config.url || '';
      if (relativeUrl.startsWith('/')) relativeUrl = relativeUrl.substring(1);
      
      console.log('DEBUG: chatApi Request:', config.method?.toUpperCase(), `${baseUrl}${relativeUrl}`);
      
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e: any) {
      console.error('DEBUG: chatApi interceptor error:', e.message);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const chatService = {
  async getChatList() {
    try {
      const response = await api.get('/list');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async getChatMessages(chatId: string) {
    try {
      const response = await api.get(`/${chatId}/messages`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async sendMessage(chatId: string, content: string, replyTo?: string) {
    try {
      const response = await api.post('/send', {
        chatId,
        content,
        replyTo,
        messageType: 'text'
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async createOrGetChat(userId: string) {
    try {
      const response = await api.post('/create', {
        participantId: userId
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async markAsRead(chatId: string) {
    try {
      const response = await api.post(`/${chatId}/mark-read`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  }
};

export default chatService;
