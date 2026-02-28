import Notification from '../models/notification.model.js';
import { emitToUser } from '../socket/socket.js';

export const createNotificationInternal = async (notificationData) => {
  const { userId, type, title, message, ticketId, groupId, eventName, metadata, bookingId } = notificationData;

  if (!userId || !type || !title || !message) {
    throw new Error(`createNotificationInternal: missing required fields — userId:${userId}, type:${type}, title:${title}, message:${message}`);
  }

  const notification = new Notification({
    userId,
    type,
    title,
    message,
    // ticketId is stored as ObjectId in schema — only set if it looks like a valid ObjectId
    ticketId:  ticketId  && ticketId.match(/^[a-f\d]{24}$/i)  ? ticketId  : undefined,
    groupId:   groupId   && groupId.match(/^[a-f\d]{24}$/i)   ? groupId   : undefined,
    eventName: eventName || undefined,
    metadata:  metadata  || undefined,
    bookingId: bookingId || undefined,
  });

  await notification.save();

  const unreadCount = await Notification.countDocuments({
    userId: notification.userId,
    isRead: false,
  });

  emitToUser(notification.userId.toString(), 'new-notification', {
    notification: notification.toObject(),
    unreadCount,
  });

  return notification;
};

export const createNotification = async (req, res) => {
  try {
    const notification = await createNotificationInternal(req.body);
    res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
// Get all notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { type, limit = 50, skip = 0 } = req.query;
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
    res.status(200).json({
      notifications,
      unreadCount,
      counts: {
        all: notifications.length,
        events: eventNotificationsCount,
        invites: inviteNotificationsCount
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};
// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    // Emit real-time update
    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });
    emitToUser(userId.toString(), 'notification-read', {
      notificationId,
      unreadCount
    });
    res.status(200).json({ 
      message: 'Notification marked as read', 
      notification 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};
// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    // Emit real-time update
    emitToUser(userId.toString(), 'all-notifications-read', {
      unreadCount: 0
    });
    res.status(200).json({ 
      message: 'All notifications marked as read' 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};
// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    // Emit real-time update
    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });
    emitToUser(userId.toString(), 'notification-deleted', {
      notificationId,
      unreadCount
    });
    res.status(200).json({ 
      message: 'Notification deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};
