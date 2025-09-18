import api from "./axios.js";
import userAPI from "./userAxiox.js";
export const uploadProfileImage = (formData) =>
  userAPI.put('/user/profile-image', formData);
export const getMe = async () => {
  try {
    const res = await userAPI.get('/user/me');
    console.log("hiiii")
    return res
  } catch (error) {
    console.error('getMe error:', error);
    return {
      data: null,
      error: error.response?.data?.message || 'Something went wrong',
    };
  }
};
export const updateProfile = async (profileData) => {
  try {
    const res = await userAPI.post('/user/update-profile', profileData);
    return res;
  } catch (error) {
    console.error('updateProfile error:', error);
    return {
      data: null,
      error: error.response?.data?.message || 'Something went wrong',
    };
  }
};  
