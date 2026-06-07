// import { createSlice } from '@reduxjs/toolkit';
// import jwt_decode from 'jwt-decode';

// const token = localStorage.getItem('token');
// let user = null;
// if (token) {
//   try {
//     user = jwt_decode(token);
//   } catch (e) {
//     localStorage.removeItem('token');
//   }
// }

// const initialState = {
//   token: token || null,
//   user: user || null,
// };

// const authSlice = createSlice({
//   name: 'auth',
//   initialState,
//   reducers: {
//     loginSuccess: (state, action) => {
//       state.token = action.payload;
//       state.user = jwt_decode(action.payload);
//       localStorage.setItem('token', action.payload);
//     },
//     logout: (state) => {
//       state.token = null;
//       state.user = null;
//       localStorage.removeItem('token');
//     },
//   },
// });

// export const { loginSuccess, logout } = authSlice.actions;
// export default authSlice.reducer;


import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    logoutSuccess: (state) => {
      state.token = null;
      state.user = null;
    },
  },
});

export const { loginSuccess, setUser, logoutSuccess } = authSlice.actions;
export default authSlice.reducer;
