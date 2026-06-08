import api from './api';
import { MOCK_MODE } from '../constants/config';

export const userService = {
  async getProfile() {
    if (MOCK_MODE) {
      return { 
        name: 'Sangeeth Palliyal',
        username: 'san.geeth_palliyal',
        bio: '• Entrepreneur\n• Web Developer\n• Founder @Sqaris\n• Building ideas into digital reality',
        profilePic: null 
      };
    }
    try {
      const response = await api.get('get-profile');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async updateProfile(formData: FormData) {
    if (MOCK_MODE) return { message: 'Profile updated successfully' };
    try {
      const response = await api.put('update-profile', formData, {
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('updateProfile Error FULL:', JSON.stringify(error, null, 2));
      throw error.response?.data || error.message;
    }
  },

  async updatePersonalDetails(details: any) {
    if (MOCK_MODE) return { message: 'Details updated successfully' };
    try {
      const response = await api.put('update-personal-details', details);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async updateLocation(location: { latitude: number, longitude: number, city?: string, country?: string }) {
    if (MOCK_MODE) return { message: 'Location updated successfully' };
    try {
      const response = await api.put('update-location', location);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async getSuggestedUsers() {
    if (MOCK_MODE) return [];
    try {
      const response = await api.get('suggested');
      return response.data.data; // Backend typically wraps in { data: [...] }
    } catch (error: any) {
      console.error('getSuggestedUsers error:', error.message);
      return [];
    }
  },

  async searchUsers(query: string) {
    if (MOCK_MODE) return [];
    try {
      const response = await api.get(`search?query=${query}`);
      return response.data.data;
    } catch (error: any) {
      console.error('searchUsers error:', error.message);
      return [];
    }
  },
};
