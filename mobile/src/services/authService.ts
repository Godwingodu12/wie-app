import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_MODE } from '../constants/config';

const handleError = (error: any) => {
  console.error('API Error:', {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    config: error.config
  });
  if (error.response?.data) {
    // Backend returned an error object
    const data = error.response.data;
    return {
      message: data.message || data.error || 'An error occurred on the server',
      ...data
    };
  }
  // Network error or other error
  return {
    message: error.message || 'Network error. Please check your connection.',
  };
};

export const authService = {
  async sendOtp(emailOrPhone: string, password?: string, country?: string) {
    if (MOCK_MODE) {
      console.log('MOCK: sendOtp Success');
      return { tempUserId: 'mock-temp-id', message: 'OTP Sent' };
    }
    try {
      const payload: any = { password, country_code: country };
      if (emailOrPhone.includes('@')) {
        payload.email = emailOrPhone;
      } else {
        payload.contact_no = emailOrPhone;
      }
      const response = await api.post('signup/send-otp', payload);
      return response.data;
    } catch (error: any) {
      throw handleError(error);
    }
  },

  async verifyOtp(id: string, otp: string, name?: string) {
    if (MOCK_MODE) {
      console.log('MOCK: verifyOtp Success');
      const token = 'mock-token-' + Math.random();
      await AsyncStorage.setItem('auth_token', token);
      return { token, message: 'Verified', user: { id: 'mock-uid', name: name || 'User' } };
    }
    try {
      // Backend expects tempUserId for signup. For others it might differ.
      const response = await api.post('signup/verify-otp', { tempUserId: id, otp, name });
      if (response.data.token) {
        await AsyncStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      throw handleError(error);
    }
  },

  async login(emailOrPhone: string, password?: string) {
    if (MOCK_MODE) {
      console.log('MOCK: login Success');
      const token = 'mock-token-' + Math.random();
      await AsyncStorage.setItem('auth_token', token);
      return { token, message: 'Logged in', user: { id: 'mock-uid', name: 'User' } };
    }
    try {
      const response = await api.post('login', { identifier: emailOrPhone, password });
      if (response.data.token) {
        console.log('DEBUG: Saving auth_token, length:', response.data.token.length);
        await AsyncStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      throw handleError(error);
    }
  },

  async resendOtp(userId: string) {
    if (MOCK_MODE) {
      console.log('MOCK: resendOtp Success');
      return { message: 'OTP Resent' };
    }
    try {
      const response = await api.post('resend-otp', { userId });
      return response.data;
    } catch (error: any) {
      throw handleError(error);
    }
  },

  async forgotPasswordSendOtp(emailOrPhone: string) {
    if (MOCK_MODE) {
      console.log('MOCK: forgotPasswordSendOtp Success');
      return { userId: 'mock-uid', message: 'Reset OTP Sent' };
    }
    try {
      const payload: any = {};
      if (emailOrPhone.includes('@')) {
        payload.email = emailOrPhone;
      } else {
        payload.contact_no = emailOrPhone;
      }
      const response = await api.post('forgot-password', payload);
      return response.data;
    } catch (error: any) {
      throw handleError(error);
    }
  },

  async forgotPasswordVerifyOtp(userId: string, otp: string) {
    if (MOCK_MODE) {
      console.log('MOCK: forgotPasswordVerifyOtp Success');
      return { message: 'OTP Verified' };
    }
    try {
      const response = await api.post('verify-reset-otp', { userId, otp });
      return response.data;
    } catch (error: any) {
      throw handleError(error);
    }
  },

  async resetPassword(userId: string, newPassword: string) {
    if (MOCK_MODE) {
      console.log('MOCK: resetPassword Success');
      return { message: 'Password reset' };
    }
    try {
      const response = await api.post('reset-password', { userId, newPassword });
      return response.data;
    } catch (error: any) {
      throw handleError(error);
    }
  },

  async logout() {
    if (MOCK_MODE) {
      console.log('MOCK: logout Success');
      await AsyncStorage.removeItem('auth_token');
      return;
    }
    try {
      // We attempt the backend call but don't let it block the UI logout
      await api.post('logout').catch(e => console.warn('Backend logout failed:', e.message));
      await AsyncStorage.removeItem('auth_token');
    } catch (error: any) {
      console.error('Logout error:', error);
      await AsyncStorage.removeItem('auth_token');
    }
  },

  async getGoogleAuthUrl() {
    if (MOCK_MODE) return 'mock://google-auth';
    try {
      const response = await api.get('google/auth?mobile=true');
      return response.data.data.authUrl;
    } catch (error: any) {
      throw handleError(error);
    }
  },

  async getMicrosoftAuthUrl() {
    if (MOCK_MODE) return 'mock://microsoft-auth';
    try {
      const response = await api.get('microsoft-auth?mobile=true');
      return response.data.data.authUrl;
    } catch (error: any) {
      throw handleError(error);
    }
  },

  async getAppleAuthUrl() {
    if (MOCK_MODE) return 'mock://apple-auth';
    try {
      const response = await api.get('apple-auth?mobile=true');
      return response.data.data.authUrl;
    } catch (error: any) {
      throw handleError(error);
    }
  },
};
