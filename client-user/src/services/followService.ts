import axios from 'axios';
import { FollowStatusResponse } from '@/types';
const FOLLOW_API_URL = process.env.NEXT_PUBLIC_FOLLOW_API_URL || 'http://localhost:5009/api';
const followApi = axios.create({
  baseURL: FOLLOW_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
followApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
followApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Follow API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
export const followUser = async (targetUserId: string): Promise<{
  success: boolean;
  message: string;
  status?: 'active' | 'pending';
  requestStatus?: 'active' | 'pending';
  isPrivateAccount?: boolean;
}> => {
  const res = await followApi.post(`/follow/${targetUserId}`);
  return res.data;
};
export const unfollowUser = async (targetUserId: string): Promise<{ success: boolean; message: string }> => {
  const res = await followApi.delete(`/unfollow/${targetUserId}`);
  return res.data;
};

export const isFollowing = async (targetUserId: string): Promise<boolean> => {
  try {
    const res = await followApi.get(`/is-following/${targetUserId}`);
    return res.data.isFollowing;
  } catch (error) {
    console.error('Check following error:', error);
    return false;
  }
};

export const getFollowers = async (userId: string, page = 1, limit = 20): Promise<any> => {
  const res = await followApi.get(`/followers/${userId}`, {
    params: { page, limit },
  });
  return res.data;
};

export const getFollowing = async (userId: string, page = 1, limit = 20): Promise<any> => {
  const res = await followApi.get(`/following/${userId}`, {
    params: { page, limit },
  });
  return res.data;
};
export const getOtherFollowers = async (userId: string, page = 1, limit = 20): Promise<any> => {
  const res = await followApi.get(`/other-followers/${userId}`, {
    params: { page, limit },
  });
  return res.data;
};

export const getOtherFollowing = async (userId: string, page = 1, limit = 20): Promise<any> => {
  const res = await followApi.get(`/other-following/${userId}`, {
    params: { page, limit },
  });
  return res.data;
};
export const getFollowStats = async (userId: string): Promise<{ followers: number; following: number }> => {
  const res = await followApi.get(`/follow/stats/${userId}`);
  return res.data;
};

export const checkFollowStatus = async (targetUserId: string): Promise<{ 
  success: boolean;
  isFollowing: boolean;
  isSelf: boolean;
  message?: string;
  requestStatus?: string;
}> => {
  const res = await followApi.get(`/follow/status/${targetUserId}`);
  return res.data;
};
export const getDetailedFollowStatus = async (targetUserId: string): Promise<FollowStatusResponse> => {
  const res = await followApi.get(`/detailed-status/${targetUserId}`);
  return res.data;
};
export const getFollowRequests = async (page = 1, limit = 20): Promise<any> => {
  const res = await followApi.get('/follow-requests', {
    params: { page, limit },
  });
  return res.data;
};

export const acceptFollowRequest = async (followerId: string): Promise<{ success: boolean; message: string }> => {
  const res = await followApi.post(`/accept-request/${followerId}`);
  return res.data;
};

export const rejectFollowRequest = async (followerId: string): Promise<{ success: boolean; message: string }> => {
  const res = await followApi.post(`/reject-request/${followerId}`);
  return res.data;
};

export const cancelFollowRequest = async (targetUserId: string): Promise<{ success: boolean; message: string }> => {
  const res = await followApi.delete(`/cancel-request/${targetUserId}`);
  return res.data;
};
export const checkFollowRequestStatus = async (fromUserId: string): Promise<{ 
  success: boolean;
  hasRequest: boolean;
  requestStatus: 'pending' | 'active' | 'none';
  isFollowingBack: boolean;
}> => {
  const res = await followApi.get(`/follow-request/status/${fromUserId}`);
  return res.data;
};
export const getSentFollowRequests = async (userId: string): Promise<{ sentRequests: any[] }> => {
  const res = await followApi.get(`/get-send-follow-request/${userId}`);
  return res.data;
};  
export default {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowers,
  getFollowing,
  getOtherFollowers,
  getOtherFollowing,
  getFollowStats,
  checkFollowStatus,
  getDetailedFollowStatus,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
  cancelFollowRequest,
  checkFollowRequestStatus,
  getSentFollowRequests
};
