import axios from 'axios';
import { store } from '../features/store';
import { logoutSuccess } from '../features/auth/authSlice';
const notificationAPI = axios.create({
  baseURL: 'http://localhost:5006/api', // TICKET-service
  withCredentials: true,
});
notificationAPI.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
notificationAPI.interceptors.response.use(
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

export default notificationAPI;
