'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  User,
  Shield,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  UserX,
  HeadphonesIcon,
  ShieldCheck,
  SquareUser,
  Zap,
  BookOpen,
  Film,
  Settings2,
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { useTheme } from '@/components/home/ThemeContext';
import WieUserLogo from "@/assets/Home/WieUserLogo.svg";
import WieLight from "@/assets/Home/WieLight.png";
import WieDark from "@/assets/Home/WieDark.png";
import { logout } from '@/services/wieUserService';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMobile } = useSidebar();
  const { isDark, themeStyles, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const isOnRootSettings = pathname === '/settings';

  const getPageTitle = () => {
    if (pathname === '/settings') return 'Settings';
    if (pathname === '/settings/account') return 'Account Management';
    if (pathname === '/settings/account/personal-details') return 'Personal Details';
    if (pathname === '/settings/account/profile') return 'Profile Details';
    if (pathname === '/settings/account/security') return 'Password & Security';
    if (pathname === '/settings/privacy') return 'Privacy & Safety';
    if (pathname === '/settings/privacy/blocked') return 'Blocked Accounts';
    if (pathname === '/settings/app-experience') return 'App Experience';
    if (pathname === '/settings/app-experience/notifications') return 'Notifications';
    if (pathname === '/settings/app-experience/help') return 'Help & Support';
    if (pathname === '/settings/app-experience/privacy-center') return 'Privacy Center';
    // Post & Flux
    if (pathname === '/settings/post') return 'Post & Flux';
    if (pathname === '/settings/post/flux') return 'Flux Settings';
    if (pathname === '/settings/post/flux/story-settings') return 'Story Settings';
    if (pathname === '/settings/post/flux/close-friends') return 'Close Friends';
    if (pathname === '/settings/post/diary') return 'Diary Settings';
    return 'Settings';
  };

  const handleBack = () => {
    if (!isOnRootSettings && isMobile) {
      // Go up one level in the hierarchy
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length > 1) {
        parts.pop();
        router.push('/' + parts.join('/'));
      } else {
        router.push('/settings');
      }
    } else {
      router.push('/home');
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
      router.push('/login');
    }
  };

  const sidebarSections = [
    {
      title: 'Account Management',
      items: [
        { title: 'Profile Details', icon: User, href: '/settings/account/profile' },
        { title: 'Password & Security', icon: ShieldCheck, href: '/settings/account/security' },
        { title: 'Personal Details', icon: SquareUser, href: '/settings/account/personal-details' },
      ],
    },
    {
      title: 'Privacy & Safety',
      items: [
        { title: 'Account Privacy', icon: Shield, href: '/settings/privacy' },
        { title: 'Blocked Accounts', icon: UserX, href: '/settings/privacy/blocked' },
      ],
    },
    {
      // ── Post & Flux — top-level entry; sub-pages appear when active ──
      title: 'Post & Flux',
      items: [
        { title: 'Flux Settings', icon: Film, href: '/settings/post/flux' },
        { title: 'Diary Settings', icon: BookOpen, href: '/settings/post/diary' },
      ],
    },
    {
      title: 'App Experience',
      items: [
        { title: 'Notifications', icon: Bell, href: '/settings/app-experience/notifications' },
        { title: 'Help & Support', icon: HeadphonesIcon, href: '/settings/app-experience/help' },
        { title: 'Privacy Center', icon: ShieldCheck, href: '/settings/app-experience/privacy-center' },
      ],
    },
    {
      title: 'More Options',
      items: [
        {
          title: isDark ? 'Light Mode' : 'Dark Mode',
          icon: isDark ? Sun : Moon,
          onClick: toggleTheme,
          isAction: true,
        },
        {
          title: 'Log Out',
          icon: LogOut,
          onClick: handleLogout,
          isAction: true,
          isDangerous: true,
        },
      ],
    },
  ];

  const glassStyle = {
    background: themeStyles.cardBg,
    backdropFilter: 'blur(60px)',
    borderRadius: isMobile ? '12px' : '24px',
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

  const NavItem = ({ item }: { item: any }) => {
    const Icon = item.icon;
    if (item.isAction) {
      return (
        <button
          onClick={item.onClick}
          className="flex items-center justify-between gap-4 transition-all duration-200 w-full text-left hover:bg-black/5 dark:hover:bg-white/5 rounded-xl"
          style={inactiveItemStyle}
        >
          <div className="flex items-center gap-4">
            <Icon
              size={20}
              style={{ color: item.isDangerous ? '#EF4444' : themeStyles.textSecondary, opacity: 0.7 }}
            />
            <span
              className="font-medium text-[15px]"
              style={{ color: item.isDangerous ? '#EF4444' : themeStyles.textSecondary }}
            >
              {item.title}
            </span>
          </div>
        </button>
      );
    }

    // An item is "active" if the current pathname starts with its href
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

    return (
      <Link
        href={item.href}
        className={`flex items-center justify-between gap-2 transition-all duration-200 ${isActive ? '' : 'hover:bg-black/5 dark:hover:bg-white/5 rounded-xl'
          }`}
        style={isActive ? activeItemStyle : inactiveItemStyle}
      >
        <div className="flex items-center gap-4">
          <Icon
            size={20}
            style={{
              color: isActive
                ? isDark ? '#FFFFFF' : themeStyles.activeItemText
                : themeStyles.textSecondary,
              opacity: isActive ? 1 : 0.7,
            }}
          />
          <span className="font-medium text-[15px]">{item.title}</span>
        </div>
        <ChevronRight size={16} style={{ color: themeStyles.textSecondary, opacity: 0.4 }} className="lg:hidden" />
      </Link>
    );
  };

  return (
    <div
      className="min-h-screen font-sans transition-colors duration-300"
      style={{ background: themeStyles.background, color: themeStyles.text }}
    >
      <main
        className="transition-all duration-300 ease-in-out min-h-screen flex flex-col"
        style={{ marginLeft: 0, paddingBottom: isMobile ? '80px' : '32px' }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b lg:static lg:border-none lg:bg-transparent lg:px-12 lg:pt-8 lg:pb-0 lg:mb-6"
          style={{ background: themeStyles.background, borderColor: themeStyles.border }}
        >
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <ChevronLeft size={22} style={{ color: themeStyles.text }} />
          </button>
          <h1 className="font-bold text-lg lg:text-2xl truncate" style={{ color: themeStyles.text }}>
            {getPageTitle()}
          </h1>
        </div>

        {/* Mobile */}
        <div className="flex flex-col lg:hidden flex-1 px-3 py-4 gap-3">
          {isOnRootSettings ? (
            sidebarSections.map((section, idx) => (
              <div key={idx} style={{ ...glassStyle, borderRadius: '12px' }} className="overflow-hidden">
                <h3
                  className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider"
                  style={{ color: themeStyles.textSecondary }}
                >
                  {section.title}
                </h3>
                <div className="flex flex-col">
                  {section.items.map((item: any, i: number) => (
                    <div
                      key={item.title}
                      className="px-2"
                      style={i < section.items.length - 1 ? { borderBottom: `1px solid ${themeStyles.border}` } : {}}
                    >
                      <NavItem item={item} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col flex-1 overflow-auto" style={glassStyle}>
              {children}
            </div>
          )}
        </div>

        {/* Desktop */}
        <div className="hidden lg:flex flex-row gap-6 px-4 md:px-8 xl:px-12 items-start justify-center w-full max-w-[1400px] mx-auto">
          <aside
            className="w-[30%] max-w-[380px] flex-shrink-0 flex flex-col p-6 gap-6 min-h-[600px] sticky top-8"
            style={glassStyle}
          >
            <div className="flex items-center gap-3 px-4 mb-2">
              <Image
                src={WieUserLogo}
                alt="Wie Logo"
                width={32}
                height={32}
                className="flex-shrink-0"
                style={{ filter: themeStyles.iconFilter }}
              />
              <Image
                src={isDark ? WieDark : WieLight}
                alt="Wie"
                width={65}
                height={28}
                className="object-contain h-[28px] w-auto flex-shrink-0"
              />
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
                    {section.items.map((item: any) => (
                      <NavItem key={item.title} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          <div className="flex-1 p-6 xl:p-8 min-h-[600px] flex flex-col" style={glassStyle}>
            {children}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
