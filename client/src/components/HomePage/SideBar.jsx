// src/components/HomePage/SideBar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

// ICONS
import HomeIcon from "../../assets/HomePage/HomeIcon.svg";
import TicketIcon from "../../assets/HomePage/TicketIcon.svg";
import OrgIcon from "../../assets/HomePage/OrgIcon.svg";
import SpeakerIcon from "../../assets/HomePage/SpeakerIcon.svg";
import ChatIcon from "../../assets/HomePage/ChatIcon.svg";
import Vector from "../../assets/HomePage/Vector.svg";
import SettingIcon from "../../assets/HomePage/SettingIcon.svg";

const SIDEBAR_WIDTH = 90;

const Sidebar = ({ user, theme }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Check if currently on home page
  const isHomePage = currentPath === "/home";

  const isDark = theme.bg === "bg-[#212426]";

  return (
    <aside
      className={`flex flex-col justify-between items-center ${theme.bg} py-4 lg:py-6 mt-16 lg:mt-20 transition-colors duration-300 h-full lg:h-auto min-h-screen lg:min-h-0`}
      style={{ width: SIDEBAR_WIDTH }}
    >
      {/* TOP SECTION */}
      <div 
        className={`${theme.cardBg} rounded-full flex flex-col gap-4 lg:gap-6 items-center py-3 w-12 lg:w-14 transition-all duration-300`}
        style={{
          boxShadow: isDark 
            ? '-4px -4px 8px rgba(255,255,255,0.08), 4px 4px 8px rgba(0,0,0,0.4)'
            : '-4px -4px 8px rgba(255,255,255,0.8), 4px 4px 8px rgba(0,0,0,0.15)'
        }}
      >
        {/* Home Icon - Static pressed effect */}
        <div
          onClick={() => {
            // Stay on homepage if already there, otherwise navigate
            if (!isHomePage) {
              window.location.href = "/";
            }
          }}
          className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer
            ${isDark 
              ? 'bg-[#212426] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),inset_-2px_-2px_4px_rgba(60,60,60,0.3)]' 
              : 'bg-white border border-gray-300 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]'
            }`}
        >
          <img 
            src={HomeIcon} 
            alt="Home" 
            className="w-3 h-3 lg:w-4 lg:h-4"
            style={{ filter: isDark ? 'none' : 'invert(1)' }}
          />
        </div>  

        {/* Navigation Icons */}
        <Link 
          to="/ticket/events" 
          className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
        >
          <img 
            src={TicketIcon} 
            alt="Ticket" 
            className={`w-4 h-4 lg:w-5 lg:h-5 ${isDark ? '' : 'filter brightness-0 opacity-70'}`}
          />
        </Link>

        <Link 
          to="/ticket/groups" 
          className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
        >
          <img 
            src={OrgIcon} 
            alt="Org" 
            className={`w-4 h-4 lg:w-5 lg:h-5 ${isDark ? '' : 'filter brightness-0 opacity-70'}`}
          />
        </Link>

        <Link 
          to="/ticket/speakers" 
          className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
        >
          <img 
            src={SpeakerIcon} 
            alt="Speaker" 
            className={`w-4 h-4 lg:w-5 lg:h-5 ${isDark ? '' : 'filter brightness-0 opacity-70'}`}
          />
        </Link>

        <Link 
          to="/ticket/chats" 
          className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity"
        >
          <img 
            src={ChatIcon} 
            alt="Chat" 
            className={`w-4 h-4 lg:w-5 lg:h-5 ${isDark ? '' : 'filter brightness-0 opacity-70'}`}
          />
        </Link>

        <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full mt-1 hover:opacity-80 transition-opacity cursor-pointer">
          <img 
            src={Vector} 
            alt="Vector" 
            className={`w-5 h-5 lg:w-6 lg:h-6 ${isDark ? '' : 'filter brightness-0 opacity-70'}`}
          />
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div 
        className={`${theme.cardBg} rounded-full flex flex-col items-center gap-4 lg:gap-6 py-3 w-12 lg:w-14 transition-all duration-300`}
        style={{
          boxShadow: isDark 
            ? '-4px -4px 8px rgba(255,255,255,0.08), 4px 4px 8px rgba(0,0,0,0.4)'
            : '-4px -4px 8px rgba(255,255,255,0.8), 4px 4px 8px rgba(0,0,0,0.15)'
        }}
      >
        {/* Settings Icon */}
        <button className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity">
          <img 
            src={SettingIcon} 
            alt="Settings" 
            className={`w-4 h-4 lg:w-5 lg:h-5 opacity-70 hover:opacity-100 transition-opacity ${isDark ? '' : 'filter brightness-0'}`}
          />
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#6a47fa] rounded-full flex items-center justify-center text-white font-bold text-sm lg:text-lg">
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;