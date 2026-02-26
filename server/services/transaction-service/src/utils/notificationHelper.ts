import { sendRPC, publishToQueue } from '../rabbit/producer';
import { isChannelAvailable } from '../rabbit/connection';

interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  bookingId?: string;
  ticketId?: string;
  eventId?: string;
  groupId?: string;
  link?: string;
  metadata?: Record<string, any>;
}

interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  bookingId?: string; // Changed to string
  ticketId?: string;
  link?: string;
}
export const createNotification = async (payload: NotificationPayload): Promise<void> => {
  try {
    // ✅ Ensure all IDs are strings
    const sanitizedPayload = {
      ...payload,
      userId: String(payload.userId),
      bookingId: payload.bookingId ? String(payload.bookingId) : undefined,
      ticketId: payload.ticketId ? String(payload.ticketId) : undefined,
    };

    await sendRPC('notification-create', sanitizedPayload, 5000);
  } catch (error: any) {
    console.error('❌ Error sending notification:', error.message);
    // Don't throw - notification failure shouldn't break the main flow
  }
};
export const getNotifications = async (params: {
  userId: string;
  limit?: number;
  skip?: number;
}): Promise<any> => {
  if (!isChannelAvailable()) {
    throw new Error('RabbitMQ not available');
  }

  try {
    const response = await publishToQueue('notification-get', params, 5000);
    return response;
  } catch (error: any) {
    console.error('❌ Error fetching notifications:', error.message);
    throw error;
  }
};

export const markNotificationAsRead = async (params: {
  notificationId: string;
  userId: string;
}): Promise<any> => {
  if (!isChannelAvailable()) {
    throw new Error('RabbitMQ not available');
  }

  try {
    const response = await publishToQueue('notification-mark-read', params, 5000);
    return response;
  } catch (error: any) {
    console.error('❌ Error marking notification as read:', error.message);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (params: {
  userId: string;
}): Promise<any> => {
  if (!isChannelAvailable()) {
    throw new Error('RabbitMQ not available');
  }

  try {
    const response = await publishToQueue('notification-mark-all-read', params, 5000);
    return response;
  } catch (error: any) {
    console.error('❌ Error marking all notifications as read:', error.message);
    throw error;
  }
};

export const deleteNotification = async (params: {
  notificationId: string;
  userId: string;
}): Promise<any> => {
  if (!isChannelAvailable()) {
    throw new Error('RabbitMQ not available');
  }

  try {
    const response = await publishToQueue('notification-delete', params, 5000);
    return response;
  } catch (error: any) {
    console.error('❌ Error deleting notification:', error.message);
    throw error;
  }
};
