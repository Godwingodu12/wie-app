import api from "./axios";
export const getAllUsers = () => api.get('/admin/users');
export const blockUser = (id) => api.put(`/admin/block/${id}`);
export const unblockUser = (id) => api.put(`/admin/unblock/${id}`);
