import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  async sendOtp(emailOrPhone, password, countryCode) {
    try {
      const payload = { password, country_code: countryCode };
      if (emailOrPhone.includes('@')) {
        payload.email = emailOrPhone;
      } else {
        payload.contact_no = emailOrPhone;
      }
      const response = await api.post('/signup/send-otp', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async verifyOtp(emailOrPhone, otp) {
    try {
      const response = await api.post('/signup/verify-otp', { emailOrPhone, otp });
      if (response.data.token) {
        await AsyncStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async login(emailOrPhone, password) {
    try {
      const response = await api.post('/login', { identifier: emailOrPhone, password });
      if (response.data.token) {
        await AsyncStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async logout() {
    try {
      await api.post('/logout');
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Logout error:', error);
      await AsyncStorage.removeItem('auth_token');
    }
  },
};
