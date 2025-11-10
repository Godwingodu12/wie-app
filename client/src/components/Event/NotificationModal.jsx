import React, { useState, useEffect, useCallback } from "react";
import { X, Phone, Bell, CalendarDays, AlertTriangle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notificationService";
import notificationService from "../../context/notificationService";

const NotificationModal = ({ isOpen, onClose, isDark = true }) => {
  const navigate = useNavigate();
  const [allNotifications, setAllNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isOpen) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getNotifications('all', 50, 0);
      console.log('📬 Fetched notifications:', response);
      
      // Handle different response structures
      const notifications = response?.notifications || response?.data?.notifications || response?.data || [];
      
      setAllNotifications(Array.isArray(notifications) ? notifications : []);
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
      setError(error.message || "Failed to load notifications");
      setAllNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  // Initial fetch when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Listen for real-time notification updates
  useEffect(() => {
    if (!isOpen) return;

    // Handler for new notifications
    const handleNewNotification = (data) => {
      console.log('📬 Real-time notification received:', data);
      
      // Add new notification to the top of the list
      setAllNotifications(prev => [data.notification || data, ...prev]);
    };

    // Handler for notification read
    const handleNotificationRead = (data) => {
      console.log('✅ Notification marked as read:', data);
      
      setAllNotifications(prev =>
        prev.map(notif =>
          notif._id === data.notificationId ? { ...notif, isRead: true } : notif
        )
      );
    };

    // Handler for all notifications read
    const handleAllNotificationsRead = () => {
      console.log('✅ All notifications marked as read');
      
      setAllNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    };

    // Handler for notification deleted
    const handleNotificationDeleted = (data) => {
      console.log('🗑️ Notification deleted:', data);
      
      setAllNotifications(prev =>
        prev.filter(notif => notif._id !== data.notificationId)
      );
    };

    // Subscribe to real-time events
    notificationService.on('new-notification', handleNewNotification);
    notificationService.on('notification-read', handleNotificationRead);
    notificationService.on('all-notifications-read', handleAllNotificationsRead);
    notificationService.on('notification-deleted', handleNotificationDeleted);

    // Cleanup subscriptions
    return () => {
      notificationService.off('new-notification', handleNewNotification);
      notificationService.off('notification-read', handleNotificationRead);
      notificationService.off('all-notifications-read', handleAllNotificationsRead);
      notificationService.off('notification-deleted', handleNotificationDeleted);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Update local state (real-time event will also update it)
      setAllNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("❌ Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if unread
      if (!notification.isRead) {
        await handleMarkAsRead(notification._id);
      }

      // Navigate based on notification type
      if (
        notification.type === "event_created" ||
        notification.type === "event_hosted"
      ) {
        if (notification.ticketId) {
          navigate(`/ticket/view-single-event/${notification.ticketId}`);
          onClose();
        } else {
          navigate("/ticket/view-events");
          onClose();
        }
      } else if (notification.type === "event_invite") {
        if (notification.ticketId) {
          navigate(`/ticket/view-single-event/${notification.ticketId}`);
          onClose();
        } else {
          navigate("/ticket/live-events");
          onClose();
        }
      } else if (notification.type === "general") {
        if (notification.ticketId) {
          navigate(`/ticket/view-single-event/${notification.ticketId}`);
          onClose();
        } else if (notification.groupId) {
          navigate(`/ticket/group/${notification.groupId}`);
          onClose();
        }
      }
    } catch (error) {
      console.error("❌ Error handling notification click:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      
      // Update local state (real-time event will also update it)
      setAllNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error("❌ Error marking all as read:", error);
    }
  };

  const getTabCount = (tab) => {
    const unreadNotifications = allNotifications.filter(n => !n.isRead);
    
    if (tab === "all") {
      return unreadNotifications.length;
    }
    if (tab === "events") {
      return unreadNotifications.filter(n =>
        ["event_created", "event_hosted"].includes(n.type)
      ).length;
    }
    if (tab === "invites") {
      return unreadNotifications.filter(n => n.type === "event_invite").length;
    }
    return 0;
  };

  const getFilteredNotifications = () => {
    if (activeTab === "all") return allNotifications;
    if (activeTab === "events") {
      return allNotifications.filter(n =>
        ["event_created", "event_hosted"].includes(n.type)
      );
    }
    if (activeTab === "invites") {
      return allNotifications.filter(n => n.type === "event_invite");
    }
    return allNotifications;
  };

  const theme = isDark
    ? {
        bg: "bg-[#212426]",
        text: "text-white",
        subText: "text-[#c9c9cf]",
        border: "border-gray-800",
        hover: "hover:bg-[#2a2d2f]",
        unreadBg: "bg-[#2a2d2f]",
      }
    : {
        bg: "bg-white",
        text: "text-gray-900",
        subText: "text-gray-600",
        border: "border-gray-200",
        hover: "hover:bg-gray-50",
        unreadBg: "bg-gray-50",
      };

  const filteredNotifications = getFilteredNotifications();

  const handleAcceptInvite = async (notificationId) => {
    console.log(`Accepted invite for notification ID: ${notificationId}`);
    // TODO: Implement accept invite API call
    // await acceptInvite(notificationId);
    // fetchNotifications();
  };

  const handleDeclineInvite = async (notificationId) => {
    console.log(`Declined invite for notification ID: ${notificationId}`);
    // TODO: Implement decline invite API call
    // await declineInvite(notificationId);
    // fetchNotifications();
  };

  const handleViewEvent = (notification) => {
    handleNotificationClick(notification);
  };

  const ActionButton = ({
    children,
    variant = "secondary",
    hasBorder = true,
    ...props
  }) => {
    const baseStyle =
      "w-fit h-8 rounded-full py-2 px-5 text-sm font-medium transition-colors flex items-center justify-center";
    const variants = {
      primary: "bg-[#5E5CE6] text-white hover:bg-[#5048c7]",
      secondary: "bg-[#44444D] text-gray-300 hover:bg-[#525259]",
    };
    const boxShadowStyle =
      "0px 0px 0px 1px #2B2D43, 0px 4px 6px 0px #00000024, 0px 9px 14px -5px #FFFFFF4D inset";
    const borderImageStyle =
      "linear-gradient(0deg, rgba(255, 255, 255, 0) -8.33%, rgba(255, 255, 255, 0.5) 183.33%) 1";

    return (
      <button
        className={`${baseStyle} ${variants[variant]}`}
        style={
          hasBorder
            ? {
                boxShadow: boxShadowStyle,
                borderImage: borderImageStyle,
              }
            : {}
        }
        {...props}
      >
        {children}
      </button>
    );
  };

  const NotificationIcon = ({ notification }) => {
    const iconBaseStyle =
      "w-10 h-10 rounded-full flex items-center justify-center";

    if (notification.type === "event_invite") {
      return (
        <div
          className={`${iconBaseStyle} ${
            isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
          }`}
        >
          <Bell size={20} />
        </div>
      );
    }

    if (
      notification.type === "event_created" ||
      notification.type === "event_hosted"
    ) {
      return (
        <div
          className={`${iconBaseStyle} ${
            isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
          }`}
        >
          <CalendarDays size={20} />
        </div>
      );
    }

    if (notification.type === "general") {
      if (notification.title?.toLowerCase().includes("alert")) {
        return (
          <div className={`${iconBaseStyle} bg-gray-700 text-gray-300`}>
            <Phone size={20} />
          </div>
        );
      }
      return (
        <div className={`${iconBaseStyle} bg-indigo-600 text-white`}>
          <Bell size={20} />
        </div>
      );
    }

    return (
      <div
        className={`${iconBaseStyle} ${
          isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
        }`}
      >
        <AlertTriangle size={20} />
      </div>
    );
  };

  const formatDate = (date) => {
    if (!date) return "";
    
    const now = new Date();
    const notifDate = new Date(date);
    const diffInSeconds = Math.floor((now - notifDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return notifDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const NotificationItem = ({ notification }) => {
    const unread = !notification.isRead;

    return (
      <div
        className={`p-4 ${
          isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-100"
        } cursor-pointer transition-colors`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            <NotificationIcon notification={notification} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className={`font-medium ${theme.text}`}>
                  {notification.title}{" "}
                  <span className={`text-sm ${theme.subText} font-normal`}>
                    {notification.message}
                  </span>
                </p>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end ml-2">
                <span className={`text-xs ${theme.subText}`}>
                  {formatDate(notification.createdAt)}
                </span>
                {unread && (
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></span>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              {notification.type === "event_invite" && (
                <>
                  <ActionButton
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptInvite(notification._id);
                    }}
                  >
                    Accept
                  </ActionButton>
                  <ActionButton
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeclineInvite(notification._id);
                    }}
                  >
                    Decline
                  </ActionButton>
                </>
              )}
              {(notification.type === "event_created" ||
                notification.type === "event_hosted") && (
                <ActionButton
                  variant="primary"
                  hasBorder={false}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewEvent(notification);
                  }}
                >
                  View event
                </ActionButton>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TabItem = ({ label, count, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`relative pb-2 font-medium text-sm transition-colors ${
        isActive ? theme.text : theme.subText
      } hover:${theme.text}`}
    >
      <span className="mr-1.5">{label}</span>
      {count > 0 && (
        <span
          className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full ${
            isActive
              ? "bg-indigo-600 text-white"
              : (isDark ? "bg-gray-700" : "bg-gray-200") + " " + theme.text
          }`}
        >
          {count}
        </span>
      )}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"></span>
      )}
    </button>
  );

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}
    >
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute top-0 right-0 h-full w-full md:w-[486px] ${theme.bg} shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 ${theme.border} border-b`}>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${theme.subText} hover:${theme.text} transition-colors md:hidden`}
          >
            <ArrowLeft size={24} />
          </button>

          <div className="flex-1">
            <h2 className={`text-xl font-semibold ${theme.text} text-center md:text-left`}>
              Notifications
            </h2>
            <div
              className="w-full max-w-[390px] h-0 mt-2 mx-auto md:mx-0"
              style={{
                borderBottom: "1px solid transparent",
                borderImage:
                  "linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, #FFFFFF 50.73%, rgba(255, 255, 255, 0) 100%) 1",
              }}
            ></div>
          </div>

          <button
            onClick={onClose}
            className={`p-1 rounded-full ${theme.subText} hover:${theme.text} transition-colors hidden md:block`}
          >
            <X size={24} />
          </button>
          <div className="w-8 md:hidden" />
        </div>

        {/* Tabs */}
        <div className={`flex justify-around p-4 ${theme.border} border-b`}>
          <TabItem
            label="View all"
            count={getTabCount("all")}
            isActive={activeTab === "all"}
            onClick={() => setActiveTab("all")}
          />
          <TabItem
            label="Events"
            count={getTabCount("events")}
            isActive={activeTab === "events"}
            onClick={() => setActiveTab("events")}
          />
          <TabItem
            label="Invites"
            count={getTabCount("invites")}
            isActive={activeTab === "invites"}
            onClick={() => setActiveTab("invites")}
          />
        </div>

        {/* Mark all as read button */}
        {getTabCount("all") > 0 && (
          <div className="px-4 pt-2 text-right">
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className={`text-center py-12 ${theme.subText}`}>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              <p className="mt-2">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className={`text-center py-12 ${theme.subText}`}>
              <AlertTriangle size={32} className="mx-auto mb-2 text-red-500" />
              <p className="font-medium text-red-500">Error loading notifications</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={fetchNotifications}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className={`text-center py-12 ${theme.subText}`}>
              <Bell size={32} className="mx-auto mb-2" />
              <p className="font-medium">No notifications yet</p>
              <p className="text-sm mt-1">
                We'll let you know when something comes up.
              </p>
            </div>
          ) : (
            <div className={`divide-y ${theme.border}`}>
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default NotificationModal;
