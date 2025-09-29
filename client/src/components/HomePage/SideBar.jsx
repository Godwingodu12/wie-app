// src/components/HomePage/SideBar.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getMe } from "../../services/userService.js";
// ICONS
import HomeIcon from "../../assets/HomePage/HomeIcon.svg";
import TicketIcon from "../../assets/HomePage/TicketIcon.svg";
import OrgIcon from "../../assets/HomePage/OrgIcon.svg";
import SpeakerIcon from "../../assets/HomePage/SpeakerIcon.svg";
import ChatIcon from "../../assets/HomePage/ChatIcon.svg";
import Vector from "../../assets/HomePage/Vector.svg";
import SettingIcon from "../../assets/HomePage/SettingIcon.svg";

const SIDEBAR_WIDTH = 80;

const Sidebar = ({ user, theme }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [userImage, setUserImage] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        // Construct the image URL if user has an image
        if (res.data.image) {
          const imageUrl = `${import.meta.env.VITE_AUTH_API_BASE_URL}/uploads/${res.data.image}`;
          setUserImage(imageUrl);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  // Check if currently on home page
  const isHomePage = currentPath === "/home";
  const isDark = theme.bg === "bg-[#212426]";

  return (
    <aside
      className={`flex flex-col items-center ${theme.bg} py-4 transition-colors duration-300 flex-shrink-0`}
      style={{
        width: SIDEBAR_WIDTH,
        height: "100%",
        maxHeight: "100vh",
        minHeight: "auto",
      }}
    >
      {/* TOP SECTION - Navigation Icons */}
      <div className="flex flex-col items-center w-full mb-8 sm:mb-12 lg:mb-16">
        <div
          className={`${theme.cardBg} rounded-full flex flex-col items-center py-2 sm:py-3 w-10 sm:w-12 lg:w-14 transition-all duration-300`}
          style={{
            gap: "0.75rem",
            boxShadow: isDark
              ? "-4px -4px 8px rgba(255,255,255,0.08), 4px 4px 8px rgba(0,0,0,0.4)"
              : "-4px -4px 8px rgba(255,255,255,0.8), 4px 4px 8px rgba(0,0,0,0.15)",
          }}
        >
          {/* Home Icon - Static pressed effect */}
          <div
            onClick={() => {
              if (!isHomePage) {
                window.location.href = "/";
              }
            }}
            className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-11 lg:h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer
              ${
                isDark
                  ? "bg-[#212426] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.6),inset_-3px_-2px_6px_rgba(255,255,255,0.15)]"
                  : "bg-white border border-gray-300 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]"
              }`}
          >
            <img
              src={HomeIcon}
              alt="Home"
              className="w-3 h-3 sm:w-5 sm:h-5"
              style={{ filter: isDark ? "none" : "invert(1)" }}
            />
          </div>

          {/* Navigation Icons */}
          <Link
            to="/ticket/events"
            className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
          >
            <img
              src={TicketIcon}
              alt="Ticket"
              className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${
                isDark ? "" : "filter brightness-0 opacity-70"
              }`}
            />
          </Link>

          <Link
            to="/ticket/groups"
            className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
          >
            <img
              src={OrgIcon}
              alt="Org"
              className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${
                isDark ? "" : "filter brightness-0 opacity-70"
              }`}
            />
          </Link>

          <Link
            to="/ticket/speakers"
            className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
          >
            <img
              src={SpeakerIcon}
              alt="Speaker"
              className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-4 ${
                isDark ? "" : "filter brightness-0 opacity-70"
              }`}
            />
          </Link>
          <Link
            to="/message"
            className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
          >
            <img
              src={ChatIcon}
              alt="Chat"
              className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${
                isDark ? "" : "filter brightness-0 opacity-70"
              }`}
            />
          </Link>
          <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity cursor-pointer">
            <img
              src={Vector}
              alt="Vector"
              className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-4 ${
                isDark ? "" : "filter brightness-0 opacity-70"
              }`}
            />
          </div>
        </div>
      </div>
      {/* FLEXIBLE SPACER - Reduced to move bottom section up */}
      <div className="flex-1 min-h-4 max-h-12 lg:max-h-4"></div>
      
      {/* BOTTOM SECTION - Settings and Profile */}
      <div className="flex flex-col items-center w-full mb-4">
        <div
          className={`${theme.cardBg} rounded-full flex flex-col items-center py-2 sm:py-3 w-10 sm:w-12 lg:w-14 transition-all duration-300`}
          style={{
            gap: "0.75rem",
            boxShadow: isDark
              ? "-4px -4px 8px rgba(255,255,255,0.08), 4px 4px 8px rgba(0,0,0,0.4)"
              : "-4px -4px 8px rgba(255,255,255,0.8), 4px 4px 8px rgba(0,0,0,0.15)",
          }}
        >
          <button className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity">
            <img
              src={SettingIcon}
              alt="Settings"
              className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 opacity-70 hover:opacity-100 transition-opacity ${
                isDark ? "" : "filter brightness-0"
              }`}
            />
          </button>
<Link
  to="/profile"
  className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity"
>
  {user?.image ? (
    <img
      src={`${import.meta.env.VITE_AUTH_API_BASE_URL}/uploads/${user.image}`}
      alt="User profile"
      className="w-full h-full object-cover rounded-full"
      onError={(e) => {
        console.error('Image failed to load:', e.target.src);
        e.target.style.display = 'none';
      }}
    />
  ) : (
    <div className="w-full h-full bg-[#6a47fa] rounded-full flex items-center justify-center">
      <span className="text-white font-bold text-xs sm:text-sm lg:text-lg">
        {user?.name?.[0]?.toUpperCase() || "U"}
      </span>
    </div>
  )}
</Link> 
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
