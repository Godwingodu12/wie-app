import axios from 'axios';
import { store } from '../features/store';
import { logoutSuccess } from '../features/auth/authSlice';
const ticketAPI = axios.create({
  baseURL: 'http://localhost:5003/api', // TICKET-service
  withCredentials: true,
});
ticketAPI.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
ticketAPI.interceptors.response.use(
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
export default ticketAPI;
