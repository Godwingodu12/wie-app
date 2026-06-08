import api from './api';
import { MOCK_MODE } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const wieUserService = {
  async getProfile() {
    if (MOCK_MODE) {
      return { 
        id: '1',
        name: 'Sangeeth Palliyal',
        username: 'san.geeth_palliyal',
        bio: '• Entrepreneur\n• Web Developer\n• Founder @Sqaris\n• Building ideas into digital reality',
        profile_picture: null 
      };
    }
    try {
      const response = await api.get('get-profile');
      // In reference, it's res.data.user
      return response.data.user || response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async updateProfile(formData: FormData) {
    if (MOCK_MODE) return { message: 'Profile updated successfully' };
    try {
      const response = await api.put('update-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.user || response.data;
    } catch (error: any) {
      console.error('updateProfile Error:', error.message);
      throw error.response?.data || error.message;
    }
  },

  async logout() {
    if (MOCK_MODE) {
      await AsyncStorage.removeItem('auth_token');
      return { success: true };
    }
    try {
      const response = await api.post('logout');
      await AsyncStorage.removeItem('auth_token');
      return response.data;
    } catch (error: any) {
      console.error('logout Error:', error.message);
      // Still remove token locally
      await AsyncStorage.removeItem('auth_token');
      throw error.response?.data || error.message;
    }
  },

  async updatePersonalDetails(details: any) {
    if (MOCK_MODE) return { message: 'Details updated successfully' };
    try {
      const response = await api.put('update-personal-details', details);
      return response.data.user || response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async getSuggestedUsers() {
    if (MOCK_MODE) return [];
    try {
      const response = await api.get('suggested');
      return response.data.users || response.data.data || [];
    } catch (error: any) {
      console.error('getSuggestedUsers error:', error.message);
      return [];
    }
  },

  async searchUsers(query: string) {
    if (MOCK_MODE) return [];
    try {
      const response = await api.get(`search?query=${query}`);
      return response.data.users || response.data.data || [];
    } catch (error: any) {
      console.error('searchUsers error:', error.message);
      return [];
    }
  },

  async getUserById(userId: string) {
    if (MOCK_MODE) return null;
    try {
      const response = await api.get(`${userId}`);
      return response.data.user || response.data;
    } catch (error: any) {
      console.error('getUserById error:', error.message);
      throw error.response?.data || error.message;
    }
  },
};

export const getProfile = wieUserService.getProfile;
export const updateProfile = wieUserService.updateProfile;
export const updatePersonalDetails = wieUserService.updatePersonalDetails;
export const logout = wieUserService.logout;
export const getSuggestedUsers = wieUserService.getSuggestedUsers;
export const searchUsers = wieUserService.searchUsers;
export const getUserById = wieUserService.getUserById;
