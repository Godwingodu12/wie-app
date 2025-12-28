import axios from 'axios';

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

export const followUser = async (targetUserId: string): Promise<{ success: boolean; message: string }> => {
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
}> => {
  const res = await followApi.get(`/follow/status/${targetUserId}`);
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
  checkFollowStatus
};
