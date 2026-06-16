import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVICES } from '../config/api.config';

const api = axios.create({
  baseURL: SERVICES.CHAT.replace('/api/chat', '/api/wie-chat'), // Base for wie-chat routes
  timeout: 60000,
});

// Add a request interceptor to include the auth token and handle Content-Type
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

      // Robust FormData detection for React Native
      const isFormData = config.data && (config.data instanceof FormData || (typeof config.data === 'object' && config.data._parts));

      // Automatically set JSON Content-Type ONLY if it's a plain object and NOT FormData
      if (config.data && !isFormData && typeof config.data === 'object') {
        config.headers['Content-Type'] = 'application/json';
      }
      
      // If it IS FormData, ensure we DON'T set Content-Type so Axios can set the boundary
      // UNLESS it was explicitly set to 'multipart/form-data' by the caller
      if (isFormData) {
        const currentContentType = config.headers['Content-Type'] || config.headers['content-type'];
        if (currentContentType !== 'multipart/form-data') {
          if (typeof config.headers.delete === 'function') {
            config.headers.delete('Content-Type');
          } else if (config.headers) {
            delete config.headers['Content-Type'];
          }
        }
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
        let uri = img.uri;
        
        // Ensure proper URI formatting for Android as per RN requirements
        if (Platform.OS === 'android' && !uri.startsWith('content://') && !uri.startsWith('http') && !uri.startsWith('file://')) {
          uri = `file://${uri.startsWith('/') ? '' : '/'}${uri}`;
        }

        formData.append('images', {
          uri: uri,
          name: img.name || img.fileName || `image_${index}.jpg`,
          type: img.mimeType || (img.type === 'video' ? 'video/mp4' : 'image/jpeg')
        } as any);
      });
      
      if (replyTo) formData.append('replyTo', replyTo);
      formData.append('viewMode', 'keep');

      const token = await AsyncStorage.getItem('auth_token');
      const baseUrl = api.defaults.baseURL?.endsWith('/') ? api.defaults.baseURL : `${api.defaults.baseURL}/`;
      const url = `${baseUrl}${chatId}/send-image`;

      console.log('DEBUG: sendImage attempting XHR upload to:', url);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.timeout = 120000;
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/json');
        
        xhr.onload = () => {
          console.log('DEBUG: sendImage XHR status:', xhr.status);
          if (xhr.status >= 200 && xhr.status < 300) {
            try { 
              const response = JSON.parse(xhr.responseText);
              resolve(response); 
            } catch (e) { 
              resolve(xhr.responseText); 
            }
          } else {
            console.error('DEBUG: sendImage upload failed:', xhr.responseText);
            reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
          }
        };
        
        xhr.onerror = (e) => {
          console.error('DEBUG: sendImage XHR error:', e);
          reject(new Error('Network request failed (XHR)'));
        };

        xhr.ontimeout = () => {
          console.error('DEBUG: sendImage XHR timeout');
          reject(new Error('Network request timed out'));
        };
        
        xhr.send(formData);
      });
    } catch (error: any) {
      console.error("DEBUG: sendImage top-level error:", error);
      throw error.message || "Failed to send image";
    }
  },
  async sendAudio(chatId: string, audioUri: string, replyTo?: string) {
    try {
      let finalUri = audioUri;
      
      // CRITICAL: Do NOT decode the URI. React Native's RCTNetworking on Android 
      // expects the URI exactly as provided by the native modules.
      // Decoding lead to "Could not retrieve file" errors.
      
      if (Platform.OS === 'android' && !finalUri.startsWith('http') && !finalUri.startsWith('file://')) {
        finalUri = `file://${finalUri}`;
      }

      console.log("DEBUG: sendAudio attempting upload with URI:", finalUri);

      const formData = new FormData();
      formData.append('audio', {
        uri: finalUri,
        name: 'recording.m4a',
        type: 'audio/m4a'
      } as any);
      
      if (replyTo) formData.append('replyTo', replyTo);

      const token = await AsyncStorage.getItem('auth_token');
      const baseUrl = api.defaults.baseURL?.endsWith('/') ? api.defaults.baseURL : `${api.defaults.baseURL}/`;
      const url = `${baseUrl}${chatId}/send-audio`;
      
      console.log('DEBUG: sendAudio via XHR to:', url);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.timeout = 120000;
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.onload = () => {
          console.log('DEBUG: sendAudio XHR status:', xhr.status);
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); } catch (e) { resolve(xhr.responseText); }
          } else {
            reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
          }
        };
        xhr.onerror = (e) => {
          console.error('DEBUG: sendAudio XHR error:', e);
          reject(new Error('Network request failed (XHR)'));
        };
        xhr.ontimeout = () => {
          console.error('DEBUG: sendAudio XHR timeout');
          reject(new Error('Network request timed out'));
        };
        xhr.send(formData);
      });
    } catch (error: any) {
      console.error("DEBUG: sendAudio error:", error);
      throw error.message || "Failed to send audio";
    }
  },
  async sendLocation(chatId: string, latitude: number, longitude: number, replyTo?: string, locationData?: any) {
    try {
      const response = await api.post(`/${chatId}/send-location`, {
        latitude,
        longitude,
        replyTo,
        locationData
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
      let uri = videoUri;
      if (Platform.OS === 'android' && !uri.startsWith('http') && !uri.startsWith('file://')) {
        uri = `file://${uri}`;
      }

      const formData = new FormData();
      formData.append('video', {
        uri: uri,
        name: 'video.mp4',
        type: 'video/mp4'
      } as any);
      if (caption) formData.append('caption', caption);
      if (replyTo) formData.append('replyTo', replyTo);

      const token = await AsyncStorage.getItem('auth_token');
      const baseUrl = api.defaults.baseURL?.endsWith('/') ? api.defaults.baseURL : `${api.defaults.baseURL}/`;
      const url = `${baseUrl}${chatId}/send-video`;

      console.log('DEBUG: sendVideo attempting XHR upload to:', url);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.timeout = 180000; // Longer timeout for video
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); } catch (e) { resolve(xhr.responseText); }
          } else {
            reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
          }
        };
        xhr.onerror = (e) => {
          console.error('DEBUG: sendVideo XHR error:', e);
          reject(new Error('Network request failed (XHR)'));
        };
        xhr.ontimeout = () => {
          console.error('DEBUG: sendVideo XHR timeout');
          reject(new Error('Network request timed out'));
        };
        xhr.send(formData);
      });
    } catch (error: any) {
      throw error.message || "Failed to send video";
    }
  },

  async sendDocument(chatId: string, docUri: string, name: string, replyTo?: string) {
    try {
      let uri = docUri;
      if (Platform.OS === 'android' && !uri.startsWith('http') && !uri.startsWith('file://')) {
        uri = `file://${uri}`;
      }

      const formData = new FormData();
      formData.append('document', {
        uri: uri,
        name: name,
        type: 'application/octet-stream'
      } as any);
      if (replyTo) formData.append('replyTo', replyTo);

      const token = await AsyncStorage.getItem('auth_token');
      const baseUrl = api.defaults.baseURL?.endsWith('/') ? api.defaults.baseURL : `${api.defaults.baseURL}/`;
      const url = `${baseUrl}${chatId}/send-document`;

      console.log('DEBUG: sendDocument attempting XHR upload to:', url);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.timeout = 120000;
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); } catch (e) { resolve(xhr.responseText); }
          } else {
            reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
          }
        };
        xhr.onerror = (e) => {
          console.error('DEBUG: sendDocument XHR error:', e);
          reject(new Error('Network request failed (XHR)'));
        };
        xhr.ontimeout = () => {
          console.error('DEBUG: sendDocument XHR timeout');
          reject(new Error('Network request timed out'));
        };
        xhr.send(formData);
      });
    } catch (error: any) {
      throw error.message || "Failed to send document";
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
