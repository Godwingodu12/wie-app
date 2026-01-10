import React from "react";
import Image from "next/image";
import { useTheme } from "./ThemeContext";

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  notificationCount?: number;
}

interface MobileNavigationProps {
  items: NavItem[];
  // Better to pass isActive function if logic is complex
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
      className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 pb-safe transition-colors duration-300"
      style={{
        background: themeStyles.background,
        borderTop: `1px solid ${themeStyles.border}`
      }}
    >
      <div className="flex justify-around items-center">
        {items.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => onNavClick(item.path)}
              className="flex flex-col items-center gap-1 relative p-1"
            >
              <div className="relative">
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={24}
                  height={24}
                  className={`transition-all duration-200 ${
                    active
                      ? "opacity-100"
                      : "opacity-60"
                  }`}
                  style={{
                    filter: active
                      ? themeStyles.activeIconFilter
                      : themeStyles.iconFilter
                  }}
                />
                {/* Only show badge if count is strictly greater than 0 */}
                {item.notificationCount !== undefined && Number(item.notificationCount) > 0 && (
                  <span
                    className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ border: `1px solid ${themeStyles.background}` }}
                  >
                    {Number(item.notificationCount) > 99 ? "99+" : item.notificationCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-200`}
                style={{
                  color: active ? themeStyles.text : themeStyles.textSecondary
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;
