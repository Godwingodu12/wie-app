import React, { useState, useEffect } from "react";
import { X, Phone, Bell, CalendarDays, AlertTriangle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notificationService";

const NotificationModal = ({ isOpen, onClose, isDark = true }) => {
  const navigate = useNavigate();
  const [allNotifications, setAllNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getNotifications() // Fetches all notifications
        .then((data) => {
          setAllNotifications(data.notifications || []);
        })
        .catch((error) => console.error("Error fetching notifications:", error))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setAllNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif,
        ),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await handleMarkAsRead(notification._id);
      }

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
      console.error("Error handling notification click:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setAllNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true })),
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getTabCount = (tab) => {
    if (tab === "all") {
      return allNotifications.filter((n) => !n.isRead).length;
    }
    if (tab === "events") {
      return allNotifications.filter(
        (n) => ["event_created", "event_hosted"].includes(n.type) && !n.isRead,
      ).length;
    }
    if (tab === "invites") {
      return allNotifications.filter(
        (n) => n.type === "event_invite" && !n.isRead,
      ).length;
    }
    return 0;
  };

  const getFilteredNotifications = () => {
    if (activeTab === "all") return allNotifications;
    if (activeTab === "events") {
      return allNotifications.filter((n) =>
        ["event_created", "event_hosted"].includes(n.type),
      );
    }
    if (activeTab === "invites") {
      return allNotifications.filter((n) => n.type === "event_invite");
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

  const handleAcceptInvite = (notificationId) => {
    console.log(`Accepted invite for notification ID: ${notificationId}`);
    // Example: acceptInvite(notificationId).then(() => fetchNotifications());
  };

  const handleDeclineInvite = (notificationId) => {
    console.log(`Declined invite for notification ID: ${notificationId}`);
    // Example: declineInvite(notificationId).then(() => fetchNotifications());
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
      primary: "bg-[#5E5CE6] text-white",
      secondary: "bg-[#44444D] text-gray-300",
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
      if (notification.title.toLowerCase().includes("alert")) {
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
        } cursor-pointer`}
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
                <span className="text-xs text-gray-500">
                  {formatDate(notification.createdAt)}
                </span>
                {unread && (
                  <span
                    className={`w-2 h-2 bg-indigo-500 rounded-full mt-2`}
                  ></span>
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
        <div
          className={`flex items-center justify-between p-4 ${theme.border}`}
        >
            {/* Mobile: Back arrow, which also serves as close */}
            <button onClick={onClose} className={`p-1 rounded-full ${theme.subText} hover:${theme.text} transition-colors md:hidden`}>
                <ArrowLeft size={24} />
            </button>

            {/* Title: Centered on mobile, left-aligned on desktop */}
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

            {/* Spacer on mobile to center title, X button on desktop */}
            <button
                onClick={onClose}
                className={`p-1 rounded-full ${theme.subText} hover:${theme.text} transition-colors hidden md:block`}
            >
                <X size={24} />
            </button>
            <div className="w-8 md:hidden" /> {/* This is a spacer for mobile */}
        </div>

        <div className={`flex justify-around p-4 ${theme.border}`}>
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

        {getTabCount("all") > 0 && (
          <div className="px-4 pt-2 text-right">
            <button
              onClick={handleMarkAllAsRead}
              className={`text-xs font-medium text-indigo-500 hover:text-indigo-400 transition-colors`}
            >
              Mark all as read
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className={`text-center py-12 ${theme.subText}`}>
              Loading...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className={`text-center py-12 ${theme.subText}`}>
              <Bell size={32} className="mx-auto mb-2" />
              <p className="font-medium">No notifications yet</p>
              <p className="text-sm">
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
