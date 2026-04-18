import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getEventById, getRehostedEvents } from "@/services/ticketUserService";
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
  CheckCircle,
  Camera
} from "lucide-react";
import {
  Notification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/services/notificationService";
import { followUser, unfollowUser, isFollowing, acceptFollowRequest, rejectFollowRequest,checkFollowRequestStatus } from "@/services/followService";
import realtimeNotificationService from "@/services/realtimeNotificationService";
import NotificationInitializer from "./NotificationInitializer";
import { useTheme } from "@/components/home/ThemeContext";
import {getUserById} from "@/services/wieUserService";
import NotificationSkeleton from "../skeletons/NotificationSkeleton";

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}
const formatFollowNotificationMessage = (notification: Notification): string => {
  const primaryActors = notification.meta?.primaryActors || [];
  const othersCount = notification.meta?.othersCount || 0;
  if (primaryActors.length === 0) {
    return notification.message;
  }
  if (primaryActors.length === 1 && othersCount === 0) {
    const firstName = primaryActors[0].username || primaryActors[0].name || 'Someone';
    return `${firstName} started following you`;
  } else if (primaryActors.length === 2 && othersCount === 0) {
    // Two followers
    const firstName = primaryActors[0].username || primaryActors[0].name || 'Someone';
    const secondName = primaryActors[1].username || primaryActors[1].name || 'someone';
    return `${firstName} and ${secondName} started following you`;
  } else if (othersCount === 1) {
    // firstName + 1 other
    const firstName = primaryActors[0].username || primaryActors[0].name || 'Someone';
    return `${firstName} and 1 other started following you`;
  } else if (othersCount > 1) {
    // firstName + N others
    const firstName = primaryActors[0].username || primaryActors[0].name || 'Someone';
    return `${firstName} and ${othersCount} others started following you`;
  }
  return notification.message;
};
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
const sortByNewest = (notifs: Notification[]): Notification[] =>
  [...notifs].sort(
    (a, b) =>
      new Date(b.updatedAt ?? b.createdAt).getTime() -
      new Date(a.updatedAt ?? a.createdAt).getTime(),
  );
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

    useEffect(() => {
      if (isOpen) {
        loadNotifications();
      }
    }, [isOpen]);

const loadNotifications = async () => {
    try {
      setLoading(true);

      // Fetch existing notifications from notification service
      const res = await getUserNotifications({ limit: 50 });
      const existingNotifs: Notification[] = res.notifications || [];
      // Cross-check: fetch rehosted events for this user (only events they booked when cancelled)
      try {
        const rehostedRes = await getRehostedEvents();
        const rehostedEvents: any[] = rehostedRes?.data?.events || [];

        // Find rehosted events that don't already have a notification
        const existingRehostedTicketIds = new Set(
          existingNotifs
            .filter((n) => n.type === 'event_rehosted')
            .map((n) => n.ticketId)
            .filter(Boolean)
        );

        const syntheticNotifs: Notification[] = rehostedEvents
          .filter((ev) => {
            const evId = ev.eventId || ev._id || '';
            return evId && !existingRehostedTicketIds.has(evId);
          })
          .map((ev): Notification => ({
            id: `synthetic_rehosted_${ev.eventId || ev._id}`,
            type: 'event_rehosted',
            title: `Event is Back: ${ev.event_name}`,
            message: `"${ev.event_name}" has been re-hosted and is now ${ev.event_status}. Book your tickets again!`,
            createdAt: ev.rehosted_at || new Date().toISOString(),
            isRead: false,
            ticketId: ev.eventId || ev._id,
            eventName: ev.event_name,
            targetUrl: `/events/${ev.eventId || ev._id}`,
            meta: { isSynthetic: true },
          }));

        // Merge: synthetic ones go at the top, real notifications follow
        setNotifications(sortByNewest([...syntheticNotifs, ...existingNotifs]));
      } catch (rehostErr) {
        // Non-fatal — fallback to existing notifications only
        console.warn('⚠️ Failed to load rehosted events for notification merge:', rehostErr);
        setNotifications(sortByNewest(existingNotifs));
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates
  useEffect(() => {
    const handleNewNotification = (data: any) => {
      const raw = data.notification || data;
      const mapped: Notification = {
        id: raw.id || raw._id,
        type: raw.type,
        title: raw.title,
        message: raw.message,
        createdAt: raw.createdAt || new Date().toISOString(),
        isRead: false,
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
          isGrouped: raw.isGrouped,
          primaryActors: raw.primaryActors,
          actorIds: raw.actorIds,
          othersCount: raw.othersCount,
          groupKey: raw.groupKey,
        },
      };

      setNotifications((prev) => {
        // General deduplication by ID first
        const existingById = prev.findIndex((n) => n.id === mapped.id);

        // Grouped follow handling (Instagram-style)
        if (mapped.type === 'following' && raw.isGrouped && raw.groupKey) {
          const existingGroupIndex = prev.findIndex(
            (n) => n.type === 'following' && n.meta?.groupKey === raw.groupKey
          );

          if (existingGroupIndex !== -1) {
            const updated = [...prev];
            updated[existingGroupIndex] = mapped;
            return sortByNewest(updated);
          }
        }

        // If we found an exact ID match but it wasn't caught by group logic above
        if (existingById !== -1) {
          const updated = [...prev];
          updated[existingById] = mapped;
          return sortByNewest(updated);
        }

        // New notification
        return sortByNewest([mapped, ...prev]);
      });
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

  const handleMarkRead = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        markNotificationAsRead(notification.id).catch(() => {});
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n,
          ),
        );
      }
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

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
      await handleMarkRead(notification);

      //  FOLLOW REQUEST
      if (notification.type === 'follow_request') {
        const username = notification.meta?.username || notification.fromUserId;
        if (username) router.push(`/profile/${username}`);
        onClose();
        return;
      }

      //  FOLLOWING (grouped or single)
      if (notification.type === 'following') {
        if (notification.meta?.primaryActors?.length === 1) {
          const follower = notification.meta.primaryActors[0];
          router.push(`/profile/${follower.username || follower.actorId}`);
        } else if ((notification.meta?.primaryActors?.length ?? 0) > 1) {
          router.push('/connections?tab=followers');
        } else if (notification.fromUserId) {
          router.push(`/profile/${notification.fromUserId}`);
        }
        onClose();
        return;
      }

      // EVENT CANCELLED
      // Must come BEFORE generic bookingId check so it routes to cancelled tab
      if (notification.type === 'event_cancelled') {
        const bId = notification.bookingId || notification.meta?.bookingId;
        if (bId) {
          router.push(`/bookings/${bId}`);
        } else if (notification.ticketId) {
          router.push(`/bookings?cancelled=${notification.ticketId}`);
        } else {
          router.push('/bookings?tab=cancelled');
        }
        onClose();
        return;
      }

      // REFUND SUCCESS
      if (notification.type === 'refund_success') {
        const bId = notification.bookingId || notification.meta?.bookingId;
        router.push(bId ? `/bookings/${bId}/refund` : '/bookings');
        onClose();
        return;
      }

      // EVENT REHOSTED
      if (notification.type === 'event_rehosted') {
        if (notification.ticketId) router.push(`/events/${notification.ticketId}`);
        else router.push('/bookings');
        onClose();
        return;
      }

      // EVENT CREATED
      if (notification.type === 'event_created') {
        if (notification.eventId) router.push(`/events/${notification.eventId}`);
        else if (notification.ticketId) router.push(`/events/${notification.ticketId}`);
        onClose();
        return;
      }
      // FLUX MENTION (received by mentioned user)
      if (notification.type === 'flux_mention') {
        const fluxId  = notification.meta?.fluxId;
        const ownerId = notification.meta?.fluxOwnerId ?? notification.fromUserId;
        if (fluxId) {
          // Receiver sees flux owner's story — include userId
          const url = ownerId
            ? `/post/flux-view?fluxId=${fluxId}&userId=${ownerId}`
            : `/post/flux-view?fluxId=${fluxId}`;
          router.push(url);
        }
        onClose();
        return;
      }

      // FLUX MENTION SENT (confirmation to the sender/mentioner)
      if (notification.type === 'flux_mention_sent') {
        const fluxId = notification.meta?.fluxId;
        if (fluxId) {
          // Sender views their own flux — no userId needed
          router.push(`/post/flux-view?fluxId=${fluxId}`);
        }
        onClose();
        return;
      }

      // FLUX RE-MENTION (received by original owner — user A)
      if (notification.type === 'flux_remention') {
        const fluxId = notification.meta?.fluxId;
        if (fluxId) {
          // Original owner views their own flux
          router.push(`/post/flux-view?fluxId=${fluxId}`);
        }
        onClose();
        return;
      }

      // FLUX RE-MENTION SENT (confirmation to re-mentioner — user B)
      if (notification.type === 'flux_remention_sent') {
        const fluxId  = notification.meta?.fluxId;
        const ownerId = notification.meta?.fluxOwnerId ?? notification.fromUserId;
        if (fluxId) {
          // Re-mentioner views the original owner's flux
          const url = ownerId
            ? `/post/flux-view?fluxId=${fluxId}&userId=${ownerId}`
            : `/post/flux-view?fluxId=${fluxId}`;
          router.push(url);
        }
        onClose();
        return;
      }
      // FLUX COMMENT — notify flux owner
      if (notification.type === 'flux_comment') {
        const fluxId  = notification.meta?.fluxId;
        if (fluxId) router.push(`/post/flux-view?fluxId=${fluxId}`);
        onClose();
        return;
      }

      // FLUX LIKE — notify flux owner
      if (notification.type === 'flux_like') {
        const fluxId = notification.meta?.fluxId;
        if (fluxId) router.push(`/post/flux-view?fluxId=${fluxId}`);
        onClose();
        return;
      }
      // FLUX SCREENSHOT — aggregated alert to owner
      if (notification.type === 'flux_screenshot') {
        const fluxId = notification.meta?.fluxId;
        if (fluxId) router.push(`/post/flux-view?fluxId=${fluxId}`);
        onClose();
        return;
      }
      // GENERIC FALLBACK
      // booking_confirmed, payment_success, refund_initiated, etc.
      const bookingId = notification.bookingId || notification.meta?.bookingId;
      const targetUrl =
        notification.targetUrl ||
        notification.meta?.targetUrl ||
        notification.meta?.link;

      if (bookingId) {
        router.push(`/bookings/${bookingId}`);
      } else if (targetUrl) {
        router.push(targetUrl);
      } else if (notification.ticketId) {
        router.push(`/events/${notification.ticketId}`);
      } else if (notification.eventId) {
        router.push(`/events/${notification.eventId}`);
      }

      onClose();
    } catch (error) {
      console.error('Error handling notification click', error);
      onClose();
    }
  };
  /* Counts Calculation */
  const unreadTotal = notifications.filter(n => !n.isRead).length;
  const eventCount = notifications.filter(
    (n) =>
      !n.isRead &&
      (n.type?.includes("event") ||
        n.type?.includes("ticket") ||
        n.type?.includes("group") ||
        n.type?.includes("booking") ||
        n.type === "event_cancelled" ||
        n.type === "event_rehosted"),
  ).length;

  const followerCount = notifications.filter(
    (n) => !n.isRead && (n.type?.includes("follow") || n.type === "following"),
  ).length;

  const connectionCount = notifications.filter(
      (n) => {
        if (n.isRead) return false;
        if (
          n.type === 'flux_mention' ||
          n.type === 'flux_mention_sent' ||
          n.type === 'flux_remention' ||
          n.type === 'flux_remention_sent'||
          n.type === 'flux_comment' ||
          n.type === 'flux_like'    ||
          n.type === 'flux_reply'   ||
          n.type === 'flux_screenshot'
        ) return true;
        return ["like", "comment", "mention", "message_received", "connection"].some(
          (t) => n.type?.includes(t),
        );
      }
    ).length;
  /* Categorization Logic Based on Backend Types */
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "events") {
      return (
        n.type?.includes("event") ||
        n.type?.includes("ticket") ||
        n.type?.includes("group") ||
        n.type?.includes("booking") ||
        n.type === "event_cancelled" ||
        n.type === "event_rehosted" ||
        n.type === 'flux_comment' ||
        n.type === 'flux_like'    ||
        n.type === 'flux_reply'   ||
        n.type === "refund_success"
      );
    }
    if (filter === "followers") {
      return (n.type?.includes("follow") || n.type === "following");
    }
    if (filter === "connections") {
      if (
        n.type === 'flux_mention' ||
        n.type === 'flux_mention_sent' ||
        n.type === 'flux_remention' ||
        n.type === 'flux_remention_sent'
      ) return true;
      return [
        "like",
        "comment",
        "mention",
        "message_received",
        "connection",
      ].some((t) => n.type?.includes(t));
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
                      unreadTotal > 0
                        ? `View all (${unreadTotal})`
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
              <NotificationSkeleton />
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
                      onSeen={handleMarkRead}
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
const NotificationItem = ({
  notification,
  onRead,
  onSeen,
}: {
  notification: Notification;
  onRead: (n: Notification) => void;
  onSeen: (n: Notification) => void;
}) => {
  const { themeStyles, isDark } = useTheme();
  const [eventBanner, setEventBanner] = useState<string | null>(null);
  const [bannerLoading, setBannerLoading] = useState(false);
  const router = useRouter();
  const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  // Follow state management
  const [followingState, setFollowingState] = useState<{
    [key: string]: boolean;
  }>({});
  const [followLoading, setFollowLoading] = useState<{
    [key: string]: boolean;
  }>({});

  // Seen marks on scroll
  const itemRef = React.useRef<HTMLDivElement>(null);


  // Track follow request status
  const [requestStatus, setRequestStatus] = useState<{
    hasRequest: boolean;
    requestStatus: 'pending' | 'active' | 'none';
    isFollowingBack: boolean;
  } | null>(null);

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
    "event_cancelled",
    "event_rehosted",
  ];

  const isEvent =
    eventBannerTypes.some((t) => notification.type?.includes(t)) ||
    !!notification.eventId ||
    !!notification.ticketId;
  const targetEventId =
    notification.ticketId ||
    notification.eventId ||
    notification.meta?.ticketId ||
    notification.meta?.eventId ||
    notification.meta?.event_id;


  useEffect(() => {
  // Skip banner fetch for cancelled events — the event may return 404
  if (notification.type === 'event_cancelled') return;

  if (isEvent && targetEventId && !eventBanner && !bannerLoading) {
    setBannerLoading(true);
    getEventById(targetEventId)
      .then((res) => {
        const banner = res.data?.event?.event_banner;
        if (banner) setEventBanner(banner);
      })
      .catch(() => {
        // Silently ignore — banner is non-critical
      })
      .finally(() => {
        setBannerLoading(false);
      });
  }
  }, [isEvent, targetEventId, eventBanner, bannerLoading, notification.id, notification.type]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      // Only fetch for follow-related notifications
      if (!['follow_request', 'follow_accepted', 'following'].includes(notification.type)) {
        return;
      }

      const userId = notification.fromUserId ||
                     notification.meta?.followerId ||
                     notification.meta?.userId;

      if (!userId || profileLoading) {
        return;
      }

      setProfileLoading(true);
      try {
        const user = await getUserById(userId);
        if (user?.profile_picture) {
          setUserProfilePicture(user.profile_picture);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [notification.type, notification.fromUserId, notification.meta?.followerId, notification.meta?.userId]);
  // Check follow status for follow notifications
  useEffect(() => {
    if (notification.type === 'following' && notification.meta?.primaryActors) {
      const checkFollowStatus = async () => {
        const statuses: { [key: string]: boolean } = {};

        for (const actor of notification.meta!.primaryActors!) {
          try {
            const following = await isFollowing(actor.actorId);
            statuses[actor.actorId] = following;
          } catch (error) {
            console.error('Failed to check follow status:', error);
            statuses[actor.actorId] = false;
          }
        }

        setFollowingState(statuses);
      };

      checkFollowStatus();
    }

    // Check follow request status for follow_request notifications
    if (notification.type === 'follow_request' && notification.fromUserId) {
      const checkRequestStatus = async () => {
        try {
          const status = await checkFollowRequestStatus(notification.fromUserId!);
          setRequestStatus(status);

          // Set following state based on the response
          if (status.isFollowingBack) {
            setFollowingState((prev) => ({ ...prev, [notification.fromUserId!]: true }));
          }
        } catch (error) {
          console.error('Failed to check follow request status:', error);
        }
      };

      checkRequestStatus();
    }
  }, [notification.type, notification.meta?.primaryActors, notification.fromUserId]);

  const handleFollowClick = async (e: React.MouseEvent, actorId: string) => {
    e.stopPropagation();

    setFollowLoading((prev) => ({ ...prev, [actorId]: true }));

    try {
      if (followingState[actorId]) {
        // Unfollow
        await unfollowUser(actorId);
        setFollowingState((prev) => ({ ...prev, [actorId]: false }));
      } else {
        // Follow
        await followUser(actorId);
        setFollowingState((prev) => ({ ...prev, [actorId]: true }));
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    } finally {
      setFollowLoading((prev) => ({ ...prev, [actorId]: false }));
    }
  };

  const handleAcceptRequest = async (e: React.MouseEvent, fromUserId: string) => {
    e.stopPropagation();
    setFollowLoading((prev) => ({ ...prev, [fromUserId]: true }));

    try {
      const result = await acceptFollowRequest(fromUserId);

      if (result.success) {
        // Update request status
        setRequestStatus({
          hasRequest: true,
          requestStatus: 'active',
          isFollowingBack: false
        });

        // Update following state - they are now following you, but you're not following back yet
        setFollowingState((prev) => ({ ...prev, [fromUserId]: false }));
      }
    } catch (error: any) {
      console.error('Failed to accept request:', error);
      // If error is "No pending follow request found", it means already accepted
      if (error?.response?.data?.message === 'No pending follow request found') {
        // Refresh the status
        try {
          const status = await checkFollowRequestStatus(fromUserId);
          setRequestStatus(status);
          if (status.isFollowingBack) {
            setFollowingState((prev) => ({ ...prev, [fromUserId]: true }));
          }
        } catch (refreshError) {
          console.error('Failed to refresh status:', refreshError);
        }
      }
    } finally {
      setFollowLoading((prev) => ({ ...prev, [fromUserId]: false }));
    }
  };

  const handleRejectRequest = async (e: React.MouseEvent, fromUserId: string) => {
    e.stopPropagation();
    setFollowLoading((prev) => ({ ...prev, [fromUserId]: true }));

    try {
      await rejectFollowRequest(fromUserId);
      // Update request status to indicate it's been handled
      setRequestStatus({
        hasRequest: false,
        requestStatus: 'none',
        isFollowingBack: false
      });
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setFollowLoading((prev) => ({ ...prev, [fromUserId]: false }));
    }
  };

  const handleFollowBackClick = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    setFollowLoading((prev) => ({ ...prev, [userId]: true }));

    try {
      if (followingState[userId]) {
        // Unfollow
        await unfollowUser(userId);
        setFollowingState((prev) => ({ ...prev, [userId]: false }));
        if (requestStatus) {
          setRequestStatus({
            ...requestStatus,
            isFollowingBack: false
          });
        }
      } else {
        // Follow back
        await followUser(userId);
        setFollowingState((prev) => ({ ...prev, [userId]: true }));
        if (requestStatus) {
          setRequestStatus({
            ...requestStatus,
            isFollowingBack: true
          });
        }
      }
    } catch (error) {
      console.error('Follow back action failed:', error);
    } finally {
      setFollowLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleNotificationItemClick = () => {
    // Always call onRead to ensure status is updated and counts decrement
    onRead(notification);
  };

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

  // Determine what to show for follow request notifications
  const shouldShowAcceptDecline = notification.type === 'follow_request' &&
    requestStatus?.requestStatus === 'pending';

  const shouldShowFollowBack = notification.type === 'follow_request' &&
    requestStatus?.requestStatus === 'active' &&
    !requestStatus?.isFollowingBack;

  const shouldShowFollowing = notification.type === 'follow_request' &&
    requestStatus?.requestStatus === 'active' &&
    requestStatus?.isFollowingBack;

  return (
    <div
      ref={itemRef}
      onClick={handleNotificationItemClick}
      className={`group flex items-start gap-3 p-4 rounded-xl transition-colors mb-1 cursor-pointer`}
      style={{
        background: !notification.isRead ? themeStyles.hoverBg : 'transparent'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeStyles.hoverBg}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !notification.isRead ? themeStyles.hoverBg : 'transparent'}
    >
      {/* Avatar / Icon / Banner / Follower Group (Left Side) */}
    <div className="relative shrink-0 pt-1">
      {notification.type === 'following' && notification.meta?.primaryActors && notification.meta.primaryActors.length > 0 ? (
        // Grouped follow notification - show stacked avatars
        <div className="relative w-12 h-12 flex items-center justify-center">
          {notification.meta.primaryActors.slice(0, 2).map((actor: any, index: number) => (
            <div
              key={actor.actorId}
              className="absolute w-8 h-8 rounded-full overflow-hidden border-2"
              style={{
                left: index === 0 ? '0px' : '16px',
                zIndex: index === 0 ? 2 : 1,
                backgroundColor: themeStyles.pillBg,
                borderColor: isDark ? '#0B0D0F' : '#FFFFFF'
              }}
            >
              {actor.profilePicture ? (
                <img
                  src={actor.profilePicture}
                  alt={actor.username || actor.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      const initials = (actor.username || actor.name || 'U').charAt(0).toUpperCase();
                      target.parentElement.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center text-xs font-bold"
                            style="color: ${themeStyles.text}; background-color: ${themeStyles.pillBg}">
                          ${initials}
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-xs font-bold"
                  style={{ color: themeStyles.text, backgroundColor: themeStyles.pillBg }}
                >
                  {(actor.username || actor.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))}
          {/* Badge for additional followers */}
          {(notification.meta?.othersCount ?? 0) > 0 && (
            <div
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2"
              style={{
                background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)',
                borderColor: isDark ? '#0B0D0F' : '#FFFFFF',
                zIndex: 3,
              }}
            >
              +{notification.meta?.othersCount}
            </div>
          )}
        </div>
      ) : (
        // Standard notification rendering (including follow_request and follow_accepted)
        <div
          className={`
            ${isEvent ? "w-12 h-12 rounded-lg aspect-square" : "w-12 h-12 rounded-full"}
            flex items-center justify-center font-bold overflow-hidden shrink-0
          `}
          style={{ background: themeStyles.pillBg, color: themeStyles.text }}
        >
          {isEvent ? (
            notification.type === 'event_cancelled' ? (
              <div className="w-full h-full flex items-center justify-center">
                <Calendar size={18} style={{ color: '#ef4444' }} />
              </div>
            ) : bannerLoading ? (
              <div className="w-full h-full bg-zinc-700 animate-pulse" />
            ) : eventBanner ? (
              <img
                src={eventBanner}
                alt="Event"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center">
                        ${getIconHTML(notification.type)}
                      </div>
                    `;
                  }
                }}
              />
            ) : (
              getIcon(notification.type)
            )
          ) : profileLoading ? (
            // Show loading state while fetching profile
            <div className="w-full h-full bg-zinc-700 animate-pulse rounded-full" />
            ) : (() => {
              // Get profile picture - prioritize real-time data
              const profilePic =
                userProfilePicture ||  // Real-time fetched profile picture (PRIORITY)
                notification.meta?.userAvatar ||
                notification.meta?.profilePicture ||
                notification.meta?.avatar ||
                notification.meta?.followerProfilePicture ||
                notification.meta?.userProfilePicture;

              const displayName =
                notification.meta?.username ||
                notification.meta?.followerUsername ||
                notification.meta?.userUsername ||
                notification.meta?.name ||
                notification.meta?.followerName ||
                notification.meta?.userName ||
                'U';

              return profilePic ? (
                <img
                  src={profilePic}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      const initials = displayName.charAt(0).toUpperCase();
                      target.parentElement.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center text-lg font-bold"
                            style="color: ${themeStyles.text}; background-color: ${themeStyles.pillBg}">
                          ${initials}
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                // Fallback to initials or icon
                (notification.type === 'follow_request' ||
                notification.type === 'follow_accepted' ||
                notification.type === 'following') ? (
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  getIcon(notification.type)
                )
              );
            })()
          }
        </div>
      )}

      {/* Unread indicator on avatar */}
      {notification.isRead === false && (
        <div
          className="absolute top-0 right-0 rounded-full"
          style={{
            width: "10px",
            height: "10px",
            backgroundColor: "#5E5CE6",
            opacity: 1,
          }}
        />
      )}
    </div>
      {/* Content Container */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Top Row: Message & Follow Button (for follow notifications) or Title & Unread Indicator */}
        {notification.type === 'following' ? (
          // Follow notification - show message and button
          <div className="flex justify-between items-start gap-2">
            <span className="text-sm font-medium leading-tight flex-1" style={{ color: themeStyles.text }}>
              {formatFollowNotificationMessage(notification)}
            </span>

            {/* Follow/Following button for single follower */}
            {notification.meta?.primaryActors && notification.meta.primaryActors.length === 1 && (
              <button
                onClick={(e) => handleFollowClick(e, notification.meta!.primaryActors![0].actorId)}
                disabled={followLoading[notification.meta.primaryActors[0].actorId]}
                className="px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  backgroundColor: followingState[notification.meta.primaryActors[0].actorId]
                    ? themeStyles.pillBg
                    : '#5E5CE6',
                  color: followingState[notification.meta.primaryActors[0].actorId]
                    ? themeStyles.text
                    : '#FFFFFF',
                  border: followingState[notification.meta.primaryActors[0].actorId]
                    ? `1px solid ${themeStyles.border}`
                    : 'none',
                  opacity: followLoading[notification.meta.primaryActors[0].actorId] ? 0.6 : 1,
                }}
              >
                {followLoading[notification.meta.primaryActors[0].actorId]
                  ? '...'
                  : followingState[notification.meta.primaryActors[0].actorId]
                    ? 'Following'
                    : 'Follow'
                }
              </button>
            )}
          </div>
        ) : (
          // Standard notification - show title and unread indicator
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
        )}

        {/* Message (only for non-follow notifications) */}
        {notification.type !== 'following' && (
          <span className="font-normal text-xs leading-snug line-clamp-2" style={{ color: themeStyles.textSecondary }}>
            {notification.message}
          </span>
        )}

        {/* Mutual Follower Badge */}
        {notification.type === 'following' &&
         notification.meta?.primaryActors &&
         notification.meta.primaryActors.some((actor: any) => actor.isMutual) && (
          <div className="flex items-center gap-1 mt-1">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: themeStyles.pillBg,
                color: '#5E5CE6'
              }}
            >
              Followed by someone you follow
            </span>
          </div>
        )}
        {/* Refund success badge */}
        {notification.type === 'refund_success' && (
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
            >
              ✅ Refund Successful
            </span>
            {notification.meta?.refundAmount && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#16a34a' }}
              >
                ₹{parseFloat(notification.meta.refundAmount).toFixed(2)}
              </span>
            )}
          </div>
        )}
        {/* Cancelled / Rehosted badge */}
        {(notification.type === 'event_cancelled' || notification.type === 'event_rehosted') && (
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: notification.type === 'event_cancelled'
                  ? 'rgba(239,68,68,0.15)'
                  : 'rgba(34,197,94,0.15)',
                color: notification.type === 'event_cancelled' ? '#ef4444' : '#22c55e',
              }}
            >
              {notification.type === 'event_cancelled' ? '❌ Event Cancelled' : '🎉 Event Re-hosted'}
            </span>
            {notification.type === 'event_rehosted' && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80"
                style={{ backgroundColor: '#5E5CE6', color: '#fff' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (notification.ticketId) router.push(`/events/${notification.ticketId}`);
                }}
              >
                Book Again →
              </span>
            )}
          </div>
        )}
        {/* Bottom Row: Day/Time (Left) & Relative Time (Right) */}
        <div className="flex items-center justify-between mt-0.5 pt-0.5">
          <span className="text-[11px] capitalize" style={{ color: themeStyles.text }}>
            {formattedDayTime}
          </span>
          <span className="text-[10px] whitespace-nowrap" style={{ color: themeStyles.textSecondary }}>
            {timeAgo(notification.createdAt)}
          </span>
        </div>

        {/* Follow Request Actions */}
        {notification.type === 'follow_request' && notification.fromUserId && (
          <div className="flex items-center gap-2 mt-2">
            {shouldShowAcceptDecline && (
              // Show Accept/Decline buttons for pending requests
              <>
                <button
                  onClick={(e) => handleRejectRequest(e, notification.fromUserId!)}
                  disabled={followLoading[notification.fromUserId!]}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80"
                  style={{
                    background: themeStyles.pillBg,
                    color: themeStyles.textSecondary,
                    opacity: followLoading[notification.fromUserId!] ? 0.6 : 1,
                  }}
                >
                  Decline
                </button>
                <button
                  onClick={(e) => handleAcceptRequest(e, notification.fromUserId!)}
                  disabled={followLoading[notification.fromUserId!]}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors"
                  style={{
                    opacity: followLoading[notification.fromUserId!] ? 0.6 : 1,
                  }}
                >
                  {followLoading[notification.fromUserId!] ? 'Accepting...' : 'Accept'}
                </button>
              </>
            )}

            {shouldShowFollowBack && (
              // Show "Follow Back" button after accepting
              <button
                onClick={(e) => handleFollowBackClick(e, notification.fromUserId!)}
                disabled={followLoading[notification.fromUserId!]}
                className="px-4 py-1.5 rounded-full text-xs font-medium transition-all bg-violet-600 text-white hover:bg-violet-500"
                style={{
                  opacity: followLoading[notification.fromUserId!] ? 0.6 : 1,
                }}
              >
                {followLoading[notification.fromUserId!] ? '...' : 'Follow Back'}
              </button>
            )}

            {shouldShowFollowing && (
              // Show "Following" button after following back
              <button
                onClick={(e) => handleFollowBackClick(e, notification.fromUserId!)}
                disabled={followLoading[notification.fromUserId!]}
                className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: themeStyles.pillBg,
                  color: themeStyles.text,
                  border: `1px solid ${themeStyles.border}`,
                  opacity: followLoading[notification.fromUserId!] ? 0.6 : 1,
                }}
              >
                {followLoading[notification.fromUserId!] ? '...' : 'Following'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
const getIconHTML = (type: string | undefined): string => {
  if (!type) {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';
  }

  const iconMap: { [key: string]: string } = {
    event: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    ticket: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path><path d="M13 5v2"></path><path d="M13 17v2"></path><path d="M13 11v2"></path></svg>',
    follow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    flux_mention: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8860D9" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    flux_remention: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B3B8E2" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
  };

  if (type.includes('event')) return iconMap.event;
  if (type.includes('ticket') || type.includes('booking')) return iconMap.ticket;
  if (type.includes('follow')) return iconMap.follow;
  if (type === 'flux_mention')         return iconMap.flux_mention;
  if (type === 'flux_mention_sent')    return iconMap.flux_mention_sent;
  if (type === 'flux_remention')       return iconMap.flux_remention;
  if (type === 'flux_remention_sent')  return iconMap.flux_remention_sent;
  return iconMap.ticket;
};
const getIcon = (type: string | undefined) => {
  if (!type) return <Bell size={18} />;
  if (type === 'event_cancelled') return <Calendar size={18} style={{ color: '#ef4444' }} />;
  if (type === 'event_rehosted')  return <Calendar size={18} style={{ color: '#22c55e' }} />;
  if (type === 'refund_success')  return <CheckCircle size={18} style={{ color: '#22c55e' }} />;
  if (type === 'flux_mention')         return <MessageCircle size={18} style={{ color: '#8860D9' }} />;
  if (type === 'flux_mention_sent')    return <MessageCircle size={18} style={{ color: '#8860D9' }} />;
  if (type === 'flux_remention')       return <MessageCircle size={18} style={{ color: '#B3B8E2' }} />;
  if (type === 'flux_remention_sent')  return <MessageCircle size={18} style={{ color: '#B3B8E2' }} />;
  if (type === 'flux_comment') return <MessageCircle size={18} style={{ color: '#8860D9' }} />;
  if (type === 'flux_like')    return <Heart size={18} style={{ color: '#e53e3e' }} />;
  if (type === 'flux_reply')   return <MessageCircle size={18} style={{ color: '#2979FF' }} />;
  if (type === 'flux_screenshot') return <Camera size={18} style={{ color: '#f59e0b' }} />;
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
