import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BackArrowIcon from "../../assets/Settings/BackArrowIcon.svg";

import PersonalIcon from "../../assets/Settings/PersonalIcon.svg";
import PasswordIcon from "../../assets/Settings/PasswordIcon.svg";
import EventIcon from "../../assets/Settings/EventIcon.svg";
import EditIcon from "../../assets/Settings/EditIcon.svg";
import NotificationSettingsIcon from "../../assets/Settings/NotificationSettingsIcon.svg";
import SyncIcon from "../../assets/Settings/SyncIcon.svg";
import NetworksIcon from "../../assets/Settings/NetworksIcon.svg";
import GroupIcon from "../../assets/Settings/GroupIcon.svg";
import ActiveIcon from "../../assets/Settings/ActiveIcon.svg";
import LanguagesIcon from "../../assets/Settings/LanguagesIcon.svg";

const SettingsNavigation = ({
  theme,
  isDark,
  isMobile,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false); // Changed to false by default

  const handleGoBack = () => {
    navigate('/profile');
  };

  const sidebarItems = [
    {
      title: "Wie account centre",
      subtitle: "Your space, your relationships, how your account works for you.",
      items: [
        { icon: PersonalIcon, text: "Personal details", path: "/settings/personalDetails" },
        { icon: PasswordIcon, text: "Password & security", path: "/settings/password-security" },
        { icon: EventIcon, text: "Event history", path: "/settings/eventHistory" },
      ],
    },
    {
      title: "How to use Wie centre",
      items: [
        { icon: EditIcon, text: "Edit profile", path: "/settings/editprofile" },
        { icon: NotificationSettingsIcon, text: "Notification", path: "/settings/notifications" },
      ],
    },
    {
      title: "For professional use",
      items: [
        { icon: SyncIcon, text: "Sync account", path: "/settings/syncAccount" },
        { icon: NetworksIcon, text: "Networks", path: "/settings/networks" },
        { icon: GroupIcon, text: "Group settings", path: "/settings/groupSettings" },
      ],
    },
    {
      title: "What you see",
      items: [
        { icon: ActiveIcon, text: "Active devices", path: "/settings/activeDevices" },
        { icon: LanguagesIcon, text: "Languages and region", path: "/settings/languages" },
      ],
    },
  ];

  const handleItemClick = (path) => {
    if (path) {
      navigate(path);
      if (isMobile && onClose) {
        onClose();
      }
    }
  };

  const SidebarContent = () => (
    <div className="space-y-6 md:space-y-8">
      {sidebarItems.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          <h3
            className={`mb-2 text-sm font-semibold ${
              isDesktopCollapsed ? "hidden" : ""
            }`}
          >
            {section.title}
          </h3>
          {section.subtitle && (
            <p
              className={`mb-4 text-xs text-gray-500 ${
                isDesktopCollapsed ? "hidden" : ""
              }`}
            >
              {section.subtitle}
            </p>
          )}
          <div className="space-y-1">
            {section.items.map((item, itemIndex) => {
              const isActive = location.pathname === item.path;
              return (
                <div
                  key={itemIndex}
                  onClick={() => handleItemClick(item.path)}
                  title={isDesktopCollapsed ? item.text : undefined}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-all duration-200 ${
                    isDesktopCollapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "text-black dark:text-white font-bold"
                      : "opacity-60 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  }`}
                  style={isActive ? { boxShadow: theme.inputShadow, backgroundColor: theme.inputBg.replace('bg-','') } : {}}
                >
                  <img
                    src={item.icon}
                    alt={item.text}
                    className={`h-5 w-5 flex-shrink-0 ${isDark ? "filter brightness-0 invert" : ""} ${
                      isActive ? "opacity-100" : "opacity-60"
                    }`}
                  />
                  <span
                    className={`whitespace-nowrap text-sm ${
                      isDesktopCollapsed ? "hidden" : ""
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // Mobile overlay
  if (isMobile) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-40">
        <div
          className="absolute inset-0 bg-black/60"
          onClick={onClose}
        />
        <div className={`relative w-80 h-full p-4 md:p-6 ${theme.sidebarBg} ${theme.text}`}>
          <div className="mb-6 flex items-center gap-2 md:mb-8">
            <button
              className="rounded-full p-3 transition-all duration-300"
              style={{ boxShadow: theme.notificationShadow }}
              onClick={handleGoBack}
            >
              <img
                src={BackArrowIcon}
                alt="Close"
                className={`h-3 w-3 ${isDark ? "filter brightness-0 invert" : ""}`}
              />
            </button>
            <h2 className="text-lg font-semibold">Settings</h2>
          </div>
          <SidebarContent />
        </div>
      </div>
    );
  }

  // Desktop sidebar - Fixed width to always show text
  return (
    <div
      className={`relative flex-shrink-0 transition-all duration-300 ease-in-out ${theme.sidebarBg} w-80`}
      style={{
        borderRadius: '50px 0 0 50px',
        boxShadow: '6px 6px 12px 0px rgba(0, 0, 0, 0.18) inset, -6px -6px 12px 0px rgba(255, 255, 255, 0.08) inset'
      }}
    >
      <div className="p-4 md:p-6 h-full overflow-y-auto">
        <div className="mb-6 flex items-center gap-2 md:mb-8">
          <button
            className="rounded-full p-3 transition-all duration-300"
            style={{ boxShadow: theme.notificationShadow }}
            onClick={handleGoBack}
          >
            <img
              src={BackArrowIcon}
              alt="Toggle Sidebar"
              className={`h-3 w-3 transform transition-transform duration-300 ${
                isDesktopCollapsed ? "rotate-180" : ""
              } ${isDark ? "filter brightness-0 invert" : ""}`}
            />
          </button>
          <h2 className={`text-lg font-semibold ${isDesktopCollapsed ? "hidden" : ""}`}>
            Settings
          </h2>
        </div>
        <SidebarContent />
      </div>
    </div>
  );
};
export default SettingsNavigation;