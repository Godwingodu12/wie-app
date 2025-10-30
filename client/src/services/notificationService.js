import api from "./notificationAxios";
export const getNotifications = async (type = 'all', limit = 50, skip = 0) => {
  const response = await api.get('notification/get-notifications', {
    params: { type, limit, skip }
  });
  return response.data;
};
export const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(`notification/notification-read/${notificationId}`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch('notification/mark-all-read');
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`notification/delete-notification/${notificationId}`);
  return response.data;
};