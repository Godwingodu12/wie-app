'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import WieUserLogo from '@/assets/Home/WieUserLogo.svg';
import SlidingButton from '@/assets/Home/SlidingButton.svg';
import HomeIcon from '@/assets/Home/HomeIcon.svg';
import ExploreIcon from '@/assets/Home/ExploreIcon.svg';
import ReelIcon from '@/assets/Home/ReelIcon.svg';
import MessageIcon from '@/assets/Home/MessageIcon.png';
import ConnectionsIcon from '@/assets/Home/ConnectionsIcon.png';
import NotificationsIcon from '@/assets/Home/NotificationsIcon.svg';
import EventsIcon from '@/assets/Home/EventsIcon.svg';
import SettingsIcon from '@/assets/Home/SettingsIcon.svg';
import DefaultAvatar from '@/assets/Home/Ellipse 14.png';
import { getUserNotifications } from '@/services/notificationService';
import realtimeNotificationService from '@/services/realtimeNotificationService';


interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  notificationCount?: number;
}

import { useAuth } from '@/hooks/useAuth';

import { useSidebar } from '@/context/SidebarContext';

const SideBar: React.FC = () => {
  const { isCollapsed, toggleCollapse, isMobile } = useSidebar();
  const { user, token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const userName = user?.name || user?.username || 'User Name';
  const userAvatar = user?.profile_picture;
  const [notificationCount, setNotificationCount] = useState<number>(0);

  // Load unread notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const res = await getUserNotifications({ limit: 0 });
        setNotificationCount(res.unreadCount || 0);
      } catch (error) {
        console.error('Failed to load notification count:', error);
      }
    };

    if (user) {
      fetchNotificationCount();
    }
  }, [user]);

  // Subscribe to real-time notification events
  useEffect(() => {
    if (!user || !token) return;

    // Ensure socket is connected
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
      // Recalculate notification count when deleted
      getUserNotifications({ limit: 0 })
        .then((res) => setNotificationCount(res.unreadCount || 0))
        .catch(() => {});
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
  }, [user, token]);


  const mainNavItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: HomeIcon, path: '/home' },
    { id: 'explore', label: 'Explore', icon: ExploreIcon, path: '/explore' },
    { id: 'reels', label: 'Reels', icon: ReelIcon, path: '/reels' },
    { id: 'messages', label: 'Messages', icon: MessageIcon, path: '/messages', notificationCount: 5 },
    { id: 'connections', label: 'Connections', icon: ConnectionsIcon, path: '/connections', notificationCount: 12 },
    { id: 'notifications', label: 'Notifications', icon: NotificationsIcon, path: '/notification', notificationCount: notificationCount },
    { id: 'events', label: 'Events', icon: EventsIcon, path: '/events/nearby' },

  ];

  const mobileNavItems = mainNavItems.slice(0, 5);

  const handleNavClick = (path: string) => router.push(path);
  const isActive = (path: string) => pathname === path;

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
                <Image src={item.icon} alt={item.label} width={24} height={24} className={`transition-opacity duration-200 ${isActive(item.path) ? 'opacity-100' : 'opacity-60'}`} />
                {item.notificationCount && item.notificationCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-[9px] font-bold text-white flex items-center justify-center border border-[#0a0a0a]">
                    {item.notificationCount > 99 ? '99+' : item.notificationCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive(item.path) ? 'text-white' : 'text-[#6F7680]'}`}>{item.label}</span>
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
      className={`fixed left-0 top-0 h-screen bg-[#0a0a0a] flex flex-col border-r border-[#2D2F39]/30 transition-all duration-300 ease-in-out z-50 ${isCollapsed ? 'w-[105px] p-4' : 'w-[281px] p-6'}`}
    >
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full mb-8 h-[37px] transition-all duration-300`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap opacity-100 transition-opacity duration-300">
            <Image src={WieUserLogo} alt="Wie Logo" width={37} height={37} className="flex-shrink-0" />
            <span className="font-medium text-2xl text-white tracking-normal" style={{ fontFamily: 'SF Pro, -apple-system, sans-serif' }}>Wie</span>
          </div>
        )}

        {isCollapsed && (
             <Image src={WieUserLogo} alt="Wie Logo" width={32} height={32} className="flex-shrink-0" />
        )}

        <button
          onClick={toggleCollapse}
          className={`absolute ${isCollapsed ? '-right-3 top-8 translate-x-0' : 'right-0 top-8 translate-x-1/2'} z-50 rounded-[8px] flex items-center justify-center transition-all duration-300 group bg-[#161A23]`}
        >
          <Image
            src={SlidingButton}
            alt="Toggle"
            width={24}
            height={24}
            className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'group-hover:scale-110'}`}
          />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className={`flex flex-col gap-2 w-full ${isCollapsed ? 'items-center' : 'overflow-y-auto scrollbar-hide'} flex-1`}>
        {!isCollapsed && (
          <div className="flex flex-col gap-4 mb-2 relative">
             {/* Gradient Line */}
             <div
               className="h-[1px] rounded-[2px]"
               style={{
                 width: '233px',
                 background: 'linear-gradient(270deg, rgba(0, 0, 0, 0) -8.43%, rgba(63, 63, 63, 0.6) 46.38%, rgba(0, 0, 0, 0) 100%)',
                 opacity: 1
               }}
             />
             {/* MAIN Text */}
             <div className="px-6">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Main</span>
             </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex flex-col items-center gap-3 mb-2">
             {/* Small line */}
             <div
               className="h-[2px] rounded-[2px]"
               style={{
                 width: '44px',
                 background: 'linear-gradient(270deg, rgba(0, 0, 0, 0) -8.43%, rgba(63, 63, 63, 0.6) 46.38%, rgba(0, 0, 0, 0) 100%)',
                 opacity: 1
               }}
             />
             {/* MAIN Text */}
             <span className="text-[10px] font-medium text-[#FFFFFF80] uppercase tracking-wider">Main</span>
          </div>
        )}
        {/* Main Nav Items */}
        {mainNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.path)}
            className={`
              relative flex items-center rounded-xl transition-all duration-200 group
              ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full h-11 px-3.5 gap-3.5'}
              ${isActive(item.path)
                ? 'bg-[#2D2F39]'
                : 'hover:bg-white/5'}
            `}
          >
            <div className={`relative flex items-center justify-center ${isCollapsed ? 'w-5 h-5' : 'w-5 h-5'} flex-shrink-0`}>
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={20}
                  height={20}
                  className={`transition-all duration-200 ${isActive(item.path) ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                />
            </div>

            {!isCollapsed && (
              <>
                <span
                  className={`flex-1 font-medium text-[15px] tracking-tight text-left transition-colors duration-200 ${isActive(item.path) ? 'text-white' : 'text-[#9CA3AF] group-hover:text-white'}`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {item.label}
                </span>
                {(item.notificationCount ?? 0) > 0 && (
                  <span
                    className="flex items-center justify-center font-bold text-[10px] text-white shadow-lg shadow-purple-500/20"
                    style={{
                      width: '24px',
                      height: '16px',
                      borderRadius: '20px',
                      padding: '4px 5px',
                      background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)',
                      opacity: 1
                    }}
                  >
                    {(item.notificationCount ?? 0) > 99 ? '99+' : item.notificationCount}
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
                className="absolute w-4 h-4 rounded-[20px] bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-[9px] font-bold text-white flex items-center justify-center border border-[#0a0a0a] z-10 p-0"
                style={{
                  top: '12.76px',
                  left: '37px',
                  paddingTop: '4px',
                  paddingRight: '5px',
                  paddingBottom: '4px',
                  paddingLeft: '5px',
                }}
              >
                {(item.notificationCount ?? 0) > 9 ? '9+' : item.notificationCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#2D2F39]/30 to-transparent my-2" />

      {/* Secondary Navigation */}
      <div className={`flex flex-col gap-2 w-full ${isCollapsed ? 'items-center' : ''} mb-4`}>
        {/* Settings */}
        <button
          onClick={() => handleNavClick('/settings')}
          className={`
            relative flex items-center rounded-xl transition-all duration-200 group
             ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full h-11 px-3.5 gap-3.5'}
             ${isActive('/settings') ? 'bg-[#2D2F39]' : 'hover:bg-white/5'}
          `}
        >
          <Image src={SettingsIcon} alt="Settings" width={20} height={20} className={`flex-shrink-0 transition-opacity duration-200 ${isActive('/settings') ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
          {!isCollapsed && <span className={`font-medium text-[15px] tracking-tight transition-colors duration-200 ${isActive('/settings') ? 'text-white' : 'text-[#9CA3AF] group-hover:text-white'}`} style={{ fontFamily: 'Inter, sans-serif' }}>Settings</span>}
          {isCollapsed && (
             <div className="absolute left-full ml-4 px-2 py-1 bg-[#1a1a1a] text-white text-xs rounded border border-[#2D2F39] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                Settings
             </div>
          )}
        </button>

        {/* Profile */}
        <button
          onClick={() => handleNavClick('/profile')}
          className={`
            relative flex items-center rounded-xl transition-all duration-200 group
             ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full h-11 px-3.5 gap-3.5'}
             ${isActive('/profile') ? 'bg-[#2D2F39]' : 'hover:bg-white/5'}
          `}
        >
          <div className="relative">
             <Image src={userAvatar || DefaultAvatar} alt="Profile" width={24} height={24} className="flex-shrink-0 rounded-full object-cover border border-[#2D2F39]" />
          </div>
          {!isCollapsed && <span className={`font-medium text-[15px] tracking-tight truncate transition-colors duration-200 ${isActive('/profile') ? 'text-white' : 'text-[#9CA3AF] group-hover:text-white'}`} style={{ fontFamily: 'Inter, sans-serif' }}>{userName}</span>}
          {isCollapsed && (
             <div className="absolute left-full ml-4 px-2 py-1 bg-[#1a1a1a] text-white text-xs rounded border border-[#2D2F39] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                {userName}
             </div>
          )}
        </button>
      </div>
    </aside>
    </>
  );
};
export default SideBar;
