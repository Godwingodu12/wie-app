import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '@/types';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true, // Start with loading: true
};

// Helper to set cookie
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof window !== 'undefined') {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }
};

// Helper to delete cookie
const deleteCookie = (name: string) => {
  if (typeof window !== 'undefined') {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        // Also set cookie for middleware
        setCookie('token', action.payload.token, 7);
      }
    },
    loginFailure: (state) => {
      state.loading = false;
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Also delete cookie
        deleteCookie('token');
      }
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(action.payload));
        const token = state.token || localStorage.getItem('token');
        if (token) {
          const expires = new Date();
          expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
          document.cookie = `token=${token};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
        }
      }
    },
    restoreAuth: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            state.token = token;
            state.user = JSON.parse(userStr);
            state.isAuthenticated = true;
            // Ensure cookie is also set
            setCookie('token', token, 7);
          } catch (e) {
            console.error('Failed to parse user from localStorage:', e);
            state.isAuthenticated = false;
          }
        } else {
          state.isAuthenticated = false;
        }
      }
      state.loading = false; // Important: set loading to false after restore
    },
  },
});
export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logoutSuccess,
  updateUser,
  restoreAuth,
} = authSlice.actions;

export default authSlice.reducer;