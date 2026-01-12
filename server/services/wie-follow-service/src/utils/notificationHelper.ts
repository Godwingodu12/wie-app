import { sendRPC, publishToQueue } from '../rabbit/producer';
import { isChannelAvailable } from '../rabbit/connection';
export const createNotification = async (payload: {
  userId: string;              // receiver
  type: string;                // 'following', 'like', 'comment', etc.
  title: string;
  message: string;
  fromUserId?: string;
  metadata?: Record<string, any>;
  link?: string;
}) => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ channel not available. Skipping notification.');
    return { success: false, error: 'RabbitMQ not available' };
  }
  try {
    return await sendRPC('notification-create', payload);
  } catch (error: unknown) {
    console.error('Error creating notification:', error);
    const message =error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: message };
  }
};
/**
 * Get notifications for a user
 */
export const getNotifications = async (payload: {
  userId: string;
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) => {
  if (!isChannelAvailable()) {
    throw new Error('RabbitMQ channel not available');
  }

  return sendRPC('notification-get', payload);
};

/**
 * Get detailed follower list from a grouped notification
 */
export const getGroupedFollowers = async (payload: {
  notificationId: string;
  userId: string;
  page?: number;
  limit?: number;
}) => {
  if (!isChannelAvailable()) {
    throw new Error('RabbitMQ channel not available');
  }

  return sendRPC('notification-grouped-followers', payload);
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (payload: {
  notificationId: string;
  userId: string;
}) => {
  if (!isChannelAvailable()) {
    throw new Error('RabbitMQ channel not available');
  }

  return sendRPC('notification-mark-read', payload);
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (payload: {
  userId: string;
}) => {
  if (!isChannelAvailable()) {
    throw new Error('RabbitMQ channel not available');
  }

  return sendRPC('notification-mark-all-read', payload);
};

/**
 * Delete a notification
 */
export const deleteNotification = async (payload: {
  notificationId: string;
  userId: string;
}) => {
  if (!isChannelAvailable()) {
    throw new Error('RabbitMQ channel not available');
  }

  return sendRPC('notification-delete', payload);
};

/**
 * Fire-and-forget follower event (for analytics / realtime / batching)
 */
export const emitFollowEvent = async (payload: {
  followerId: string;
  followingId: string;
  timestamp?: string;
}) => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ channel not available. Event not published.');
    return;
  }

  try {
    await publishToQueue('follow.created', {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error emitting follow event:', error);
  }
};