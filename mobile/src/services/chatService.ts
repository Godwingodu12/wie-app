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
  },

  async getSuggestions() {
    try {
      const response = await api.get('/suggestions');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async searchUsers(query: string) {
    try {
      const response = await api.get(`/search?query=${query}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async getMessageRequests() {
    try {
      const response = await api.get('/requests');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async getUnreadCount() {
    try {
      const response = await api.get('/unread-count');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async acceptRequest(chatId: string) {
    try {
      const response = await api.post(`/${chatId}/accept`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async declineRequest(chatId: string) {
    try {
      const response = await api.post(`/${chatId}/decline`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async clearChat(chatId: string) {
    try {
      const response = await api.delete(`/${chatId}/clear`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async deleteMessage(chatId: string, messageId: string) {
    try {
      const response = await api.delete(`/${chatId}/messages/${messageId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async deleteForEveryone(chatId: string, messageIds: string[]) {
    try {
      const response = await api.post(`/${chatId}/messages/delete-for-everyone`, { messageIds });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Rich Media Senders
  async sendImage(chatId: string, images: any[], replyTo?: string) {
    try {
      const formData = new FormData();
      images.forEach((img, index) => {
        formData.append('images', {
          uri: img.uri,
          name: img.name || `image_${index}.jpg`,
          type: img.type || 'image/jpeg'
        } as any);
      });
      if (replyTo) formData.append('replyTo', replyTo);
      
      const response = await api.post(`/${chatId}/send-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async sendAudio(chatId: string, audioUri: string, replyTo?: string) {
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        name: 'audio.m4a',
        type: 'audio/m4a'
      } as any);
      if (replyTo) formData.append('replyTo', replyTo);

      const response = await api.post(`/${chatId}/send-audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async sendLocation(chatId: string, latitude: number, longitude: number, replyTo?: string) {
    try {
      const response = await api.post(`/${chatId}/send-location`, {
        latitude,
        longitude,
        replyTo
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async sendSticker(chatId: string, stickerId: string, replyTo?: string) {
    try {
      const response = await api.post(`/${chatId}/send-sticker`, {
        stickerId,
        replyTo
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async sendPoll(chatId: string, question: string, options: string[], allowMultiple: boolean = false) {
    try {
      const response = await api.post(`/${chatId}/send-poll`, {
        question,
        options,
        allowMultiple
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async sendVideo(chatId: string, videoUri: string, caption?: string, replyTo?: string) {
    try {
      const formData = new FormData();
      formData.append('video', {
        uri: videoUri,
        name: 'video.mp4',
        type: 'video/mp4'
      } as any);
      if (caption) formData.append('caption', caption);
      if (replyTo) formData.append('replyTo', replyTo);

      const response = await api.post(`/${chatId}/send-video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async sendDocument(chatId: string, docUri: string, name: string, replyTo?: string) {
    try {
      const formData = new FormData();
      formData.append('document', {
        uri: docUri,
        name: name,
        type: 'application/octet-stream'
      } as any);
      if (replyTo) formData.append('replyTo', replyTo);

      const response = await api.post(`/${chatId}/send-document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async updateLiveLocation(chatId: string, messageId: string, latitude: number, longitude: number) {
    try {
      const response = await api.patch(`/${chatId}/live-location/${messageId}`, {
        latitude,
        longitude
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async sendContact(chatId: string, contactData: any, replyTo?: string) {
    try {
      const response = await api.post(`/${chatId}/send-contact`, {
        ...contactData,
        replyTo
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async sendProfile(chatId: string, profileUserId: string, replyTo?: string) {
    try {
      const response = await api.post(`/${chatId}/send-profile`, {
        profileUserId,
        replyTo
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async markMediaViewed(chatId: string, messageId: string) {
    try {
      const response = await api.post(`/${chatId}/messages/${messageId}/viewed`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async getChatMedia(chatId: string, type?: string) {
    try {
      const response = await api.get(`/${chatId}/media${type ? `?type=${type}` : ''}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async reportScreenshot(chatId: string, imageBase64?: string) {
    try {
      const response = await api.post(`/${chatId}/report-screenshot`, {
        platform: Platform.OS,
        imageBase64
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  }
};

export default chatService;
