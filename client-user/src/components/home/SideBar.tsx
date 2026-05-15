"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import WieUserLogo from "@/assets/Auth/WieLogo.png";
import HomeIcon from "@/assets/Home/HomeIcon.svg";
import ExploreIcon from "@/assets/Home/ExploreIcon.svg";
import ReelIcon from "@/assets/Home/ReelIcon.svg";
import MessageIcon from "@/assets/Home/MessageIcon.png";
import ConnectionsIcon from "@/assets/Home/ConnectionsIcon.png";
import NotificationsIcon from "@/assets/Home/NotificationsIcon.svg";
import EventsIcon from "@/assets/Home/EventsIcon.svg";
import SettingsIcon from "@/assets/Home/SettingsIcon.svg";
import { getUserNotifications ,markAllNotificationsAsRead} from "@/services/notificationService";
import { getProfileStatus } from '@/services/connectionService';
import { getUnreadUsersCount } from "@/services/chatService"; 
import realtimeNotificationService from "@/services/realtimeNotificationService";
import { getFollowStats } from "@/services/followService";
import socketService from "@/services/socketService";
import { NotificationPopup } from "@/components/notifications/NotificationPopup";
import MobileNavigation, { NavItem } from "./MobileNavigation";
import TopMobBar from "./TopMobBar";

import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "./ThemeContext";
import { MdLightMode, MdOutlineDarkMode  } from "react-icons/md";

declare global {
  interface WindowEventMap {
    'unread-count-changed': CustomEvent<{ totalUnread: number }>;
    'chat-screenshot-received': CustomEvent<void>;
  }
}

const SideBar: React.FC = () => {
  const { isCollapsed, setIsCollapsed, isMobile } = useSidebar();
  const { user, token } = useAuth();
  const { themeStyles, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const userName = user?.name || user?.username || "User Name";
  const userAvatar = user?.profile_picture || (user as any)?.default_profile_picture;
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [unreadUsersCount, setUnreadUsersCount] = useState<number>(0); 
  const [screenshotAlertCount, setScreenshotAlertCount] = useState<number>(0);
  const [sidebarReady, setSidebarReady] = useState(false);
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

  useEffect(() => {
      const fetchUnreadUsersCount = async () => {
        if (!user || !token) return;
        try {
          const res = await getUnreadUsersCount();
          setUnreadUsersCount(res.unreadUsersCount || 0);
        } catch (error) {
          console.error("Failed to load unread users count:", error);
        } finally {
          setSidebarReady(true); 
        }
      };

      fetchUnreadUsersCount();
    }, [user, token]);

  // Subscribe to real-time notification events
  useEffect(() => {
    if (!user || !token) return;

    realtimeNotificationService.connect(token);

    const refreshNotificationCount = () => {
      getUserNotifications({ limit: 0 })
        .then((res) => setNotificationCount(res.unreadCount || 0))
        .catch((error) => console.error("Failed to refresh notification count:", error));
    };

    const handleNewNotification = (data: any) => {
      setNotificationCount((prev) => prev + 1);
      refreshNotificationCount();
    };

    const handleNotificationRead = (data: any) => {
      setNotificationCount((prev) => Math.max(0, prev - 1));
      refreshNotificationCount();
    };

    const handleAllNotificationsRead = () => {
      setNotificationCount(0);
    };

    const handleNotificationDeleted = (data: any) => {
        refreshNotificationCount();
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

    const handleUnreadCountChange = (event: CustomEvent<{ totalUnread: number }>) => {
      const isOnMessagePage = typeof window !== 'undefined' && 
        window.location.pathname.startsWith('/message');
      if (isOnMessagePage) {
        getUnreadUsersCount()
          .then((res) => {
            setUnreadUsersCount(res.unreadUsersCount || 0);
          })
          .catch(() => {});
        return;
      }

      getUnreadUsersCount()
        .then((res) => {
          setUnreadUsersCount(res.unreadUsersCount || 0);
        })
        .catch((error) => {
          console.error('Failed to refresh unread users count:', error);
        });
    };

    window.addEventListener('unread-count-changed', handleUnreadCountChange as EventListener);
    // Screenshot alerts → increment message badge 
    const handleChatScreenshot = (event: CustomEvent<void>) => {
      // Only bump the count when NOT on the messages page
      const isOnMessagePage =
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/message');
      if (!isOnMessagePage) {
        setScreenshotAlertCount(prev => prev + 1);
      }
    };

    window.addEventListener('chat-screenshot-received', handleChatScreenshot as EventListener);
    // Also refresh on socket events
    const socket = socketService.getSocket();
    if (socket) {
      const handleNewMessageNotification = (data: any) => {
        const isOnMessagePage = typeof window !== 'undefined' && 
          window.location.pathname.startsWith('/message');
        if (isOnMessagePage) return;
        getUnreadUsersCount()
          .then((res) => {
            setUnreadUsersCount(res.unreadUsersCount || 0);
          })
          .catch((error) => {
            console.error('Failed to refresh unread users count:', error);
          });
      };


      const handleMessagesRead = (data: any) => {
        // ✅ Always refresh from API to get accurate count
        getUnreadUsersCount()
          .then((res) => {
            setUnreadUsersCount(res.unreadUsersCount || 0);
          })
          .catch((error) => {
            console.error('Failed to refresh unread users count:', error);
          });
      };

      const handleChatUnreadUpdate = (data: any) => {
        const isOnMessagePage = typeof window !== 'undefined' && 
          window.location.pathname.startsWith('/message');
        if (isOnMessagePage) return;
        getUnreadUsersCount()
          .then((res) => {
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
        window.removeEventListener('chat-screenshot-received', handleChatScreenshot as EventListener);
        window.removeEventListener('unread-count-changed', handleUnreadCountChange as EventListener);
      };
    }

    return () => {
      window.removeEventListener('unread-count-changed', handleUnreadCountChange as EventListener);
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
      notificationCount: unreadUsersCount + screenshotAlertCount,
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

  const handleNavClick = async (path: string) => {
    if (path === '/message') {
      setScreenshotAlertCount(0);
    }
    if (path === '/notification') {
      const opening = !isNotificationOpen;
      setIsNotificationOpen(opening);
      if (opening) {
        // Optimistic: clear badge immediately
        const prevCount = notificationCount;
        setNotificationCount(0);

        markAllNotificationsAsRead().catch((err) => {
          console.error('Failed to mark all notifications read:', err);
          // Rollback on failure
          setNotificationCount(prevCount);
        });
      }
      return;
    }
    if (path === '/connections') {
        try {
          const status = await getProfileStatus();
    
          if (!status.hasProfile) {
            router.push('/connections?step=1');
            return;
          }
          if (status.isComplete) {
            router.push('/connections?section=purpose-selection');
            return;
          }
          router.push(
            `/connections?step=${status.resumeStep}&faceVerified=${status.faceVerified ?? false}`
          );
          return;
    
        } catch {
          router.push('/connections');
          return;
        }
    }
    router.push(path);
  };

  const isActive = (path: string) => {
    if (!pathname) return false;

    // Normalize pathname - remove trailing slash if present
    const normalizedPathname = pathname.endsWith('/') && pathname !== '/'
      ? pathname.slice(0, -1)
      : pathname;

    // For routes with potential nested paths, use startsWith
    if (path === "/message" || path === "/profile" || path === "/settings") {
      return normalizedPathname.startsWith(path);
    }

    // For events, check if pathname starts with /events
    if (path === "/events/nearby") {
      return normalizedPathname.startsWith("/events");
    }

    return normalizedPathname === path;
  };


  // ✅ Helper to format count (show "9+" for 10 or more)
  const formatCount = (count: number | undefined): string => {
    if (!count || count === 0) return "0";
    if (count > 9) return "9+";
    return count.toString();
  };

  // Mobile Bottom Navigation Items (Custom Order: Home, Explore, Connections, Events, Profile)
  const mobileBottomItems: NavItem[] = [
    { id: "home", label: "Home", icon: HomeIcon, path: "/home" },
    { id: "explore", label: "Explore", icon: ExploreIcon, path: "/explore" },
    {
      id: "connections",
      label: "Connections",
      icon: ConnectionsIcon,
      path: "/connections",
      // Removed notification count from bottom bar as per request (moved logic to TopBar/Sidebar)
    },
    { id: "events", label: "Events", icon: EventsIcon, path: "/events/nearby" },
    {
      id: "profile",
      label: "Profile",
      icon: userAvatar || "", // Will handle image rendering in MobileNavigation
      path: "/profile",
      isProfile: true // Flag to identify profile item for special rendering
    },
  ];

  // Mobile Render
  if (isMobile) {
    return (
      <>
        <TopMobBar
          notificationCount={notificationCount}
          messageCount={unreadUsersCount}
          onNotificationClick={() => {
            setIsNotificationOpen(true);
            const prevCount = notificationCount;
            setNotificationCount(0); // Optimistic clear
            markAllNotificationsAsRead().catch((err) => {
              console.error('Failed to mark all notifications read:', err);
              setNotificationCount(prevCount); // Rollback
            });
          }}
          onMessageClick={() => router.push("/message")}
          onPostClick={() => {
            // Placeholder for Add Post functionality
          }}
        />
        <MobileNavigation
          items={mobileBottomItems}
          isActive={isActive}
          onNavClick={handleNavClick}
        />
         <NotificationPopup
          isOpen={isNotificationOpen}
          onClose={() => {
            setIsNotificationOpen(false);
            const prevCount = notificationCount;
            setNotificationCount(0); // Optimistic clear
            markAllNotificationsAsRead().catch(() => {
              setNotificationCount(prevCount); // Rollback
            });
          }}
        />
        <style jsx global>{`
          @media (max-width: 768px) {
            body {
              padding-top: 70px;
              padding-bottom: 80px
              background-color: ${isDark ? "#0C1014" : "#F3F4F6"} !important;
              background-image: none !important;
            }
          }
        `}</style>
      </>
    );
  }

  // Desktop/Tablet Sidebar
  return (
    <>

      <aside
        onMouseEnter={() => !isMobile && setIsCollapsed(false)}
        onMouseLeave={() => !isMobile && setIsCollapsed(true)}
        className={`fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 ease-in-out z-50 ${
          isCollapsed ? "w-[92px] p-4" : "w-[281px] p-4"
        }`}
        style={{
          background: themeStyles.sidebarBg,
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
              <Image src={WieUserLogo} alt="Wie Logo" width={87} height={87} className="flex-shrink-0" style={{ filter: themeStyles.iconFilter }} />
              <span
                className="font-medium text-2xl tracking-normal transition-colors duration-300"
                style={{
                  fontFamily: "SF Pro, -apple-system, sans-serif",
                  color: themeStyles.text
                }}
              >
                Wie
              </span>
            </div>
          )}

          {isCollapsed && (
            <Image
              src={WieUserLogo}
              alt="Wie Logo"
              width={82}
              height={82}
              className="flex-shrink-0"
              style={{ filter: themeStyles.iconFilter }}
            />
          )}
        </div>



        {/* Main Navigation */}
        <nav
          className={`flex flex-col gap-2 w-full ${
            isCollapsed ? "items-center" : "overflow-y-auto scrollbar-hide"
          } flex-1`}
        >
          {/* Nav skeleton while counts load */}
          {!sidebarReady ? (
            <>
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 px-3 rounded-xl animate-pulse"
                  style={{
                    height: 44,
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  <div
                    className="w-[36px] h-[36px] rounded-full flex-shrink-0"
                    style={{ backgroundColor: isDark ? "#2a2a2a" : "#e5e7eb" }}
                  />
                  {!isCollapsed && (
                    <div
                      className="h-3 rounded-full flex-1"
                      style={{
                        maxWidth: `${60 + (i % 3) * 20}px`,
                        backgroundColor: isDark ? "#2a2a2a" : "#e5e7eb",
                      }}
                    />
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-col gap-2 w-full animate-fadeIn">
              {/* Main Nav Items */}
              {mainNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path)}
                  className={`
                  relative flex items-center rounded-xl transition-all duration-200 group
                  ${isCollapsed ? "justify-center p-2" : "w-full justify-start px-3 gap-3.5"}
                `}
                  style={{
                    backgroundColor: isActive(item.path) ? themeStyles.activeTabBg : "transparent",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.path)) e.currentTarget.style.backgroundColor = themeStyles.hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.path)) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div
                    className="flex items-center justify-center w-[36px] h-[36px] rounded-full flex-shrink-0 transition-all duration-200"
                    style={{ backgroundColor: isActive(item.path) ? "#FFFFFF" : "transparent" }}
                  >
                    <Image
                      src={item.icon}
                      alt={item.label}
                      width={20}
                      height={20}
                      className="transition-all duration-200"
                      style={{
                        width: "20px",
                        height: "20px",
                        filter: isActive(item.path) ? "brightness(0)" : themeStyles.iconFilter,
                        opacity: 1
                      }}
                    />
                  </div>

                  {!isCollapsed && (
                    <>
                      <span
                        className="flex-1 font-medium text-[15px] tracking-tight text-left transition-colors duration-200"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          color: isActive(item.path) ? themeStyles.text : themeStyles.textSecondary,
                          fontWeight: isActive(item.path) ? 600 : 500
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive(item.path)) e.currentTarget.style.color = themeStyles.text;
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive(item.path)) e.currentTarget.style.color = themeStyles.textSecondary;
                        }}
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
                            background: "linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)",
                          }}
                        >
                          {formatCount(item.notificationCount)}
                        </span>
                      )}
                    </>
                  )}

                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-[#1a1a1a] text-white text-xs rounded border border-[#2D2F39] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}

                  {isCollapsed && (item.notificationCount ?? 0) > 0 && (
                    <span
                      className="absolute min-w-[18px] h-[18px] rounded-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-[10px] font-bold text-white flex items-center justify-center border border-[#0a0a0a] z-10 px-1"
                      style={{ top: "12px", left: "35px" }}
                    >
                      {formatCount(item.notificationCount)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </nav>
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
                 : "w-full justify-start px-3 gap-3.5"
             }
             hover:bg-transparent
          `}
            style={{
              backgroundColor: isActive("/settings") ? themeStyles.activeTabBg : "transparent",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
            onMouseEnter={(e) => {
                if (!isActive("/settings")) e.currentTarget.style.backgroundColor = themeStyles.hoverBg;
            }}
            onMouseLeave={(e) => {
                if (!isActive("/settings")) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <div
              className={`flex items-center justify-center w-[36px] h-[36px] rounded-full flex-shrink-0 transition-all duration-200`}
              style={{
                backgroundColor: "transparent"
              }}
            >
              <Image
                src={SettingsIcon}
                alt="Settings"
                width={20}
                height={20}
                className={`flex-shrink-0 transition-opacity duration-200`}
                style={{
                  filter: themeStyles.iconFilter,
                  opacity: isActive("/settings") ? 1 : 0.7
                }}
              />
            </div>
            {!isCollapsed && (
              <span
                className={`font-medium text-[15px] tracking-tight transition-colors duration-200`}
                style={{
                  fontFamily: "Inter, sans-serif",
                  color: isActive("/settings") ? themeStyles.text : themeStyles.textSecondary,
                  fontWeight: isActive("/settings") ? 600 : 500
                }}
                onMouseEnter={(e) => {
                  if (!isActive("/settings")) e.currentTarget.style.color = themeStyles.text;
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/settings")) e.currentTarget.style.color = themeStyles.textSecondary;
                }}
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

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`
            relative flex items-center rounded-xl transition-all duration-200 group
             ${
               isCollapsed
                 ? "justify-center"
                 : "w-full justify-start px-3 gap-3.5"
             }
             hover:bg-transparent
          `}
            style={{
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = themeStyles.hoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <div
              className={`flex items-center justify-center w-[36px] h-[36px] rounded-full flex-shrink-0 transition-all duration-200`}
            >
              {isDark ? (
                <MdLightMode
                  size={22}
                  className="transition-all duration-200"
                  style={{
                    filter: themeStyles.iconFilter, // White in Dark Mode
                    opacity: 0.8
                  }}
                />
              ) : (
                <MdOutlineDarkMode
                  size={22}
                  className="transition-all duration-200"
                  style={{
                    filter: themeStyles.iconFilter, // Black in Light Mode
                    opacity: 0.8
                  }}
                />
              )}
            </div>
            {!isCollapsed && (
              <span
                className={`font-medium text-[15px] tracking-tight transition-colors duration-200`}
                style={{
                  fontFamily: "Inter, sans-serif",
                  color: themeStyles.textSecondary
                }}
                 onMouseEnter={(e) => {
                  e.currentTarget.style.color = themeStyles.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = themeStyles.textSecondary;
                }}
              >
                {isDark ? "Light mode" : "Dark mode"}
              </span>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-[#1a1a1a] text-white text-xs rounded border border-[#2D2F39] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                {isDark ? "Light mode" : "Dark mode"}
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
                 : "w-full justify-start px-3 gap-3.5"
             }
          `}
            style={{
              backgroundColor: isActive("/profile") ? themeStyles.activeTabBg : "transparent",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
            onMouseEnter={(e) => {
                if (!isActive("/profile")) e.currentTarget.style.backgroundColor = themeStyles.hoverBg;
            }}
            onMouseLeave={(e) => {
                if (!isActive("/profile")) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <div className={`relative flex items-center justify-center w-[36px] h-[36px] rounded-full flex-shrink-0 transition-all duration-200`}>
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
                className={`font-medium text-[15px] tracking-tight truncate transition-colors duration-200`}
                style={{
                  fontFamily: "Inter, sans-serif",
                  color: isActive("/profile") ? themeStyles.text : themeStyles.textSecondary,
                  fontWeight: isActive("/profile") ? 600 : 500
                }}
                onMouseEnter={(e) => {
                  if (!isActive("/profile")) e.currentTarget.style.color = themeStyles.text;
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/profile")) e.currentTarget.style.color = themeStyles.textSecondary;
                }}
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
        onClose={() => {
          setIsNotificationOpen(false);
          const prevCount = notificationCount;
          setNotificationCount(0); // Optimistic clear
          markAllNotificationsAsRead().catch(() => {
            setNotificationCount(prevCount); // Rollback
          });
        }}
      />
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default SideBar;
