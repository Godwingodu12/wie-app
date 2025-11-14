import api from './userAxios';
import {
  ApiResponse,
  LoginRequest,
  SignupSendOtpRequest,
  SignupVerifyOtpRequest,
  ResendOtpRequest,
  UpdateProfileRequest,
  Country,
  User,
} from '@/types';

export const getIndex = async (): Promise<ApiResponse> => {
  try {
    const res = await api.get('/user');
    console.log('getIndex is working:', res.data);
    return res.data;
  } catch (err) {
    console.error('getIndex error:', err);
    throw err;
  }
};

export const getCountries = async (): Promise<Country[]> => {
  try {
    const res = await api.get<ApiResponse<Country[]>>('/user/countries');
    // Backend returns { success: true, data: [...] }
    return res.data.data || [];
  } catch (err) {
    console.error('getCountries error:', err);
    throw err;
  }
};

export const signupSendOtp = async (
  data: SignupSendOtpRequest
): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>('/user/signup/send-otp', data);
    // Backend returns { message: "...", tempUserId: "...", expiresIn: "..." }
    return res.data;
  } catch (err) {
    console.error('signupSendOtp error:', err);
    throw err;
  }
};

export const signupVerifyOtp = async (
  data: SignupVerifyOtpRequest
): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>('/user/signup/verify-otp', data);
    // Backend returns { message: "...", token: "...", user: {...} }
    return res.data;
  } catch (err) {
    console.error('signupVerifyOtp error:', err);
    throw err;
  }
};

export const login = async (data: LoginRequest): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>('/user/login', data);
    // Backend returns { message: "...", token: "...", user: {...} }
    return res.data;
  } catch (err) {
    console.error('login error:', err);
    throw err;
  }
};

export const resendOtp = async (
  data: ResendOtpRequest
): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>('/user/resend-otp', data);
    // Backend returns { message: "...", expiresIn: "..." }
    return res.data;
  } catch (err) {
    console.error('resendOtp error:', err);
    throw err;
  }
};

export const getProfile = async (): Promise<User> => {
  try {
    const res = await api.get<ApiResponse>('/user/get-profile');
    // Backend returns { success: true, user: {...} }
    if (!res.data.user) {
      throw new Error('User data not found in response');
    }
    return res.data.user;
  } catch (err) {
    console.error('getProfile error:', err);
    throw err;
  }
};

export const updateProfile = async (
  data: UpdateProfileRequest
): Promise<User> => {
  try {
    const res = await api.put<ApiResponse>('/user/update-profile', data);
    // Backend returns { message: "...", user: {...} }
    if (!res.data.user) {
      throw new Error('User data not found in response');
    }
    return res.data.user;
  } catch (err) {
    console.error('updateProfile error:', err);
    throw err;
  }
};

// Google OAuth
export const getGoogleAuthUrl = async (): Promise<string> => {
  try {
    const res = await api.get<ApiResponse<{ authUrl: string }>>(
      '/user/google/auth'
    );
    return res.data.data?.authUrl || '';
  } catch (err) {
    console.error('getGoogleAuthUrl error:', err);
    throw err;
  }
};

