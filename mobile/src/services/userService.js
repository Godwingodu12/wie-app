import api from './api';

export const userService = {
  async getProfile() {
    try {
      const response = await api.get('/get-profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async updateProfile(formData) {
    try {
      const response = await api.put('/update-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async updatePersonalDetails(details) {
    try {
      const response = await api.put('/update-personal-details', details);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async updateLocation(location) {
    try {
      const response = await api.put('/update-location', location);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
