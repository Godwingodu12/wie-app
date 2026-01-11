import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getEventById } from "@/services/ticketUserService";
import {
  X,
  Check,
  CheckCheck,
  Bell,
  Calendar,
  User,
  Heart,
  MessageCircle,
  Users,
  Ticket,
} from "lucide-react";
import {
  Notification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/services/notificationService";
import realtimeNotificationService from "@/services/realtimeNotificationService";
import NotificationInitializer from "./NotificationInitializer";
import { useTheme } from "@/components/home/ThemeContext";

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const timeAgo = (date: string | Date) => {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000,
  );
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const { themeStyles, isDark } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "events" | "followers" | "connections"
  >("all");

  // Load initial notifications
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await getUserNotifications({ limit: 50 }); // Fetch more for scrolling
      setNotifications(res.notifications || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates
  useEffect(() => {
    const handleNewNotification = (data: any) => {
      const mapped: Notification = {
        id: data.id || data._id,
        type: data.type,
        title: data.title,
        message: data.message,
        createdAt: data.createdAt || new Date().toISOString(),
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

    const handleRead = (data: any) => {
      const id = data.id || data._id;
      if (!id) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    };

    const handleAllRead = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };

    realtimeNotificationService.on("new-notification", handleNewNotification);
    realtimeNotificationService.on("notification-read", handleRead);
    realtimeNotificationService.on("all-notifications-read", handleAllRead);

    return () => {
      realtimeNotificationService.off(
        "new-notification",
        handleNewNotification,
      );
      realtimeNotificationService.off("notification-read", handleRead);
      realtimeNotificationService.off("all-notifications-read", handleAllRead);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        markNotificationAsRead(notification.id).catch(() => {});
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n,
          ),
        );
      }

      const bookingId = notification.bookingId || notification.meta?.bookingId;
      const targetUrl =
        notification.targetUrl ||
        notification.meta?.targetUrl ||
        notification.meta?.link;

      if (bookingId) {
        router.push(`/bookings/${bookingId}`); // Adjust path as needed
      } else if (targetUrl) {
        router.push(targetUrl);
      } else if (
        notification.type === "event_created" &&
        notification.eventId
      ) {
        router.push(`/events/${notification.eventId}`);
      }

      onClose(); // Close on navigation
    } catch (error) {
      console.error("Error handling notification click", error);
    }
  };

  const handleAcceptRequest = (
    e: React.MouseEvent,
    notification: Notification,
  ) => {
    e.stopPropagation();
    // Logic to accept friend request/follow request
    // TODO: Implement actual accept logic
    console.log("Accepting request:", notification);
  };

  const handleDeclineRequest = (
    e: React.MouseEvent,
    notification: Notification,
  ) => {
    e.stopPropagation();
    // Logic to decline friend request/follow request
    // TODO: Implement actual decline logic
    console.log("Declining request:", notification);
  };

  /* Counts Calculation */
  const eventCount = notifications.filter(
    (n) =>
      n.type.includes("event") ||
      n.type.includes("ticket") ||
      n.type.includes("group") ||
      n.type.includes("booking"),
  ).length;

  const followerCount = notifications.filter((n) =>
    n.type.includes("follow"),
  ).length;

  const connectionCount = notifications.filter((n) =>
    ["like", "comment", "mention", "message_received", "connection"].some((t) =>
      n.type.includes(t),
    ),
  ).length;

  /* Categorization Logic Based on Backend Types */
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "events") {
      // Backend types: event_*, ticket_*, group_*, booking_*
      return (
        n.type.includes("event") ||
        n.type.includes("ticket") ||
        n.type.includes("group") ||
        n.type.includes("booking")
      );
    }
    if (filter === "followers") {
      // Backend types: follow_*
      return n.type.includes("follow");
    }
    if (filter === "connections") {
      // Activity from connections: like, comment, mention, message
      return [
        "like",
        "comment",
        "mention",
        "message_received",
        "connection",
      ].some((t) => n.type.includes(t));
    }
    return true;
  });

  const show = isOpen; // Local alias for clarity

  return (
    <NotificationInitializer>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${show ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={onClose}
      />

      {/* Popover Container (Centered) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        {/* Popup Card */}
        <div
          className={`pointer-events-auto flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ease-in-out rounded-[24px] w-full max-w-[95%] md:max-w-[684px] h-[80vh] md:h-[85vh] md:max-h-[842px] ${show ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"}`}
          style={{
            background: isDark ? "#0B0D0F" : "#FFFFFF",
            border: `1px solid ${themeStyles.border}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 pb-2 shrink-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium" style={{ color: themeStyles.text }}>
                Your Notifications
              </h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-[42px] h-[42px] rounded-[50px] p-[6px] gap-[10px] transition-colors hover:opacity-80"
                style={{ background: themeStyles.pillBg, color: themeStyles.textSecondary }}
                aria-label="Close"
              >
                <X size={24} style={{ color: themeStyles.text }} />
              </button>
            </div>

            {/* Controls Row: Tabs + Mark Read */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4 md:gap-0">
              {/* Tabs Container */}
              <div
                className="flex items-center justify-between w-full md:w-[447px] overflow-x-auto scrollbar-hide gap-1"
                style={{
                  height: "43px",
                  borderRadius: "100px",
                  padding: "3px",
                  background: themeStyles.pillBg,
                }}
              >
                {[
                  {
                    id: "all",
                    label:
                      notifications.length > 0
                        ? `View all (${notifications.length})`
                        : "View all",
                  },
                  {
                    id: "events",
                    label: eventCount > 0 ? `Events (${eventCount})` : "Events",
                  },
                  {
                    id: "followers",
                    label:
                      followerCount > 0
                        ? `Followers (${followerCount})`
                        : "Followers",
                  },
                  {
                    id: "connections",
                    label:
                      connectionCount > 0
                        ? `Connections (${connectionCount})`
                        : "Connections",
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as any)}
                    className={`h-[37px] rounded-[100px] font-medium text-[13px] transition-colors flex items-center justify-center whitespace-nowrap flex-1 min-w-fit px-3 relative`}
                      style={
                        filter === tab.id
                          ? {
                              background: themeStyles.cardBg,
                              border: `1px solid ${themeStyles.border}`,
                              color: themeStyles.text,
                              boxShadow: "0px 2px 4px rgba(0,0,0,0.1)"
                            }
                          : {
                              color: themeStyles.textSecondary,
                              border: "1px solid transparent",
                            }
                      }
                    >
                    {/* Active Border Gradient Overlay (Pseudo-element approach for smoother rendering if needed, but simple border is safer for no-blink) */}

                    {/* Removed gradient overlay for cleaner look with themeStyles */}
                    {filter === tab.id && (
                      <div
                        className="absolute inset-0 rounded-[100px] pointer-events-none"
                        style={{
                          padding: "1px",
                          background: themeStyles.border,
                          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                          WebkitMask:
                            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                          maskComposite: "exclude",
                          WebkitMaskComposite: "xor",
                          opacity: 0.5
                        }}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Mark all read */}
              <button
                onClick={handleMarkAllRead}
                className="text-[#5E5CE6] text-xs font-medium flex items-center gap-1.5 hover:opacity-80 px-2"
              >
                <CheckCheck size={16} /> Mark all as read
              </button>
            </div>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10" style={{ color: themeStyles.textSecondary }}>
                Loading...
              </div>
            ) : (
              <>
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: themeStyles.textSecondary }}>
                    <Ticket size={32} className="opacity-20" />
                    <span>No notifications found</span>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      onRead={handleNotificationClick}
                      onDecline={handleDeclineRequest}
                      onAccept={handleAcceptRequest}
                    />
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: ${themeStyles.pillBg};
          border-radius: 20px;
        }
      `}</style>
    </NotificationInitializer>
  );
};

/* -------------------------------------------------------------------------- */
/*                            Sub-Component Item                              */
/* -------------------------------------------------------------------------- */

const NotificationItem = ({
  notification,
  onRead,
  onDecline,
  onAccept,
}: {
  notification: Notification;
  onRead: (n: Notification) => void;
  onDecline: (e: React.MouseEvent, n: Notification) => void;
  onAccept: (e: React.MouseEvent, n: Notification) => void;
}) => {
  const { themeStyles } = useTheme();
  const [eventBanner, setEventBanner] = useState<string | null>(null);
  const [bannerLoading, setBannerLoading] = useState(false);

  // Notification types that should show event banners
  const eventBannerTypes = [
    "event",
    "ticket",
    "booking",
    "payment_success",
    "payment_failed",
    "refund_initiated",
    "refund_processing",
    "refund_completed",
    "refund_failed",
    "booking_confirmed",
    "booking_cancelled",
    "booking_pending",
    "event_reminder",
    "ticket_verified",
    "qr_code_generated",
  ];

  const isEvent =
    eventBannerTypes.some((t) => notification.type.includes(t)) ||
    !!notification.eventId ||
    !!notification.ticketId;

  // Priority: ticketId > eventId > meta fields
  // ticketId can be either main event ID or sub-event ID
  const targetEventId =
    notification.ticketId ||
    notification.eventId ||
    notification.meta?.ticketId ||
    notification.meta?.eventId ||
    notification.meta?.event_id;

  // Fetch Event Banner if needed
  useEffect(() => {
    if (isEvent && targetEventId && !eventBanner && !bannerLoading) {
      setBannerLoading(true);
      getEventById(targetEventId)
        .then((res) => {
          // API response structure: { data: { event: { event_banner: "..." }, isSubEvent: bool, parentEvent: {...} } }
          // For both main events and sub-events, the banner is at res.data.event.event_banner
          const banner = res.data?.event?.event_banner;
          if (banner) {
            setEventBanner(banner);
          }
        })
        .catch((err) => {
          // Silent fail - fallback to icon
          console.debug(
            "Failed to load event banner for notification:",
            notification.id,
          );
        })
        .finally(() => {
          setBannerLoading(false);
        });
    }
  }, [isEvent, targetEventId, eventBanner, bannerLoading, notification.id]);

  const isRequest =
    notification.type.includes("request") ||
    notification.type.includes("invite");

  // Format "Day Time" e.g., "Monday 4:20pm"
  const formattedDayTime = new Date(notification.createdAt)
    .toLocaleString("en-US", {
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase()
    .replace(/, /g, " ")
    .replace(/ pm/g, "pm")
    .replace(/ am/g, "am");

  return (
    <div
      onClick={() => onRead(notification)}
      className={`group flex items-start gap-3 p-4 rounded-xl transition-colors mb-1 cursor-pointer`}
      style={{
        background: !notification.isRead ? themeStyles.hoverBg : 'transparent'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeStyles.hoverBg}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !notification.isRead ? themeStyles.hoverBg : 'transparent'}
    >
      {/* Avatar / Icon / Banner (Left Side) */}
      <div className="relative shrink-0 pt-1">
        <div
          className={`
            ${isEvent ? "w-12 h-12 rounded-lg aspect-square" : "w-12 h-12 rounded-full"}
            flex items-center justify-center font-bold overflow-hidden shrink-0
          `}
          style={{ background: themeStyles.pillBg, color: themeStyles.text }}
        >
          {isEvent ? (
            bannerLoading ? (
              <div className="w-full h-full bg-zinc-700 animate-pulse" />
            ) : eventBanner ? (
              <img
                src={eventBanner}
                alt="Event"
                className="w-full h-full object-cover"
              />
            ) : (
              getIcon(notification.type)
            )
          ) : notification.meta?.userAvatar ? (
            <img
              src={notification.meta.userAvatar}
              alt="User"
              className="w-full h-full object-cover"
            />
          ) : (
            getIcon(notification.type)
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Top Row: Title & Unread Indicator */}
        <div className="flex justify-between items-start gap-2">
          <span className="text-sm font-bold leading-tight" style={{ color: themeStyles.text }}>
            {notification.title}
          </span>
          {notification.isRead === false && (
            <div
              className="shrink-0 rounded-full"
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#5E5CE6",
                opacity: 1,
              }}
            />
          )}
        </div>

        {/* Message */}
        <span className="font-normal text-xs leading-snug line-clamp-2" style={{ color: themeStyles.textSecondary }}>
          {notification.message}
        </span>

        {/* Bottom Row: Day/Time (Left) & Relative Time (Right) */}
        <div className="flex items-center justify-between mt-0.5 pt-0.5">
          <span className="text-[11px] capitalize" style={{ color: themeStyles.text }}>
            {formattedDayTime}
          </span>
          <span className="text-[10px] whitespace-nowrap" style={{ color: themeStyles.textSecondary }}>
            {timeAgo(notification.createdAt)}
          </span>
        </div>

        {/* Action Buttons (if any) */}
        {isRequest && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={(e) => onDecline(e, notification)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80"
              style={{ background: themeStyles.pillBg, color: themeStyles.textSecondary }}
            >
              Decline
            </button>
            <button
              onClick={(e) => onAccept(e, notification)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors"
            >
              Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
const getIcon = (type: string) => {
  if (type.includes("event")) return <Calendar size={18} />;
  if (type.includes("ticket") || type.includes("booking"))
    return <Ticket size={18} />;
  if (type.includes("group")) return <Users size={18} />;
  if (type.includes("follow")) return <User size={18} />;
  if (type.includes("like")) return <Heart size={18} />;
  if (
    type.includes("comment") ||
    type.includes("message") ||
    type.includes("mention")
  )
    return <MessageCircle size={18} />;
  return <Ticket size={18} />;
};
