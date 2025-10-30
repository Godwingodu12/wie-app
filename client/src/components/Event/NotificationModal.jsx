import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../../services/notificationService';

const NotificationModal = ({ isOpen, onClose, isDark = true }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [counts, setCounts] = useState({ all: 0, events: 0, invites: 0 });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, activeTab]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications(activeTab);
      setNotifications(data.notifications || []);
      setCounts(data.counts || { all: 0, events: 0, invites: 0 });
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'event_created':
        return '🎉';
      case 'event_hosted':
        return '🚀';
      case 'event_invite':
        return '✉️';
      case 'general':
        return '📢';
      default:
        return '🔔';
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await handleMarkAsRead(notification._id);
      }
      onClose();
      // Navigate based on notification type
      if (notification.type === 'event_created' || notification.type === 'event_hosted') {
        // Navigate to event detail page
        if (notification.ticketId) {
          navigate(`/ticket/view-single-event/${notification.ticketId}`);
        } else {
          navigate('/ticket/view-events');
        }
      // } else if (notification.type === 'event_hosted') {
      //   if (notification.ticketId) {
      //     navigate(`/ticket/view-single-event/${notification.ticketId}`);
      //   } else {
      //     navigate('/ticket/live-events');
      //   }
      } else if (notification.type === 'event_invite') {
        // Navigate to event detail page or invitations page
        if (notification.ticketId) {
          navigate(`/ticket/view-single-event/${notification.ticketId}`);
        } else {
          // Fallback to invitations/events page if no ticketId
          navigate('/ticket/live-events');
        }
      } else if (notification.type === 'general') {
        if (notification.ticketId) {
          navigate(`/ticket/view-single-event/${notification.ticketId}`);
        } else if (notification.groupId) {
          navigate(`/ticket/group/${notification.groupId}`);
        }
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTabCount = (tab) => {
    switch (tab) {
      case 'all':
        return unreadCount;
      case 'events':
        return notifications.filter(n => 
          ['event_created', 'event_hosted'].includes(n.type) && !n.isRead
        ).length;
      case 'invites':
        return notifications.filter(n => 
          n.type === 'event_invite' && !n.isRead
        ).length;
      default:
        return 0;
    }
  };

  const getFilteredNotifications = () => {
    console.log('All notifications:', notifications);
    console.log('Active tab:', activeTab);
    
    if (activeTab === 'all') return notifications;
    if (activeTab === 'events') {
      const filtered = notifications.filter(n => 
        ['event_created', 'event_hosted'].includes(n.type)
      );
      console.log('Filtered events:', filtered);
      return filtered;
    }
    if (activeTab === 'invites') {
      const filtered = notifications.filter(n => n.type === 'event_invite');
      console.log('Filtered invites:', filtered);
      return filtered;
    }
    return notifications;
  };

  const formatDate = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInSeconds = Math.floor((now - notifDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return notifDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!isOpen) return null;

  const theme = isDark ? {
    bg: 'bg-[#212426]',
    text: 'text-white',
    subText: 'text-[#c9c9cf]',
    border: 'border-[#23233a]',
    hover: 'hover:bg-[#2a2d2f]',
    unreadBg: 'bg-[#2a2d2f]'
  } : {
    bg: 'bg-white',
    text: 'text-gray-900',
    subText: 'text-gray-600',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-50',
    unreadBg: 'bg-gray-50'
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div 
        className={`relative w-full max-w-[486px] h-full max-h-[1024px] ${theme.bg} rounded-3xl shadow-2xl overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className={`text-2xl font-bold ${theme.text}`}>Notifications</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${theme.hover} transition-colors`}
          >
            <X className={`w-6 h-6 ${theme.text}`} />
          </button>
        </div>

        {/* Gradient Line */}
        <div 
          className="h-px mx-6"
          style={{
            background: isDark
              ? 'linear-gradient(90deg, #212426 0%, #909293 50%, #212426 100%)'
              : 'linear-gradient(90deg, #f0f2f5 0%, #909293 50%, #f0f2f5 100%)'
          }}
        />

        {/* Tabs */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 transition-colors ${
              activeTab === 'all' ? theme.text : theme.subText
            }`}
          >
            <span className="text-sm font-normal">View all</span>
            {getTabCount('all') > 0 && (
              <span className="px-2.5 py-0.5 bg-[#5E5CE6] text-white text-xs rounded-full min-w-[28px] text-center">
                {getTabCount('all')}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 transition-colors ${
              activeTab === 'events' ? theme.text : theme.subText
            }`}
          >
            <span className="text-sm font-normal">Events</span>
            {getTabCount('events') > 0 && (
              <span className="px-2.5 py-0.5 bg-[#5E5CE6] text-white text-xs rounded-full min-w-[28px] text-center">
                {getTabCount('events')}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('invites')}
            className={`flex items-center gap-2 transition-colors ${
              activeTab === 'invites' ? theme.text : theme.subText
            }`}
          >
            <span className="text-sm font-normal">Invites</span>
            {getTabCount('invites') > 0 && (
              <span className="px-2.5 py-0.5 bg-[#5E5CE6] text-white text-xs rounded-full min-w-[28px] text-center">
                {getTabCount('invites')}
              </span>
            )}
          </button>
        </div>

        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <div className="px-6 pb-2">
            <button
              onClick={handleMarkAllAsRead}
              className={`text-xs ${theme.subText} hover:text-[#5E5CE6] transition-colors`}
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
          {loading ? (
            <div className={`text-center py-12 ${theme.subText}`}>
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className={`text-center py-12 ${theme.subText}`}>
              <div className="text-4xl mb-4">🔔</div>
              <p>No notifications yet</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`relative p-4 rounded-2xl transition-all cursor-pointer ${
                  notification.isRead ? theme.bg : theme.unreadBg
                } ${theme.hover} ${theme.border} border hover:scale-[1.02]`}
                style={{ minHeight: '70px' }}
              >
                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="absolute top-4 right-4 w-3 h-3 bg-[#5E5CE6] rounded-full" />
                )}

                <div className="flex flex-col gap-1 pr-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    <div className={`font-semibold text-sm ${theme.text}`}>
                      {notification.title}
                    </div>
                  </div>
                  <div className={`text-sm ${theme.subText}`}>
                    {notification.message}
                  </div>
                  <div className={`text-xs ${theme.subText} mt-1`}>
                    {formatDate(notification.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default NotificationModal;