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

interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  notificationCount?: number;
}

interface SideBarProps {
  userName?: string;
  userAvatar?: string;
}

const SideBar: React.FC<SideBarProps> = ({ userName = 'User Name', userAvatar }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (window.innerWidth <= 1024 && window.innerWidth > 768) setIsCollapsed(true);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const mainNavItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: HomeIcon, path: '/home' },
    { id: 'explore', label: 'Explore', icon: ExploreIcon, path: '/explore' },
    { id: 'reels', label: 'Reels', icon: ReelIcon, path: '/reels' },
    { id: 'messages', label: 'Messages', icon: MessageIcon, path: '/messages', notificationCount: 5 },
    { id: 'connections', label: 'Connections', icon: ConnectionsIcon, path: '/connections', notificationCount: 12 },
    { id: 'notifications', label: 'Notifications', icon: NotificationsIcon, path: '/notifications', notificationCount: 3 },
    { id: 'events', label: 'Events', icon: EventsIcon, path: '/events/nearby' },
  ];

  const mobileNavItems = mainNavItems.slice(0, 5);

  const handleToggle = () => setIsCollapsed(!isCollapsed);
  const handleNavClick = (path: string) => router.push(path);
  const isActive = (path: string) => pathname === path;

  // Mobile Bottom Navigation
  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-[#2D2F39] px-4 py-3">
        <div className="flex justify-around items-center">
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className="flex flex-col items-center gap-1 relative"
            >
              <div className="relative">
                <Image src={item.icon} alt={item.label} width={24} height={24} className={isActive(item.path) ? 'opacity-100' : 'opacity-60'} />
                {item.notificationCount && item.notificationCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-[8px] font-semibold text-white flex items-center justify-center">
                    {item.notificationCount > 99 ? '99+' : item.notificationCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${isActive(item.path) ? 'text-white' : 'text-[#6F7680]'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    );
  }

  // Desktop/Tablet Sidebar
  return (
    <aside className={`fixed left-0 top-0 h-screen bg-[#0a0a0a] flex flex-col p-6 gap-6 border-r border-[#2D2F39] transition-all duration-300 z-50 ${isCollapsed ? 'w-20' : 'w-[281px]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-[233px] h-[37px]">
        <div className="flex items-center gap-3">
          <Image src={WieUserLogo} alt="Wie Logo" width={37} height={37} className="flex-shrink-0" />
          {!isCollapsed && (
            <span className="font-medium text-2xl text-white tracking-normal" style={{ fontFamily: 'SF Pro, -apple-system, sans-serif' }}>Wie</span>
          )}
        </div>
        <button onClick={handleToggle} className="w-7 h-7 p-1.5 rounded-lg border border-[#2D2F39] bg-transparent flex items-center justify-center hover:bg-white/5 transition-colors flex-shrink-0">
          <Image src={SlidingButton} alt="Toggle" width={16} height={16} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Main Label */}
      {!isCollapsed && <span className="text-[#6F7680] text-xs tracking-wider uppercase px-3"></span>}

      {/* Main Navigation */}
      <nav className="flex flex-col gap-2 w-full max-w-[233px]">
        {mainNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.path)}
            className={`w-full h-10 flex items-center gap-3 px-3 py-2.5 rounded-lg border-none cursor-pointer transition-all duration-200 ${isActive(item.path) ? 'bg-gradient-to-r from-[#8860D9]/30 to-transparent' : 'bg-transparent hover:bg-white/5'} ${isCollapsed ? 'justify-center' : ''}`}
          >
            <Image src={item.icon} alt={item.label} width={20} height={20} className="flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className={`flex-1 font-medium text-sm tracking-tight text-left ${isActive(item.path) ? 'text-white' : 'text-[#a0a0a0]'}`} style={{ fontFamily: 'Inter, sans-serif' }}>{item.label}</span>
                {item.notificationCount && item.notificationCount > 0 && (
                  <span className="min-w-6 h-4 px-1.5 py-1 rounded-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] font-semibold text-[10px] text-white flex items-center justify-center">
                    {item.notificationCount > 99 ? '99+' : item.notificationCount}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="w-full max-w-[233px] h-px rounded bg-gradient-to-r from-transparent via-[#3f3f3f]/60 to-transparent" />

      {/* Secondary Navigation */}
      <div className="flex flex-col gap-2 w-full max-w-[233px] mt-auto">
        {/* Settings */}
        <button
          onClick={() => handleNavClick('/settings')}
          className={`w-full h-10 flex items-center gap-3 px-3 py-2.5 rounded-lg border-none cursor-pointer transition-all duration-200 ${isActive('/settings') ? 'bg-gradient-to-r from-[#8860D9]/30 to-transparent' : 'bg-transparent hover:bg-white/5'} ${isCollapsed ? 'justify-center' : ''}`}
        >
          <Image src={SettingsIcon} alt="Settings" width={20} height={20} className="flex-shrink-0" />
          {!isCollapsed && <span className={`font-medium text-sm tracking-tight ${isActive('/settings') ? 'text-white' : 'text-[#a0a0a0]'}`} style={{ fontFamily: 'Inter, sans-serif' }}>Settings</span>}
        </button>

        {/* Profile */}
        <button
          onClick={() => handleNavClick('/profile')}
          className={`w-full h-10 flex items-center gap-3 px-3 py-2.5 rounded-lg border-none cursor-pointer transition-all duration-200 ${isActive('/profile') ? 'bg-gradient-to-r from-[#8860D9]/30 to-transparent' : 'bg-transparent hover:bg-white/5'} ${isCollapsed ? 'justify-center' : ''}`}
        >
          <Image src={userAvatar || DefaultAvatar} alt="Profile" width={20} height={20} className="flex-shrink-0 rounded-full object-cover" />
          {!isCollapsed && <span className={`font-medium text-sm tracking-tight truncate ${isActive('/profile') ? 'text-white' : 'text-[#a0a0a0]'}`} style={{ fontFamily: 'Inter, sans-serif' }}>{userName}</span>}
        </button>
      </div>
    </aside>
  );
};
export default SideBar;