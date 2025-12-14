import axios, { AxiosError } from 'axios';
import { store } from '../features/store';
import { logoutSuccess } from '../features/auth/authSlice';
const ticketUserAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5005/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Request interceptor
ticketUserAPI.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
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
ticketUserAPI.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      store.dispatch(logoutSuccess());
      
      // Redirect to login only on client side
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default ticketUserAPI;
