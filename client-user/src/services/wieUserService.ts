import api from './userAxios';
import {
  ApiResponse,
  LoginRequest,
  SignupSendOtpRequest,
  SignupVerifyOtpRequest,
  ResendOtpRequest,
  UpdateProfileRequest,
  SetPasswordRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  VerifyResetOTPRequest,
  ResetPasswordRequest,
  CheckPasswordResponse,
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
export interface AccountPrivacyResponse{
  success: boolean;
  accountPrivacy: string;
}
export interface UpdateAccountPrivacyRequest{
  accountPrivacy: 'public' | 'private';
}
export interface UpdatePersonalDetailsRequest{
  gender: string;
  date_of_birth: string;
}
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
export const checkCanSetPassword = async (): Promise<CheckPasswordResponse> => {
  try {
    const res = await api.get<CheckPasswordResponse>('/user/check-can-set-password');
    return res.data; // NOT res.data.data
  } catch (err) {
    console.error('checkCanSetPassword error:', err);
    throw err;
  }
};
export const setPasswordForGoogleUser = async (data: SetPasswordRequest): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>('/user/set-password-for-google-user', data);
    return res.data;
  } catch (err) {
    console.error('setPasswordForGoogleUser error:', err);
    throw err;
  }
};
export const getMicrosoftAuthUrl = async (): Promise<string> => {
  try {
    const res = await api.get<ApiResponse<{ authUrl: string }>>(
      '/user/microsoft-auth'
    );
    return res.data.data?.authUrl || '';
  } catch (err) {
    console.error('getMicrosoftAuthUrl error:', err);
    throw err;
  } 
};
export const getAppleAuthUrl = async (): Promise<string> => {
  try {
    const res = await api.get<ApiResponse<{ authUrl: string }>>(
      '/user/apple-auth'
    );
    return res.data.data?.authUrl || '';
  } catch (err) {
    console.error('getAppleAuthUrl error:', err);
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
export const logout = async (): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>('/user/logout');
    return res.data;
  } catch (err) {
    console.error('logout error:', err);
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
  data: UpdateProfileRequest | FormData
): Promise<User> => {
  try {
    const headers: Record<string, string> = {};
    if (data instanceof FormData) {
      headers['Content-Type'] = 'multipart/form-data';
    }
    const res = await api.put<ApiResponse>('/user/update-profile', data, {
      headers,
    });
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
// Forgot Password APIs
export const forgotPassword = async (identifier: { email?: string; contact_no?: string }): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>('/user/forgot-password', identifier);
    return res.data;
  } catch (err) {
    console.error('forgotPassword error:', err);
    throw err;
  }
};
export const verifyResetOTP = async (userId: string, otp: string): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>('/user/verify-reset-otp', {
      userId,
      otp,
    });
    return res.data;
  } catch (err) {
    console.error('verifyResetOTP error:', err);
    throw err;
  }
};
export const resetPassword = async (userId: string, newPassword: string): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>('/user/reset-password', {
      userId,
      newPassword,
    });
    return res.data;
  } catch (err) {
    console.error('resetPassword error:', err);
    throw err;
  }
};
export const updateUserLocation = async (data: {
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<any> => {
  try {
    // Only send fields that are explicitly set
    const payload: Record<string, any> = {};
    
    if (data.location !== undefined) {
      payload.location = data.location;
    }
    
    if (data.latitude !== undefined) {
      payload.latitude = data.latitude;
    }
    
    if (data.longitude !== undefined) {
      payload.longitude = data.longitude;
    }

    const res = await api.put<ApiResponse>('/user/update-location', payload);
    return res.data;
  } catch (err) {
    console.error('updateUserLocation error:', err);
    throw err;
  }
};
export const getUserLocation = async (): Promise<{
  location: string | null;
  latitude: number | null;
  longitude: number | null;
}> => {
  try {
    const res = await api.get<ApiResponse>('/user/get-location');
    return res.data.data;
  } catch (err) {
    console.error('getUserLocation error:', err);
    throw err;
  }
};
export const changePassword = async (
  payload: ChangePasswordRequest
): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>('/user/change-password', payload);
    return res.data;
  } catch (err) {
    console.error('changePassword error:', err);
    throw err;
  }
};
export const searchUsers = async (query: string, page: number = 1, limit: number = 20): Promise<any> => {
  try {
    const res = await api.get('/user/search', {
      params: { query, page, limit }
    });
    return res.data;
  } catch (err) {
    console.error('searchUsers error:', err);
    throw err;
  }
};
export const getUserById = async (userId: string): Promise<User> => {
  try {
    const res = await api.get(`/user/${userId}`);
    return res.data.user;
  } catch (err) {
    console.error('getUserById error:', err);
    throw err;
  }
};
export const getSuggestedUsers = async (limit: number = 10): Promise<User[]> => {
  try {
    const res = await api.get('/user/suggested', {
      params: { limit }
    });
    return res.data.users;
  } catch (err) {
    console.error('getSuggestedUsers error:', err);
    throw err;
  }
};
export const updateHeartbeat = async (): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>('/user/heartbeat');
    return res.data;
  } catch (err) {
    console.error('updateHeartbeat error:', err);
    throw err;
  }
};
export const getAccountPrivacy = async (): Promise<AccountPrivacyResponse> => {
  try {
    const res = await api.get<AccountPrivacyResponse>('/user/account-privacy');
    return res.data;
  } catch (err) {
    console.error('getAccountPrivacy error:', err);
    throw err;
  }
};

export const updateAccountPrivacy = async (
  data: UpdateAccountPrivacyRequest
): Promise<AccountPrivacyResponse> => {
  try {
    const res = await api.put<AccountPrivacyResponse>('/user/account-privacy', data);
    return res.data;
  } catch (err) {
    console.error('updateAccountPrivacy error:', err);
    throw err;
  }
};
export const muteUser = async (userId: string): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>('/user/mute', { userId });
    return res.data;
  } catch (err) {
    console.error('muteUser error:', err);
    throw err;
  }
};
export const unmuteUser = async(userId: string): Promise<ApiResponse> => {
  try {
    const res = await api.post<ApiResponse>('/user/unmute',{userId});
    return res.data;
  }catch (err){
    console.error("unmute error:",err);
    throw err;
  }
};
export const updatePersonalDetails = async (
  data: UpdatePersonalDetailsRequest
): Promise<User> => {
  try {
    const res = await api.put<ApiResponse>('/user/update-personal-details', data);
    if (!res.data.user) {
      throw new Error('User data not found in response');
    }
    return res.data.user;
  } catch (err) {
    console.error('updatePersonalDetails error:', err);
    throw err;
  }
};

