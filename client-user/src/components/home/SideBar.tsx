"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import WieUserLogo from "@/assets/Home/WieUserLogo.svg";
import HomeIcon from "@/assets/Home/HomeIcon.svg";
import ExploreIcon from "@/assets/Home/ExploreIcon.svg";
import ReelIcon from "@/assets/Home/ReelIcon.svg";
import MessageIcon from "@/assets/Home/MessageIcon.png";
import ConnectionsIcon from "@/assets/Home/ConnectionsIcon.png";
import NotificationsIcon from "@/assets/Home/NotificationsIcon.svg";
import EventsIcon from "@/assets/Home/EventsIcon.svg";
import SettingsIcon from "@/assets/Home/SettingsIcon.svg";
import { getUserNotifications } from "@/services/notificationService";
import { getUnreadUsersCount } from "@/services/chatService"; // ✅ Changed from getUnreadMessageCount
import realtimeNotificationService from "@/services/realtimeNotificationService";
import { getFollowStats } from "@/services/followService";
import socketService from "@/services/socketService";
import { NotificationPopup } from "@/components/notifications/NotificationPopup";

interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  notificationCount?: number;
}

import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/context/SidebarContext";

const SideBar: React.FC = () => {
  const { isCollapsed, setIsCollapsed, isMobile } = useSidebar();
  const { user, token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const userName = user?.name || user?.username || "User Name";
  const userAvatar = user?.profile_picture || (user as any)?.default_profile_picture;
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [unreadUsersCount, setUnreadUsersCount] = useState<number>(0); // ✅ Changed variable name

  // Load unread notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const res = await getUserNotifications({ limit: 0 });
        setNotificationCount(res.unreadCount || 0);
      } catch (error) {
        console.error("Failed to load notification count:", error);
      }
    };

    if (user) {
      fetchNotificationCount();
    }
  }, [user]);

  // Load follow stats
  useEffect(() => {
    const fetchFollowStats = async () => {
      if (user?.id) {
        try {
          const stats = await getFollowStats(user.id);
          setFollowStats(stats);
        } catch (error) {
          console.error("Failed to fetch follow stats:", error);
        }
      }
    };

    fetchFollowStats();
  }, [user?.id]);

  // ✅ Load unread USERS count (not message count)
  useEffect(() => {
    const fetchUnreadUsersCount = async () => {
      if (!user || !token) return;

      try {
        const res = await getUnreadUsersCount();
        console.log('📊 Sidebar: Unread users count:', res.unreadUsersCount);
        setUnreadUsersCount(res.unreadUsersCount || 0);
      } catch (error) {
        console.error("Failed to load unread users count:", error);
      }
    };

    fetchUnreadUsersCount();
  }, [user, token]);

  // Subscribe to real-time notification events
  useEffect(() => {
    if (!user || !token) return;

    realtimeNotificationService.connect(token);

    const handleNewNotification = (data: any) => {
      setNotificationCount((prev) => prev + 1);
    };

    const handleNotificationRead = (data: any) => {
      setNotificationCount((prev) => Math.max(0, prev - 1));
    };

    const handleAllNotificationsRead = () => {
      setNotificationCount(0);
    };

    const handleNotificationDeleted = (data: any) => {
      getUserNotifications({ limit: 0 })
        .then((res) => setNotificationCount(res.unreadCount || 0))
        .catch(() => {});
    };

    realtimeNotificationService.on("new-notification", handleNewNotification);
    realtimeNotificationService.on("notification-read", handleNotificationRead);
    realtimeNotificationService.on("all-notifications-read", handleAllNotificationsRead);
    realtimeNotificationService.on("notification-deleted", handleNotificationDeleted);

    return () => {
      realtimeNotificationService.off("new-notification", handleNewNotification);
      realtimeNotificationService.off("notification-read", handleNotificationRead);
      realtimeNotificationService.off("all-notifications-read", handleAllNotificationsRead);
      realtimeNotificationService.off("notification-deleted", handleNotificationDeleted);
    };
  }, [user, token]);

  // ✅ Subscribe to real-time message events - Track unique USERS, not messages
  useEffect(() => {
    if (!user || !token) return;

    // ✅ Listen for custom event from ChatContext
    const handleUnreadCountChange = (event: CustomEvent) => {
      console.log('📊 Sidebar: Received unread-count-changed event');
      
      // ✅ CRITICAL: Refresh from API to get accurate USER count
      getUnreadUsersCount()
        .then((res) => {
          console.log('📊 Sidebar: Updated user count from API:', res.unreadUsersCount);
          setUnreadUsersCount(res.unreadUsersCount || 0);
        })
        .catch((error) => {
          console.error('Failed to refresh unread users count:', error);
        });
    };

    window.addEventListener('unread-count-changed' as any, handleUnreadCountChange as any);

    // Also refresh on socket events
    const socket = socketService.getSocket();
    if (socket) {
      const handleNewMessageNotification = (data: any) => {
        console.log('📊 Sidebar: New message notification, refreshing user count from API');
        // ✅ Always refresh from API to get accurate count
        getUnreadUsersCount()
          .then((res) => {
            console.log('📊 Sidebar: Updated user count:', res.unreadUsersCount);
            setUnreadUsersCount(res.unreadUsersCount || 0);
          })
          .catch((error) => {
            console.error('Failed to refresh unread users count:', error);
          });
      };

      const handleMessagesRead = (data: any) => {
        console.log('📊 Sidebar: Messages read, refreshing user count from API');
        // ✅ Always refresh from API to get accurate count
        getUnreadUsersCount()
          .then((res) => {
            console.log('📊 Sidebar: Updated user count:', res.unreadUsersCount);
            setUnreadUsersCount(res.unreadUsersCount || 0);
          })
          .catch((error) => {
            console.error('Failed to refresh unread users count:', error);
          });
      };

      const handleChatUnreadUpdate = (data: any) => {
        console.log('📊 Sidebar: Chat unread update, refreshing user count from API');
        // ✅ Always refresh from API to get accurate count
        getUnreadUsersCount()
          .then((res) => {
            console.log('📊 Sidebar: Updated user count:', res.unreadUsersCount);
            setUnreadUsersCount(res.unreadUsersCount || 0);
          })
          .catch((error) => {
            console.error('Failed to refresh unread users count:', error);
          });
      };

      socket.on('new-message-notification', handleNewMessageNotification);
      socket.on('messages-read', handleMessagesRead);
      socket.on('chat-unread-update', handleChatUnreadUpdate);

      return () => {
        socket.off('new-message-notification', handleNewMessageNotification);
        socket.off('messages-read', handleMessagesRead);
        socket.off('chat-unread-update', handleChatUnreadUpdate);
        window.removeEventListener('unread-count-changed' as any, handleUnreadCountChange as any);
      };
    }

    return () => {
      window.removeEventListener('unread-count-changed' as any, handleUnreadCountChange as any);
    };
  }, [user, token]);

  const mainNavItems: NavItem[] = [
    { id: "home", label: "Home", icon: HomeIcon, path: "/home" },
    { id: "explore", label: "Explore", icon: ExploreIcon, path: "/explore" },
    { id: "reels", label: "Reels", icon: ReelIcon, path: "/reels" },
    {
      id: "messages",
      label: "Messages",
      icon: MessageIcon,
      path: "/message",
      notificationCount: unreadUsersCount, // ✅ Changed to show user count
    },
    {
      id: "connections",
      label: "Connections",
      icon: ConnectionsIcon,
      path: "/connections",
      notificationCount: followStats.followers + followStats.following,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: NotificationsIcon,
      path: "/notification",
      notificationCount: notificationCount,
    },
    { id: "events", label: "Events", icon: EventsIcon, path: "/events/nearby" },
  ];

  const mobileNavItems = mainNavItems.slice(0, 5);

  const handleNavClick = (path: string) => {
    if (path === "/notification") {
      setIsNotificationOpen(!isNotificationOpen);
      return;
    }
    router.push(path);
  };

  const isActive = (path: string) => {
    if (isNotificationOpen) {
      return path === "/notification";
    }
    return pathname === path;
  };

  // ✅ Helper to format count (show "9+" for 10 or more)
  const formatCount = (count: number | undefined): string => {
    if (!count || count === 0) return "0";
    if (count > 9) return "9+";
    return count.toString();
  };

  // Mobile Bottom Navigation
  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-[#2D2F39] px-4 py-3 pb-safe">
        <div className="flex justify-around items-center">
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className="flex flex-col items-center gap-1 relative p-1"
            >
              <div className="relative">
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={24}
                  height={24}
                  className={`transition-opacity duration-200 ${
                    isActive(item.path) ? "opacity-100" : "opacity-60"
                  }`}
                />
                {item.notificationCount && item.notificationCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-[9px] font-bold text-white flex items-center justify-center border border-[#0a0a0a]">
                    {formatCount(item.notificationCount)}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive(item.path) ? "text-white" : "text-[#6F7680]"
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    );
  }

  // Desktop/Tablet Sidebar
  return (
    <>
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <aside
        onMouseEnter={() => !isMobile && setIsCollapsed(false)}
        onMouseLeave={() => !isMobile && setIsCollapsed(true)}
        className={`fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 ease-in-out z-50 ${
          isCollapsed ? "w-[92px] p-4" : "w-[281px] p-6"
        }`}
        style={{
          background: "#0C1014",
          borderRadius: "12px",
        }}
      >
        {/* Header */}
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          } w-full mb-4 h-[37px] transition-all duration-300`}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap opacity-100 transition-opacity duration-300">
              <Image
                src={WieUserLogo}
                alt="Wie Logo"
                width={37}
                height={37}
                className="flex-shrink-0"
              />
              <span
                className="font-medium text-2xl text-white tracking-normal"
                style={{ fontFamily: "SF Pro, -apple-system, sans-serif" }}
              >
                Wie
              </span>
            </div>
          )}

          {isCollapsed && (
            <Image
              src={WieUserLogo}
              alt="Wie Logo"
              width={32}
              height={32}
              className="flex-shrink-0"
            />
          )}
        </div>

        {/* Divider Top */}
        <div
          style={{
            width: "54px",
            height: "2px",
            background: "linear-gradient(270deg, rgba(0, 0, 0, 0) -8.43%, rgba(63, 63, 63, 0.6) 46.38%, rgba(0, 0, 0, 0) 100%)",
            borderRadius: "2px",
            marginBottom: "20px",
            alignSelf: "center"
          }}
        />

        {/* Main Navigation */}
        <nav
          className={`flex flex-col gap-2 w-full ${
            isCollapsed ? "items-center" : "overflow-y-auto scrollbar-hide"
          } flex-1`}
        >
          {/* Main Nav Items */}
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`
              relative flex items-center rounded-xl transition-all duration-200 group
              ${
                isCollapsed
                  ? "justify-center"
                  : "w-full justify-start px-3.5 gap-3.5"
              }
              hover:bg-white/5
            `}
            >
              <div
                className={`flex items-center justify-center w-[36px] h-[36px] rounded-full flex-shrink-0 transition-all duration-200 ${
                   isActive(item.path) ? "bg-white" : ""
                }`}
              >
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={20}
                  height={20}
                  className={`transition-all duration-200 ${
                    isActive(item.path)
                      ? "opacity-100 brightness-0"
                      : "opacity-70 group-hover:opacity-100"
                  }`}
                  style={isActive(item.path) ? { filter: 'brightness(0)' } : {}}
                />
              </div>

              {!isCollapsed && (
                <>
                  <span
                    className={`flex-1 font-medium text-[15px] tracking-tight text-left transition-colors duration-200 ${
                      isActive(item.path)
                        ? "text-white"
                        : "text-[#9CA3AF] group-hover:text-white"
                    }`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {item.label}
                  </span>
                  {(item.notificationCount ?? 0) > 0 && (
                    <span
                      className="flex items-center justify-center font-bold text-[10px] text-white shadow-lg shadow-purple-500/20"
                      style={{
                        width: "24px",
                        height: "16px",
                        borderRadius: "20px",
                        padding: "4px 5px",
                        background:
                          "linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)",
                        opacity: 1,
                      }}
                    >
                      {formatCount(item.notificationCount)}
                    </span>
                  )}
                </>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-[#1a1a1a] text-white text-xs rounded border border-[#2D2F39] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}

              {/* Notification count for collapsed state */}
              {isCollapsed && (item.notificationCount ?? 0) > 0 && (
                <span
                  className="absolute min-w-[18px] h-[18px] rounded-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-[10px] font-bold text-white flex items-center justify-center border border-[#0a0a0a] z-10 px-1"
                  style={{
                    top: "12px",
                    left: "35px",
                  }}
                >
                  {formatCount(item.notificationCount)}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Divider Bottom */}
        <div
          style={{
            width: "54px",
            height: "2px",
            background: "linear-gradient(270deg, rgba(0, 0, 0, 0) -8.43%, rgba(63, 63, 63, 0.6) 46.38%, rgba(0, 0, 0, 0) 100%)",
            borderRadius: "2px",
            marginTop: "10px",
            marginBottom: "10px",
            alignSelf: "center"
          }}
        />

        {/* Secondary Navigation */}
        <div
          className={`flex flex-col gap-2 w-full ${
            isCollapsed ? "items-center" : ""
          } mb-4`}
        >
          {/* Settings */}
          <button
            onClick={() => handleNavClick("/settings")}
            className={`
            relative flex items-center rounded-xl transition-all duration-200 group
             ${
               isCollapsed
                 ? "justify-center"
                 : "w-full justify-start px-3.5 gap-3.5"
             }
             hover:bg-white/5
          `}
          >
            <div
              className={`flex items-center justify-center w-[36px] h-[36px] rounded-full flex-shrink-0 transition-all duration-200 ${
                 isActive("/settings") ? "bg-white" : ""
              }`}
            >
              <Image
                src={SettingsIcon}
                alt="Settings"
                width={20}
                height={20}
                className={`flex-shrink-0 transition-opacity duration-200 ${
                  isActive("/settings")
                    ? "opacity-100 brightness-0"
                    : "opacity-70 group-hover:opacity-100"
                }`}
                style={isActive("/settings") ? { filter: 'brightness(0)' } : {}}
              />
            </div>
            {!isCollapsed && (
              <span
                className={`font-medium text-[15px] tracking-tight transition-colors duration-200 ${
                  isActive("/settings")
                    ? "text-white"
                    : "text-[#9CA3AF] group-hover:text-white"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Settings
              </span>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-[#1a1a1a] text-white text-xs rounded border border-[#2D2F39] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                Settings
              </div>
            )}
          </button>

          {/* Profile */}
          <button
            onClick={() => handleNavClick("/profile")}
            className={`
            relative flex items-center rounded-xl transition-all duration-200 group
             ${
               isCollapsed
                 ? "justify-center"
                 : "w-full justify-start px-3.5 gap-3.5"
             }
             hover:bg-white/5
          `}
          >
            <div className={`relative flex items-center justify-center w-[36px] h-[36px] rounded-full flex-shrink-0 transition-all duration-200 ${
                   isActive("/profile") ? "bg-white" : ""
                }`}>
              {userAvatar ? (
                <Image
                  src={userAvatar}
                  alt="Profile"
                  width={34}
                  height={34}
                  className={`flex-shrink-0 w-[34px] h-[34px] rounded-full object-cover border-[2px] border-white`}
                />
              ) : (
                <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] flex items-center justify-center border-[2px] border-white">
                  <span className="text-xs font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <span
                className={`font-medium text-[15px] tracking-tight truncate transition-colors duration-200 ${
                  isActive("/profile")
                    ? "text-white"
                    : "text-[#9CA3AF] group-hover:text-white"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {userName}
              </span>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-[#1a1a1a] text-white text-xs rounded border border-[#2D2F39] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                {userName}
              </div>
            )}
          </button>
        </div>
      </aside>
      <NotificationPopup
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </>
  );
};

export default SideBar;
