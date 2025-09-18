import api from './axios';
export const getIndex = async()=>{
  try {
    const res = await api.get('/auth/index');
    console.log('getIndex is working:');
  } catch (err) {
    console.error('getIndex error:', err);
    throw err;
  }
}
export const loginUser = async (data) => {
  try {
    const res = await api.post('/auth/login', data);
    return res.data;
  } catch (err) {
    console.error('loginUser error:', err);
    throw err;
  
}
};
export const registerAdmin = async (formData) => {
  try {
    const res = await api.post('/auth/adminsignup', formData);
    return res.data;
  } catch (err) {
    console.error('registerAdmin error:', err);
    throw err;
  }
};
export const registerOrganisation = async (formData) => {
  try {
    const res = await api.post('/auth/organisationsignup', formData);
    return res.data;
  } catch (err) {
    console.error('registerOrganisation error:', err);
    throw err;
  }
};
export const verifyOtp = async (data) => {
  try {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  } catch (err) {
    console.error('verifyOtp error:', err);
    throw err;
  }
};
export const logout = () => {
  return api.post('/auth/logout');
};
export const forgotPassword = async (data) => {
  try {
    const res = await api.post('/auth/forgot-password', data); // data = { email } or { contact_no }
    return res.data;
  } catch (err) {
    console.error('forgotPassword error:', err);
    throw err;
  }
};
export const resendOtp = async (data) => {
  try {
    const response = await api.post('/auth/resend-otp', data);
    return response; // Return full response object, not just response.data
  } catch (err) {
    console.error('resendOtp error:', err);
    throw err;
  }
};

export const verifyUser = async (payload) => {
  try {
    const res = await api.post('/auth/verify-user', payload);
    return res.data;
  } catch (err) {
    console.error('verifyUser error:', err);
    throw err;
  }
};
export const resetPassword = async (resetData) => {
  try {
    const res = await api.post('/auth/reset-password', resetData);
    return res.data;
  } catch (err) {
    console.error('resetPassword error:', err);
    throw err;
  }
};
export const findAllActiveUsers = async () => {
  try {
    const res = await api.get('/auth/active-users');
    return res.data;
  } catch (err) {
    console.error('findAllActiveUsers error:', err);
    throw err;
  }
};
export const editProfile = async (formData) => {
  try {
    const response = await api.post('/auth/edit-profile', formData);
    return response.data;
  } catch (err) {
    console.error('editProfile error:', err);
    throw err;
  }
};
export const viewAllUsers = async () => {
  try {
    const res = await api.get('/auth/view-all-users');
    return res.data;
  } catch (err) {
    console.error('viewAllUsers error:', err);
    throw err;
  }
};
