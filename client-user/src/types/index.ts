export interface User {
  id: string;
  email?: string | null;
  contact_no?: string | null;
  gender?: string | null;
  dob?: string | Date | null;
  name?: string | null;
  username?: string | null;
  profile_picture?: string | null;
  country_id?: string | null;
  country_name?: string | null;
  country_code?: string | null;
  role?: string;
  status?: string;
  bio?: string | null;
  followRequestStatus?: 'pending' | 'active' | 'none'; 
  accountPrivacy?: string | null;
  locationSource?: string | null;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_blocked?: boolean;
  is_verified?: boolean;
  token_version?: number;
  isOnline?: boolean;
  lastSeenAt?: string | null;
  auth_provider?: string;
  allowMessagesFrom?: string | null;
  allowMessageRequests?: boolean | null;
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
// Add to existing file
export interface FollowUser {
  userId: string;
  followedAt: string;
  name?: string;
  username?: string;
  profile_picture?: string;
  bio?: string;
}

export interface FollowersResponse {
  followers: FollowUser[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FollowingResponse {
  following: FollowUser[];
  total: number;
  page: number;
  totalPages: number;
}
export interface FollowStatsResponse {
  followers: number;
  following: number;
}
export interface SearchUsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}
export interface FollowResponse {
  success: boolean;
  message: string;
  followerId?: string;
  followingId?: string;
  status?: 'active' | 'pending' | 'none';
  isPrivateAccount?: boolean;
}
export interface FollowStatusResponse {
  success: boolean;
  isFollowing: boolean;
  isPending: boolean;
  status: 'active' | 'pending' | 'none';
}
export interface FollowRequestUser {
  id: string;
  requestedAt: string;
  name?: string;
  username?: string;
  profile_picture?: string;
  bio?: string;
  is_verified?: boolean;
}
export interface FollowRequestsResponse {
  requests: FollowRequestUser[];
  total: number;
  page: number;
  totalPages: number;
}
export interface AccountPrivacyResponse {
  success: boolean;
  accountPrivacy: string;
}
export interface UpdateAccountPrivacyRequest {
  accountPrivacy: 'public' | 'private';
}
