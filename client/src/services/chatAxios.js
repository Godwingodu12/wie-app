import axios from 'axios';
import { store } from '../features/store';
import { logoutSuccess } from '../features/auth/authSlice';
const chatAPI = axios.create({
  baseURL: 'http://localhost:5004/api', // chat-service
  withCredentials: true,
});
chatAPI.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
chatAPI.interceptors.response.use(
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
export default chatAPI;