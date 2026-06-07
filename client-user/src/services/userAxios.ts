import axios, { AxiosError } from 'axios';
import { store } from '../features/store';
import { logoutSuccess } from '../features/auth/authSlice';

const userAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5005/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
userAPI.interceptors.request.use(
  (config) => {
    // Try to get token from store first, then localStorage
    let token = store.getState().auth.token;
    
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
userAPI.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Only logout and redirect if we're on a protected route
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const publicPaths = ['/', '/login', '/signup', '/verify-otp', '/forgot-password'];
      const isPublicPath = publicPaths.some(path => currentPath === path || currentPath.startsWith(`${path}/`));
      
      if (!isPublicPath) {
        store.dispatch(logoutSuccess());
        
        if (typeof window !== 'undefined') {
          // Use router-friendly navigation instead of hard redirect
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
export default userAPI;
