import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: null,
    user: null,
    isAuthenticated: false,
  },
  reducers: {
    loginSuccess: (state, action) => {
      console.log("Redux loginSuccess called with:", action.payload);
      
      // Handle both formats: { token, user } OR just token
      if (action.payload.token && action.payload.user) {
        // Format from OTP page
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        
        // Keep localStorage for backward compatibility
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      } else if (typeof action.payload === 'string') {
        // Format from Login page (just token string)
        state.token = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem('token', action.payload);
      }
    },
    setUser: (state, action) => {
      console.log("Redux setUser called with:", action.payload);
      state.user = action.payload;
      if (action.payload) {
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload));
      }
    },
    setToken: (state, action) => {
      state.token = action.payload;
      if (action.payload) {
        state.isAuthenticated = true;
        localStorage.setItem('token', action.payload);
      }
    },
    logoutSuccess: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('userData');
      sessionStorage.removeItem('userImage');
    },
  },
});
export const { loginSuccess, setUser, setToken, logoutSuccess } = authSlice.actions;
export default authSlice.reducer;
