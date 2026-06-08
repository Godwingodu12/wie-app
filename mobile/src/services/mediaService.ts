import mediaApi from './mediaApi';
import { MOCK_MODE, SERVICES } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const mediaService = {
  async getPostFeed(page: number = 1, limit: number = 20) {
    if (MOCK_MODE) {
      return null;
    }
    try {
      const response = await mediaApi.get('post/feed', {
        params: { page, limit }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('getPostFeed error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return null;
    }
  },

  async getExploreFeed(page: number = 1, limit: number = 20) {
    if (MOCK_MODE) {
      return null;
    }
    try {
      const response = await mediaApi.get('post/explore', {
        params: { page, limit }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('getExploreFeed error:', error.message);
      return null;
    }
  },

  async togglePostLike(postId: string, emoji?: string) {
    if (MOCK_MODE) return { liked: true, likeCount: 101 };
    try {
      const response = await mediaApi.post(`post/${postId}/like`, { emoji });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async toggleFluxLike(fluxId: string, emoji?: string) {
    if (MOCK_MODE) return { liked: true, likeCount: 101 };
    try {
      const response = await mediaApi.post(`flux/${fluxId}/like`, { emoji });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async createPost(formData: FormData) {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const url = `${SERVICES.MEDIA}post/create`;
      console.log('DEBUG: Fetching Post Create', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('createPost Fetch Error:', response.status, responseData);
        throw new Error(responseData.message || 'Failed to upload post');
      }

      return responseData;
    } catch (error: any) {
      console.error('createPost Error:', error.message);
      throw error;
    }
  },

  async createFlux(formData: FormData) {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const url = `${SERVICES.MEDIA}flux/create`;
      console.log('DEBUG: Fetching Flux (Story) Create', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || 'Failed to upload flux');
      return responseData;
    } catch (error: any) {
      console.error('createFlux Error:', error.message);
      throw error;
    }
  },

  async getUserPosts(userId: string, page: number = 1, limit: number = 20) {
    if (MOCK_MODE) return { data: [], pagination: { total: 0 } };
    try {
      const response = await mediaApi.get(`post/user/${userId}`, {
        params: { page, limit }
      });
      return response.data; // Return the whole response.data (contains data and pagination)
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async toggleSavePost(postId: string) {
    try {
      const response = await mediaApi.post(`post/${postId}/save`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async getSavedPosts(page: number = 1, limit: number = 20) {
    try {
      const response = await mediaApi.get('post/saved', {
        params: { page, limit }
      });
      return response.data.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async updatePost(postId: string, body: { caption?: string; locationLabel?: string }) {
    try {
      const response = await mediaApi.patch(`post/${postId}`, body);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async deletePost(postId: string) {
    try {
      const response = await mediaApi.delete(`post/${postId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async addComment(postId: string, text: string) {
    try {
      const response = await mediaApi.post(`post/${postId}/comments`, { text });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async addCommentReply(postId: string, commentId: string, text: string) {
    try {
      const response = await mediaApi.post(`post/${postId}/comments/${commentId}/reply`, { text });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async deleteComment(postId: string, commentId: string) {
    try {
      const response = await mediaApi.delete(`post/${postId}/comments/${commentId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async getUserDiaries(userId: string) {
    if (MOCK_MODE) return [];
    try {
      const response = await mediaApi.get(`diary/user/${userId}`);
      return response.data.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async getReelsFeed(page: number = 1, limit: number = 20) {
    if (MOCK_MODE) return [];
    try {
      const response = await mediaApi.get('post/reels', {
        params: { page, limit }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('getReelsFeed error:', error.message);
      return [];
    }
  },

  async getFluxFeed() {
    if (MOCK_MODE) return [];
    try {
      // Flux (Story) feed
      const response = await mediaApi.get('flux/feed');
      return response.data.data || [];
    } catch (error: any) {
      console.error('getFluxFeed error:', error.message);
      return [];
    }
  },

  async togglePostComments(postId: string) {
    try {
      const response = await mediaApi.patch(`post/${postId}/comments/toggle`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
};

export const getPostFeed = mediaService.getPostFeed;
export const createPost = mediaService.createPost;
export const createFlux = mediaService.createFlux;
export const getUserPosts = mediaService.getUserPosts;
export const getExploreFeed = mediaService.getExploreFeed;
export const togglePostLike = mediaService.togglePostLike;
export const toggleSavePost = mediaService.toggleSavePost;
export const getSavedPosts = mediaService.getSavedPosts;
export const updatePost = mediaService.updatePost;
export const deletePost = mediaService.deletePost;
export const addComment = mediaService.addComment;
export const addCommentReply = mediaService.addCommentReply;
export const deleteComment = mediaService.deleteComment;
export const getUserDiaries = mediaService.getUserDiaries;
export const getReelsFeed = mediaService.getReelsFeed;
export const getFluxFeed = mediaService.getFluxFeed;
export const toggleFluxLike = mediaService.toggleFluxLike;
export const togglePostComments = mediaService.togglePostComments;

