import React from "react";
import Image from "next/image";
import { useTheme } from "./ThemeContext";

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  notificationCount?: number;
  isProfile?: boolean; // Added flag for profile rendering
}

interface MobileNavigationProps {
  items: NavItem[];
  isActive: (path: string) => boolean;
  onNavClick: (path: string) => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items,
  isActive,
  onNavClick,
}) => {
  const { themeStyles, isDark } = useTheme();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[60] px-[6px] transition-colors duration-300 pb-[env(safe-area-inset-bottom)]"
      style={{
        background: themeStyles.sidebarBg,
        height: "calc(64px + env(safe-area-inset-bottom))", // Increased height
      }}
    >
      <div className="flex justify-between items-center h-[64px] w-full mx-auto" style={{ gap: "10px" }}>
        {items.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => onNavClick(item.path)}
              className="flex flex-col items-center justify-center relative flex-1 h-full"
            >
              <div className="relative flex items-center justify-center">
                {item.isProfile ? (
                  // Profile Avatar Rendering
                  item.icon ? (
                    <Image
                      src={item.icon}
                      alt={item.label}
                      width={24}
                      height={24}
                      className={`rounded-full shrink-0 aspect-square object-cover border-[1.5px] transition-all duration-200 ${
                        active ? "border-white" : "border-transparent"
                      }`}
                    />
                  ) : (
                    // Fallback Profile Icon if no avatar
                    <div className="w-[24px] h-[24px] rounded-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] flex items-center justify-center border-[1.5px] border-white">
                      <span className="text-[10px] font-bold text-white">U</span>
                    </div>
                  )
                ) : (
                  // Standard Icon Rendering
                  <Image
                    src={item.icon}
                    alt={item.label}
                    width={24}
                    height={24}
                    className={`transition-all duration-200 ${
                      active ? "opacity-100" : "opacity-60"
                    }`}
                    style={{
                      filter: active
                        ? themeStyles.activeIconFilter
                        : themeStyles.iconFilter
                    }}
                  />
                )}

                {/* Notification Badge (Only if count > 0) */}
                {item.notificationCount !== undefined && Number(item.notificationCount) > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-[8px] font-bold text-white flex items-center justify-center"
                    style={{ border: `1px solid ${themeStyles.sidebarBg}` }}
                  >
                   {Number(item.notificationCount) > 9 ? "9+" : item.notificationCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;