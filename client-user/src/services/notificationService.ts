import axios from 'axios';
const NOTIFICATION_API_URL =
  process.env.NEXT_PUBLIC_NOTIFICATION_API_URL ||
  'http://localhost:5006/api/notification';
// Ensure the URL doesn't have trailing slash
const baseURL = NOTIFICATION_API_URL.replace(/\/$/, '');
// Create axios instance
const notificationApi = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});
// Add auth token to requests (same pattern as other services)
notificationApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);
notificationApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config) {
      const fullUrl = error.config.baseURL + error.config.url;
      console.error(`❌ Notification API Error [${error.config.method?.toUpperCase()} ${fullUrl}]:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        code: error.code,
      });
    } else {
      console.error('Notification API Error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// Types should match backend notification.model.js
export type NotificationType =
  | 'event_created'
  | 'group_updated'
  | 'event_hosted'
  | 'event_recovered'
  | 'event_invite'
  | 'event_cancelled'
  | 'event_rehosted'
  | 'event_completed'
  | 'event_updated'
  | 'ticket_purchased'
  | 'ticket_cancelled'
  | 'message_received'
  | 'follow_request'
  | 'follow_accepted'
  | 'comment'
  | 'like'
  | 'mention'
  | 'system'
  | 'booking_confirmed'
  | 'booking_pending'
  | 'payment_success'
  | 'payment_failed'
  | 'payment_processing'
  | 'booking_cancelled'
  | 'refund_initiated'
  | 'refund_processing'
  | 'refund_completed'
  | 'refund_failed'
  | 'event_reminder'
  | 'ticket_verified'
  | 'qr_code_generated'
  | 'following'
  | string;

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  updatedAt?: string;  
  isRead: boolean;
  // Optional fields from backend
  bookingId?: string;
  eventId?: string;
  ticketId?: string;
  groupId?: string;
  chatId?: string;
  fromUserId?: string;
  eventName?: string;
  targetUrl?: string; // mapped from `link`
  meta?: {
    bookingId?: string;
    userAvatar?: string;
    // Follow notification grouping fields
    isGrouped?: boolean;
    groupKey?: string;
    primaryActors?: Array<{
      actorId: string;
      name?: string;
      username?: string;
      profilePicture?: string;
      isVerified?: boolean;
      isMutual?: boolean;
      followerCount?: number;
      priority?: number;
    }>;
    actorIds?: string[];
    othersCount?: number;
    // Generic metadata
    [key: string]: any;
  };
}

export interface NotificationCounts {
  all: number;
  events: number;
  invites: number;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
  counts: NotificationCounts;
}

// Map backend notification shape (Mongo) to frontend Notification interface
const mapNotification = (raw: any): Notification => {
  return {
    id: raw.id || raw._id,
    type: raw.type,
    title: raw.title,
    message: raw.message,
    createdAt: raw.createdAt,
    isRead: raw.isRead,
    bookingId: raw.bookingId ?? raw.metadata?.bookingId,
    eventId: raw.eventId,
    ticketId: raw.ticketId,
    groupId: raw.groupId,
    chatId: raw.chatId,
    fromUserId: raw.fromUserId,
    eventName: raw.eventName,
    targetUrl: raw.link,
    meta: {
      ...raw.metadata,
      // Map follow notification grouping fields
      isGrouped: raw.isGrouped,
      groupKey: raw.groupKey,
      primaryActors: raw.primaryActors,
      actorIds: raw.actorIds,
      othersCount: raw.othersCount,
    },
  };
};

// Get all notifications for the logged-in user
export const getUserNotifications = async (params?: {
  type?: string;
  limit?: number;
  skip?: number;
}): Promise<NotificationListResponse> => {
  const response = await notificationApi.get('/get-notifications', { params });
  const data = response.data || {};

  const notifications = Array.isArray(data.notifications)
    ? data.notifications.map(mapNotification)
    : [];

  return {
    notifications,
    unreadCount: data.unreadCount ?? 0,
    counts: data.counts || {
      all: notifications.length,
      events: 0,
      invites: 0,
    },
  };
};

// Mark a single notification as read
export const markNotificationAsRead = async (notificationId: string) => {
    const response = await notificationApi.patch(`/notification-read/${notificationId}`);
    return response.data;
};
// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
    const response = await notificationApi.patch('/mark-all-read');
    return response.data;
};
export default notificationApi;
