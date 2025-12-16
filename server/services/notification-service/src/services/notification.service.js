import Notification from '../models/notification.model.js';
import { emitToUser } from '../socket/socket.js';
export const createNotificationHandler = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();    
    // Emit real-time notification to the user via Socket.IO
    const emitted = emitToUser(notification.userId.toString(), 'new-notification', {
      notification: notification.toObject(),
      unreadCount: await Notification.countDocuments({ 
        userId: notification.userId, 
        isRead: false 
      })
    });
    
    if (!emitted) {
      console.log('⚠️ User not connected, notification saved but not emitted');
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notifications handler (called by RabbitMQ)
export const getNotificationsHandler = async ({ userId, type, limit = 50, skip = 0 }) => {
  try {
    const query = { userId };
    if (type && type !== 'all') {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });

    const eventNotificationsCount = await Notification.countDocuments({
      userId,
      type: { $in: ['event_created', 'event_hosted', 'event_recovered'] }
    });

    const inviteNotificationsCount = await Notification.countDocuments({
      userId,
      type: 'event_invite'
    });

    return {
      notifications,
      unreadCount,
      counts: {
        all: notifications.length,
        events: eventNotificationsCount,
        invites: inviteNotificationsCount
      }
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Mark notification as read handler (called by RabbitMQ)
export const markAsReadHandler = async ({ userId, notificationId }) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    // Emit real-time update to the user
    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });
    
    emitToUser(userId.toString(), 'notification-read', {
      notificationId,
      unreadCount
    });

    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all as read handler (called by RabbitMQ)
export const markAllAsReadHandler = async ({ userId }) => {
  try {
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    // Emit real-time update to the user
    emitToUser(userId.toString(), 'all-notifications-read', {
      unreadCount: 0
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete notification handler (called by RabbitMQ)
export const deleteNotificationHandler = async ({ userId, notificationId }) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    // Emit real-time update to the user
    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });
    
    emitToUser(userId.toString(), 'notification-deleted', {
      notificationId,
      unreadCount
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};
