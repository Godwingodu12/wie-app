import axios from 'axios';
import { store } from '../features/store';
import { logoutSuccess } from '../features/auth/authSlice';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Change to your backend URL
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      store.dispatch(logoutSuccess());
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
