import axios from 'axios';
import { store } from '../features/store';
import { logoutSuccess } from '../features/auth/authSlice';

const userAPI = axios.create({
  baseURL: 'http://localhost:5002/api', // user-service
  withCredentials: true,
});

userAPI.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

userAPI.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.log("log")
      store.dispatch(logoutSuccess());
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default userAPI;