export interface User {
  id: string;
  email?: string | null;
  contact_no?: string | null;
  name?: string | null;
  username?: string | null;
  profile_picture?: string | null;
  country_id?: string | null;
  country_name?: string | null;
  country_code?: string | null;
  role?: string;
  status?: string;
  bio?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_blocked?: boolean;
  is_verified?: boolean;
  auth_provider?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}
export interface UpdateProfileRequest {
  name?: string;
  username?: string;
  bio?: string;
  country_id?: string;
  profile_picture?: string;
}
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}
export interface SignupSendOtpRequest {
  email?: string;
  contact_no?: string;
  password: string;
  country_id: string; 
}
export interface SignupVerifyOtpRequest {
  tempUserId: string;  
  otp: string;
  name?: string;  
}
export interface ResendOtpRequest {
  userId: string; 
}

export interface Country {
  id: string;
  country_code: string;  
  country_name: string;  
  phone_code: string | null;
  created_at: string;
}
export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: User;
  tempUserId?: string;  
  remainingAttempts?: number;
  expiresIn?: string;
  error?: string;
}
export interface CheckPasswordResponse {
  success: boolean;
  canSetPassword: boolean;
  authProvider: string;
  hasPassword: boolean;
}
export interface SetPasswordRequest {
  password: string;
  confirmPassword: string;
}
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
export interface ForgotPasswordRequest {
  email?: string;
  contact_no?: string;
}
export interface VerifyResetOTPRequest {
  userId: string;
  otp: string;
}
export interface ResetPasswordRequest {
  userId: string;
  newPassword: string;
} 
