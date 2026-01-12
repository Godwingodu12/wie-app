import Notification from '../models/notification.model.js';
import { emitToUser } from '../socket/socket.js';

// Time window for grouping follow notifications (5 minutes)
const GROUPING_WINDOW_MS = 5 * 60 * 1000;

// Maximum actors to show in notification
const MAX_PRIMARY_ACTORS = 2;

const calculateActorPriority = (metadata) => {
  let priority = 0;
  
  // Mutual followers (highest priority)
  if (metadata.isMutual) priority += 1000;
  
  // Verified accounts
  if (metadata.isVerified) priority += 500;
  
  // High follower count (scale: 1M+ = 100 points)
  const followerCount = metadata.followerCount || 0;
  if (followerCount >= 1000000) priority += 100;
  else if (followerCount >= 100000) priority += 50;
  else if (followerCount >= 10000) priority += 25;
  
  // Recent timestamp (newer = slightly higher)
  const timestamp = new Date(metadata.timestamp || Date.now());
  priority += Math.floor(timestamp.getTime() / 1000000);
  
  return priority;
};

const buildFollowMessage = (notification) => {
  const { primaryActors, othersCount } = notification;
  
  if (!primaryActors || primaryActors.length === 0) {
    return 'Someone started following you';
  }
  
  const firstActor = primaryActors[0];
  const firstName = firstActor.username || firstActor.name || 'Someone';
  
  if (othersCount === 0 && primaryActors.length === 1) {
    // Single follower
    return `${firstName} started following you`;
  } else if (othersCount === 0 && primaryActors.length === 2) {
    // Two followers
    const secondName = primaryActors[1].username || primaryActors[1].name || 'someone';
    return `${firstName} and ${secondName} started following you`;
  } else if (othersCount === 1) {
    // firstName + 1 other
    return `${firstName} and 1 other started following you`;
  } else {
    // firstName + N others
    return `${firstName} and ${othersCount} others started following you`;
  }
};

const handleFollowNotification = async (payload) => {
  const { userId, fromUserId, metadata = {}, link } = payload;
  
  const today = new Date().toISOString().split('T')[0];
  const groupKey = `follow_${userId}_${today}`;
  const cutoffTime = new Date(Date.now() - GROUPING_WINDOW_MS);
  
  let existingNotification = await Notification.findOne({
    userId,
    type: 'following',
    groupKey,
    isGrouped: true,
    lastUpdatedAt: { $gte: cutoffTime }
  });
  
  const actorPriority = calculateActorPriority(metadata);
  
  const actorData = {
    actorId: fromUserId,
    name: metadata.followerName,
    username: metadata.followerUsername,
    profilePicture: metadata.followerProfilePicture,
    isVerified: metadata.isVerified || false,
    isMutual: metadata.isMutual || false,
    followerCount: metadata.followerCount || 0,
    priority: actorPriority
  };
  
  if (existingNotification) {
    if (!existingNotification.actorIds.includes(fromUserId)) {
      existingNotification.actorIds.push(fromUserId);
      
      const allActors = [...existingNotification.primaryActors, actorData];
      allActors.sort((a, b) => b.priority - a.priority);
      
      existingNotification.primaryActors = allActors.slice(0, MAX_PRIMARY_ACTORS);
      existingNotification.othersCount = Math.max(0, allActors.length - MAX_PRIMARY_ACTORS);
      existingNotification.message = buildFollowMessage(existingNotification);
      existingNotification.lastUpdatedAt = new Date();
      existingNotification.isRead = false; 
      
      await existingNotification.save();
      
      const unreadCount = await Notification.countDocuments({ 
        userId, 
        isRead: false 
      });
      
      const emitted = emitToUser(userId.toString(), 'new-notification', {
        notification: existingNotification.toObject(),
        unreadCount
      });
      
      if (!emitted) {
        console.log('⚠️ User not connected, notification updated but not emitted');
      }
    }
    
    return existingNotification;
  } else {
    const notification = await Notification.create({
      userId,
      type: 'following',
      title: 'New Follower',
      message: `${metadata.followerUsername || metadata.followerName} started following you`,
      fromUserId,
      link: link || `/profile/${metadata.followerUsername || fromUserId}`,
      isGrouped: true,
      groupKey,
      actorIds: [fromUserId],
      primaryActors: [actorData],
      othersCount: 0,
      metadata,
      lastUpdatedAt: new Date()
    });
    
    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });
    
    const emitted = emitToUser(userId.toString(), 'new-notification', {
      notification: notification.toObject(),
      unreadCount
    });

    if (!emitted) {
      console.log('⚠️ User not connected, notification saved but not emitted');
    }
    
    return notification;
  }
};

export const createNotificationHandler = async (notificationData) => {
  try {
    // Special handling ONLY for follow notifications
    if (notificationData.type === 'following') {
      return await handleFollowNotification(notificationData);
    }
    
    // Standard notification creation for all other types
    const notification = new Notification(notificationData);
    await notification.save();    
    
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

    // IMPORTANT: Sort by lastUpdatedAt first for grouped notifications
    const notifications = await Notification.find(query)
      .sort({ lastUpdatedAt: -1, createdAt: -1 })
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

// Get detailed follower list for a grouped notification
export const getGroupedFollowersHandler = async (payload) => {
  const { notificationId, userId, page = 1, limit = 20 } = payload;
  
  const notification = await Notification.findOne({
    _id: notificationId,
    userId,
    type: 'following',
    isGrouped: true
  });
  
  if (!notification) {
    throw new Error('Notification not found');
  }
  
  const skip = (page - 1) * limit;
  const actorIds = notification.actorIds || [];
  
  const paginatedActorIds = actorIds.slice(skip, skip + limit);
  
  return {
    notificationId,
    actorIds: paginatedActorIds,
    total: actorIds.length,
    page,
    totalPages: Math.ceil(actorIds.length / limit)
  };
};
