"use client";

import React from "react";
import Image from "next/image";
import PostIcon from "@/assets/Home/PostIcon.png";
import NotificationsIcon from "@/assets/Home/NotificationsIcon.png";
import MessageIcon from "@/assets/Home/MessageIcon.png";
import WieUserLogo from "@/assets/Home/WieUserLogo.svg";
import { useTheme } from "./ThemeContext";

interface TopMobBarProps {
  notificationCount?: number;
  messageCount?: number;
  onNotificationClick: () => void;
  onMessageClick: () => void;
  onPostClick?: () => void;
}

const TopMobBar: React.FC<TopMobBarProps> = ({
  notificationCount = 0,
  messageCount = 0,
  onNotificationClick,
  onMessageClick,
  onPostClick
}) => {
  const { themeStyles, isDark } = useTheme();

  // Helper to format count (show "9+" for 10 or more)
  const formatCount = (count: number | undefined): string => {
    if (!count || count === 0) return "0";
    if (count > 9) return "9+";
    return count.toString();
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 py-2 pt-[calc(8px+env(safe-area-inset-top))]"
      style={{
        background: themeStyles.sidebarBg,
        height: "64px", // Increased height
        // borderBottom removed for seamless blending
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <Image
          src={WieUserLogo}
          alt="Wie Logo"
          width={32}
          height={32}
          className="flex-shrink-0"
          style={{ filter: themeStyles.iconFilter }}
        />
        <span
          className="font-medium text-xl tracking-normal"
          style={{
            fontFamily: "SF Pro, -apple-system, sans-serif",
            color: themeStyles.text
          }}
        >
          Wie
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Add Post Button */}
        <button
          onClick={onPostClick}
          className="relative flex items-center justify-center w-8 h-8 rounded-full transition-opacity active:opacity-70"
        >
          <Image
            src={PostIcon}
            alt="Post"
            width={24}
            height={24}
            style={{ filter: themeStyles.iconFilter }}
          />
        </button>

        {/* Notifications */}
        <button
          onClick={onNotificationClick}
          className="relative flex items-center justify-center w-8 h-8 rounded-full transition-opacity active:opacity-70"
        >
          <Image
            src={NotificationsIcon}
            alt="Notifications"
            width={24}
            height={24}
            style={{ filter: themeStyles.iconFilter }}
          />
          {notificationCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold text-[10px] text-white shadow-lg shadow-purple-500/20"
              style={{
                background: "linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)",
                border: `2px solid ${themeStyles.sidebarBg}`,
                zIndex: 10
              }}
            >
              {formatCount(notificationCount)}
            </span>
          )}
        </button>

        {/* Messages */}
        <button
          onClick={onMessageClick}
          className="relative flex items-center justify-center w-8 h-8 rounded-full transition-opacity active:opacity-70"
        >
          <Image
            src={MessageIcon}
            alt="Message"
            width={24}
            height={24}
            style={{ filter: themeStyles.iconFilter }}
          />
          {messageCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold text-[10px] text-white shadow-lg shadow-purple-500/20"
              style={{
                background: "linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)",
                border: `2px solid ${themeStyles.sidebarBg}`,
                zIndex: 10
              }}
            >
              {formatCount(messageCount)}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
export default TopMobBar;
