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
}
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
    const response = await api.post(`/auth/edit-profile`, formData);
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
export const getOtherProfile = async (otherId)=>{
  try{
    const res = await api.get(`/auth/other-profile/${otherId}`);
    return res.data;
  }catch(err){
    console.error('getOtherProfile error:',err);
    throw err;
  }
};
export const followUser = async (otherId) => {
  try {
    const res = await api.post(`/auth/follow/${otherId}`);
    return res.data;
  } catch (err) {
    console.error('followUser error:', err);
    throw err;
  }
};
export const unfollowUser = async (otherId) => {
  try {
    const res = await api.post(`/auth/unfollow/${otherId}`);
    return res.data;
  } catch (err) {
    console.error('unfollowUser error:', err);
    throw err;
  }
};
export const getFollowers = async (userId) => {
  try {
    const res = await api.get(`/auth/get-followers/${userId}`);
    return res.data;
  } catch (err) {
    console.error('getFollowers error:', err);
    throw err;
  }
};
export const getAllFollowers = async () => {
  try {
    const res = await api.get(`/auth/get-all-followers`);
    return res.data;
    } catch (err) {
    console.error('getAllFollowers error:', err);
    throw err;
  }
};
export const getAllFollowing = async () => {
  try {
    const res = await api.get(`/auth/get-all-following`);
    return res.data;
    } catch (err) {
    console.error('getAllFollowing error:', err);
    throw err;
  }
};
export const getFollowing = async (userId) => {
  try {
    const res = await api.get(`/auth/get-following/${userId}`);
    return res.data;
  } catch (err) {
    console.error('getFollowing error:', err);
    throw err;
  }
};
export const checkIsFollowing = async (otherId) => {
  try {
    const res = await api.get(`/auth/get-is-following/${otherId}`);
    return res.data
    } catch (err) {
    console.error('isFollowing error:', err);
    throw err;
  }
};
export const changePassword = async (data) => {
  try {
    const res = await api.post('/auth/change-password', data);
    return res.data;
    } catch (err) {
    console.error('changePassword error:', err);
    throw err;
  }
};
export const personalDetails = async (data) => {
  try {
    const response = await api.post(`/auth/personal-details`, data);
    return response.data;
  }
  catch (error) {
    console.error('personalDetails error in Backend:', error);
    throw error;
  }
};
export const getUserData = async () => {
  try {
    const res = await api.get('/auth/get-user-data');
    return res.data;
  } catch (err) {
    console.error('getUserData error:', err);
    throw err;
  }
};
export const getFollowersData = async (payload) => {
  try {
    const res = await api.get(`/auth/get-followers-data/${payload}`);
    return res.data;
  } catch (err) {
    console.error('getFollowersData error:', err);
    throw err;
  }
};
export const findAllActiveUsersService = async (userId,searchQuery) => {
  try {
    const res = await api.get(`/auth/find-all-active-users/${userId}/${searchQuery}`);
    return res.data;
  }catch (err) {
    console.error('findAllActiveUsersService error:', err);
    throw err;
  }
};
export const getFollowersService = async (userId) => {
  try {
    const res = await api.get(`/auth/get-followers-service/${userId}`);
    return res.data;
  }catch(err){
    console.error('getFollowersData error:',err);
    throw err;
  }
};

export const getFollowersDataHttp = async () => {
  try {
    const res = await api.get('/auth/get-followers-data');
    return res.data;
  }catch(err){
    console.error('getFollowersData error:',err);
    throw err;
  }
};
export const AllActiveUsers = async (query = '') => {
  try {
    const url = query 
      ? `/auth/users/active?query=${encodeURIComponent(query)}`
      : '/auth/users/active';
    const res = await api.get(url);
    return res.data;
  } catch (err) {
    console.error('AllActiveUsers error:', err);
    throw err;
  }
};
