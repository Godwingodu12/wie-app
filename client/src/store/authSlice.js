import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
  },
  reducers: {
    loginSuccess: (state, action) => {
      console.log("Redux loginSuccess called with:", action.payload);
      
      // Handle both formats: { token, user } OR just token
      if (action.payload.token && action.payload.user) {
        // Format from OTP page
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      } else if (typeof action.payload === 'string') {
        // Format from Login page (just token string)
        state.token = action.payload;
        localStorage.setItem('token', action.payload);
      }
    },
    setUser: (state, action) => {
      console.log("Redux setUser called with:", action.payload);
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    logoutSuccess: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});
export const { loginSuccess, setUser, logoutSuccess } = authSlice.actions;
export default authSlice.reducer;