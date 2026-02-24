'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  User,
  Shield,
  Bell,
  Lock,
  Users,
  EyeOff,
  MessageCircle,
  AtSign,
  Share2,
  AlertCircle,
  VolumeX,
  ChevronLeft,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import SideBar from '@/components/home/SideBar';
import { useSidebar } from '@/context/SidebarContext';
import { useTheme } from '@/components/home/ThemeContext';
import WieUserLogo from "@/assets/Home/WieUserLogo.svg";
import { logout } from '@/services/wieUserService';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMobile, isCollapsed } = useSidebar();
  const { isDark, themeStyles, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [isMobileDetail, setIsMobileDetail] = useState(false);

  useEffect(() => {
    if (pathname !== '/settings') {
      setIsMobileDetail(true);
    } else {
      setIsMobileDetail(false);
    }
  }, [pathname]);

  // Adjust margin based on Sidebar state
  const marginLeft = isMobile ? "0" : (isCollapsed ? "92px" : "281px");

  const getPageTitle = () => {
    if (pathname === '/settings' && isMobileDetail) return 'Personal Details';
    if (pathname === '/settings/privacy') return 'Privacy Setting';
    if (pathname === '/settings/privacy/change-password') return 'Change Password';
    if (pathname === '/settings/notifications') return 'Notifications';
    return 'Settings';
  };

  const currentDisplayTitle = (typeof window !== 'undefined' && window.innerWidth < 1024 && isMobileDetail) ? getPageTitle() : 'Settings';

  const handleBack = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && isMobileDetail) {
      e.preventDefault();
      if (pathname === '/settings') {
        setIsMobileDetail(false);
      } else {
        router.push('/settings');
      }
    }
  };

  const handleLogout = async () => {
    try {
        await logout();
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        router.push('/login');
    } catch (error) {
        console.error("Logout failed", error);
        // Force redirect anyway
        router.push('/login');
    }
  };

  const sidebarSections = [
    {
      title: 'Account Management',
      items: [
        { title: 'Personal Details', icon: User, href: '/settings' },
      ]
    },
    {
      title: 'Privacy & Safety',
      items: [
        { title: 'Privacy setting', icon: EyeOff, href: '/settings/privacy' },
        { title: 'Change password', icon: Lock, href: '/settings/privacy/change-password' },
        { title: 'Two factor authentication', icon: Shield, href: '#' },
      ]
    },
    {
      title: 'Notifications',
      items: [
        { title: 'Notifications', icon: Bell, href: '/settings/notifications' },
      ]
    },
    {
        title: 'More Options',
        items: [
            {
                title: isDark ? 'Light Mode' : 'Dark Mode',
                icon: isDark ? Sun : Moon,
                onClick: toggleTheme,
                isAction: true
            },
            {
                title: 'Log Out',
                icon: LogOut,
                onClick: handleLogout,
                isAction: true,
                isDangerous: true
            }
        ]
    }
  ];

  // Specific Design Values from User request
  const glassStyle = {
    background: themeStyles.cardBg,
    backdropFilter: 'blur(60px)',
    borderRadius: '24px',
    border: `1px solid ${themeStyles.border}`,
  };

  const activeItemStyle = {
    background: isDark ? '#2D2F39' : themeStyles.activeItemBg,
    borderRadius: '12px',
    color: isDark ? '#FFFFFF' : themeStyles.activeItemText,
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '14px',
    paddingRight: '14px',
  };

  const inactiveItemStyle = {
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '14px',
    paddingRight: '14px',
    color: themeStyles.textSecondary,
  };

  return (
    <div
      className="min-h-screen font-sans transition-colors duration-300"
      style={{ background: themeStyles.background, color: themeStyles.text }}
    >

      <main
        className="transition-all duration-300 ease-in-out min-h-screen relative flex flex-col items-center justify-center pt-8"
      >
        {/* Top Bar / Back Button Area */}
        <div className="w-full max-w-[1400px] px-4 md:px-12 mb-6 flex items-center justify-start">
             <Link href="/home" onClick={handleBack} className="flex items-center gap-2 hover:opacity-80 transition-opacity" style={{ color: themeStyles.text }}>
                 <div className="p-2 rounded-full bg-black/5 dark:bg-white/10">
                     <ChevronLeft size={20} style={{ color: themeStyles.text }} />
                 </div>
                 <h1 className="text-2xl font-bold">{currentDisplayTitle}</h1>
             </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-12 items-stretch justify-center w-full max-w-[1400px]">

          {/* Left Sidebar (Navigation) */}
          <aside
            className={`flex-1 flex flex-col p-4 md:p-6 gap-6 min-h-[500px] lg:min-h-[600px] ${isMobileDetail ? 'hidden lg:flex' : 'flex'}`}
            style={glassStyle}
          >
             {/* Logo Section */}
            <div className="flex items-center gap-3 px-4 mb-6">
                 <Image
                    src={WieUserLogo}
                    alt="Wie Logo"
                    width={32}
                    height={32}
                    className="flex-shrink-0"
                    style={{ filter: themeStyles.iconFilter }}
                  />
                  <span className="font-bold text-2xl" style={{ color: themeStyles.text }}>Wie</span>
            </div>

            <nav className="flex flex-col gap-6 overflow-y-auto custom-scrollbar">
              {sidebarSections.map((section, idx) => (
                <div key={idx} className="flex flex-col gap-3">
                  <h3
                    className="px-4 text-xs font-bold uppercase tracking-wider"
                    style={{ color: themeStyles.text }}
                  >
                    {section.title}
                  </h3>
                  <div className="flex flex-col gap-1">
                    {section.items.map((item: any) => {
                      const Icon = item.icon;

                      if (item.isAction) {
                        return (
                           <button
                              key={item.title}
                              onClick={item.onClick}
                              className={`
                                flex items-center gap-4 transition-all duration-200 group w-full text-left
                                hover:bg-black/5 dark:hover:bg-white/5 rounded-xl
                              `}
                              style={inactiveItemStyle}
                           >
                                <Icon
                                    size={20}
                                    style={{
                                        color: item.isDangerous ? '#EF4444' : themeStyles.textSecondary,
                                        opacity: 0.7
                                    }}
                                />
                                <span
                                    className={`font-medium text-[15px]`}
                                    style={{ color: item.isDangerous ? '#EF4444' : themeStyles.textSecondary }}
                                >
                                    {item.title}
                                </span>
                           </button>
                        );
                      }

                      // Strict active check
                      const isActive = pathname === item.href;

                      return (

                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={(e) => {
                            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                              if (item.href === '/settings' && pathname === '/settings') {
                                e.preventDefault();
                                setIsMobileDetail(true);
                              }
                            }
                          }}
                          className={`
                            flex items-center gap-4 transition-all duration-200 group
                            ${isActive ? '' : 'hover:bg-black/5 dark:hover:bg-white/5 rounded-xl'}
                          `}
                          style={isActive ? activeItemStyle : inactiveItemStyle}
                        >
                            <Icon
                                size={20}
                                style={{
                                    color: isActive ? (isDark ? '#FFFFFF' : themeStyles.activeItemText) : themeStyles.textSecondary,
                                    opacity: isActive ? 1 : 0.7
                                }}
                            />
                            <span className={`font-medium text-[15px]`}>
                                {item.title}
                            </span>
                        </Link>
                      );

                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* Center Container (Content) */}
          <div
            className={`flex-1 w-full p-4 md:p-8 min-h-[500px] lg:min-h-[600px] ${!isMobileDetail ? 'hidden lg:flex' : 'flex flex-col'}`}
            style={glassStyle}
          >
            {children}
          </div>

        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
