export interface User {
  id: string;
  email?: string | null;
  contact_no?: string | null;
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  profile_picture?: string | null;
  country_id?: string | null;
  role: string;
  status: string;
  is_blocked: boolean;
  is_verified: boolean;
  auth_provider: string;
  created_at: string;
  updated_at: string;
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

export interface UpdateProfileRequest {
  name?: string;
  username?: string;
  bio?: string;
  profile_picture?: string;
  country_id?: string;
}

export interface Country {
  id: string;
  country_code: string;  
  country_name: string;  
  created_at: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: User;
  tempUserId?: string;  
  expiresIn?: string;
  error?: string;
}