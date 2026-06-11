import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVICES, LOCAL_IP } from '../constants/config';

// Ensure FOLLOW is in SERVICES
const FOLLOW_URL = (SERVICES as any).FOLLOW || `http://${LOCAL_IP}:5009/api/`;

const api = axios.create({
  baseURL: FOLLOW_URL,
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const baseUrl = config.baseURL?.endsWith('/') ? config.baseURL : `${config.baseURL}/`;
      let relativeUrl = config.url || '';
      if (relativeUrl.startsWith('/')) relativeUrl = relativeUrl.substring(1);
      
      console.log('DEBUG: followApi Request:', config.method?.toUpperCase(), `${baseUrl}${relativeUrl}`);
      
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e: any) {
      console.error('DEBUG: followApi interceptor error:', e.message);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const followService = {
  async getFollowStats(userId: string) {
    try {
      const response = await api.get(`follow/stats/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async getFollowers(userId: string) {
    try {
      const response = await api.get(`followers/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async getFollowing(userId: string) {
    try {
      const response = await api.get(`following/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async checkFollowStatus(targetUserId: string) {
    try {
      const response = await api.get(`follow/status/${targetUserId}`);
      // Backend returns { success: true, isFollowing: bool, isPending: bool, ... }
      return response.data; 
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async followUser(targetUserId: string) {
    try {
      const response = await api.post(`follow/${targetUserId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async unfollowUser(targetUserId: string) {
    try {
      const response = await api.delete(`unfollow/${targetUserId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  }
};

export const getFollowStats = followService.getFollowStats;
export const getFollowers = followService.getFollowers;
export const getFollowing = followService.getFollowing;
export const checkFollowStatus = followService.checkFollowStatus;
export const followUser = followService.followUser;
export const unfollowUser = followService.unfollowUser;

export default followService;
