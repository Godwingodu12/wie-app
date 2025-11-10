import { publishToQueue } from '../rabbit/consumer.js';
import { isChannelAvailable } from '../rabbit/connection.js';
export const createNotification = async (notificationData) => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ not available, notification not sent:', notificationData);
    return { success: false, error: 'RabbitMQ not available' };
  }
  try {
    const response = await publishToQueue('notification-create', notificationData, 5000);
    if (response && response.success) {
      console.log('✅ Notification sent successfully:', response.notification?._id);
      return response;
    } else {
      console.error('❌ Failed to create notification:', response?.error);
      return response;
    }
  } catch (error) {
    console.error('❌ Error sending notification:', error.message);
    return { success: false, error: error.message };
  }
};
export const getNotifications = async (params) => {
  if (!isChannelAvailable()) {
    throw new Error('RabbitMQ not available');
  }
  try {
    const response = await publishToQueue('notification-get', params, 5000);
    return response;
  } catch (error) {
    console.error('❌ Error fetching notifications:', error.message);
    throw error;
  }
};
export const markNotificationAsRead = async (params) => {
  if (!isChannelAvailable()) {
    throw new Error('RabbitMQ not available');
  }
  try {
    const response = await publishToQueue('notification-mark-read', params, 5000);
    return response;
  } catch (error) {
    console.error('❌ Error marking notification as read:', error.message);
    throw error;
  }
};
export const markAllNotificationsAsRead = async (params) => {
  if (!isChannelAvailable()) {
    throw new Error('RabbitMQ not available');
  }

  try {
    const response = await publishToQueue('notification-mark-all-read', params, 5000);
    return response;
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error.message);
    throw error;
  }
};
export const deleteNotification = async (params) => {
  if (!isChannelAvailable()) {
    throw new Error('RabbitMQ not available');
  }
  try {
    const response = await publishToQueue('notification-delete', params, 5000);
    return response;
  } catch (error) {
    console.error('❌ Error deleting notification:', error.message);
    throw error;
  }
};