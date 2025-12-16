'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  Ticket,
  ArrowLeft
} from 'lucide-react';
import {
  getUserNotifications,
  Notification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/notificationService';
import realtimeNotificationService from '@/services/realtimeNotificationService';

export default function NotificationPage() {
  useAuth(true);
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await loadNotifications();
      // Clear unread count on page open
      // Best-effort: mark all as read; ignore network/socket issues
      markAllNotificationsAsRead().catch((err) => {
        console.error('Failed to mark all notifications as read:', err);
      });
    };

    init();
  }, []);

  // Listen for real-time notification events while this page is open
  useEffect(() => {
    const handleNewNotification = (data: any) => {
      const mapped: Notification = {
        id: data.id || data._id,
        type: data.type,
        title: data.title,
        message: data.message,
        createdAt: data.createdAt,
        isRead: false,
        bookingId: data.bookingId ?? data.metadata?.bookingId,
        eventId: data.eventId,
        ticketId: data.ticketId,
        groupId: data.groupId,
        chatId: data.chatId,
        fromUserId: data.fromUserId,
        eventName: data.eventName,
        targetUrl: data.link,
        meta: data.metadata,
      };

      setNotifications((prev) => [mapped, ...prev]);
    };

    const handleNotificationRead = (data: any) => {
      const id = data.id || data._id;
      if (!id) return;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    };

    const handleAllNotificationsRead = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };

    const handleNotificationDeleted = (data: any) => {
      const id = data.id || data._id;
      if (!id) return;

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    realtimeNotificationService.on('new-notification', handleNewNotification);
    realtimeNotificationService.on('notification-read', handleNotificationRead);
    realtimeNotificationService.on('all-notifications-read', handleAllNotificationsRead);
    realtimeNotificationService.on('notification-deleted', handleNotificationDeleted);

    return () => {
      realtimeNotificationService.off('new-notification', handleNewNotification);
      realtimeNotificationService.off('notification-read', handleNotificationRead);
      realtimeNotificationService.off('all-notifications-read', handleAllNotificationsRead);
      realtimeNotificationService.off('notification-deleted', handleNotificationDeleted);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getUserNotifications();
      setNotifications(res.notifications || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    if (notification.type === 'BOOKING_CONFIRMED') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (notification.type === 'BOOKING_CANCELLED') {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    return <Bell className="w-5 h-5 text-blue-600" />;
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Figure out where to navigate
    const bookingId =
      notification.bookingId ||
      notification.meta?.bookingId ||
      (notification.meta as any)?.booking_id;

    const targetUrl = notification.targetUrl || (notification.meta as any)?.targetUrl;

    try {
      if (!notification.isRead) {
        // Fire-and-forget; if it fails we don't block navigation
        markNotificationAsRead(notification.id).catch(() => {});
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
      }

      if (bookingId) {
        router.push(`/bookings/${bookingId}`);
        return;
      }

      if (targetUrl) {
        router.push(targetUrl);
        return;
      }
    } catch {
      // Ignore navigation errors
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
           <button
        onClick={() => router.push('/home')}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Go back to home"
      >
        <ArrowLeft className="w-6 h-6 text-gray-700" />
      </button>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          </div>
        </div>

        {error && (
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          </Card>
        )}

        {notifications.length === 0 ? (
          <Card className="p-10 text-center">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No notifications yet
            </h2>
            <p className="text-gray-600">
              You&apos;ll see updates here when you book tickets or when an event is
              updated or cancelled.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-shadow hover:shadow-md ${
                  notification.isRead ? 'bg-white' : 'bg-blue-50'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="p-4 flex gap-3">
                  <div className="mt-1">{getNotificationIcon(notification)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{notification.message}</p>
                    {!notification.isRead && (
                      <span className="mt-2 inline-flex text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


