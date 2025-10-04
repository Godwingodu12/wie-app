import React, { useState, useEffect } from "react";
import { getMe } from "../../services/userService";

import SideBar from "../../components/HomePage/SideBar.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";

import WieLogo from "../../assets/HomePage/WieLogo.svg";
import NotificationIcon from "../../assets/HomePage/NotificationIcon.svg";

const HEADER_HEIGHT = 72;

const CustomScrollbarStyles = () => (
  <style>{`
    * {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    *::-webkit-scrollbar {
      display: none;
    }
    
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
  `}</style>
);

const DeletedEvent = () => {
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const theme = isDark
    ? {
        bg: "bg-[#212426]",
        text: "text-white",
        subText: "text-[#c9c9cf]",
        cardBg: "bg-[#212426]",
        subCardBg: "bg-[#1c1e20]",
        border: "border-gray-700",
        notificationShadow: "inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)",
      }
    : {
        bg: "#f9f9f9",
        text: "text-gray-900",
        subText: "text-gray-600",
        cardBg: "#f2f2f2",
        subCardBg: "#f2f2f2",
        border: "border-gray-300",
        notificationShadow: "inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)",
      };

  return (
    <>
      <CustomScrollbarStyles />
      <div className={`${theme.bg} ${theme.text} min-h-screen flex overflow-hidden transition-colors duration-300`}>
        {/* Sidebar - Fixed */}
        <div 
          className="hidden md:flex flex-col flex-shrink-0 transition-colors duration-300"
          style={{ 
            position: 'fixed', 
            left: 0, 
            top: 0, 
            bottom: 0, 
            width: '80px',
            zIndex: 40,
            backgroundColor: isDark ? '#212426' : '#f9f9f9',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          <div className="flex items-center justify-center" style={{ height: HEADER_HEIGHT }}>
            <img src={WieLogo} alt="Wie Logo" className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <SideBar user={user} theme={theme} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 md:ml-20 lg:ml-20 overflow-x-hidden">
          {/* Top Header */}
          <header className="flex items-center justify-between px-3 md:px-4 lg:px-6 w-full overflow-hidden" style={{ height: HEADER_HEIGHT }}>
            <div className="flex items-center gap-4 w-full">
              <div className="flex-1 min-w-0">
                <SearchBar 
                  theme={theme}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div 
                    style={{ boxShadow: theme.notificationShadow }} 
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${theme.bg} transition-colors duration-300`}
                  >
                    <img src={NotificationIcon} alt="Notification" className={`w-4 h-4 ${isDark ? 'filter brightness-0 invert' : 'filter brightness-0'}`} />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">12</span>
                </div>
                <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-3 md:p-4 lg:p-6 overflow-y-auto overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              {/* Page Title */}
              <h1 className={`text-xl md:text-3xl font-bold ${theme.text} mb-6 md:mb-8`}>
                Deleted events
              </h1>

              {/* Empty State Card */}
              <div 
                className={`rounded-[2.5rem] p-8 md:p-16 flex flex-col items-center justify-center min-h-[500px] ${theme.cardBg}`}
                style={{
                  boxShadow: isDark 
                    ? 'inset 5px 5px 10px #0d0e0f,inset -5px -5px 10px #353a3d'
                    : 'inset -5px -5px 10px #606060,inset 5px 5px 10px #ffffff'
                }}
              >
                {/* Trash Box Icon */}
                <div className="relative mb-8">
                  <svg width="140" height="160" viewBox="0 0 140 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Box Base */}
                    <path 
                      d="M25 45 L115 45 L110 135 L30 135 Z" 
                      fill={isDark ? "#2a2d30" : "#e5e5e5"} 
                      stroke={isDark ? "#4a4d50" : "#bdbdbd"} 
                      strokeWidth="3"
                    />
                    
                    {/* Box Lid */}
                    <ellipse 
                      cx="70" 
                      cy="40" 
                      rx="50" 
                      ry="10" 
                      fill={isDark ? "#3a3d40" : "#d0d0d0"} 
                      stroke={isDark ? "#4a4d50" : "#bdbdbd"} 
                      strokeWidth="3"
                    />
                    
                    {/* Flying Paper with animation */}
                    <g style={{ animation: 'float 2s ease-in-out infinite' }}>
                      <path 
                        d="M55 8 L80 8 L78 28 L57 28 Z" 
                        fill={isDark ? "#ffffff" : "#666666"} 
                        opacity="0.9"
                      />
                      <line x1="60" y1="13" x2="75" y2="13" stroke={isDark ? "#000" : "#fff"} strokeWidth="1.5"/>
                      <line x1="60" y1="18" x2="75" y2="18" stroke={isDark ? "#000" : "#fff"} strokeWidth="1.5"/>
                      <line x1="60" y1="23" x2="70" y2="23" stroke={isDark ? "#000" : "#fff"} strokeWidth="1.5"/>
                    </g>
                    
                    {/* Dotted line showing paper movement */}
                    <line 
                      x1="68" 
                      y1="28" 
                      x2="70" 
                      y2="45" 
                      stroke={isDark ? "#666" : "#999"} 
                      strokeWidth="2" 
                      strokeDasharray="4 4"
                      opacity="0.5"
                    />
                  </svg>
                  
                  <style>{`
                    @keyframes float {
                      0%, 100% { transform: translateY(0px); }
                      50% { transform: translateY(-10px); }
                    }
                  `}</style>
                </div>

                {/* Message Text */}
                <p className={`text-lg md:text-xl ${theme.text}`}>
                  You have no deleted events
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default DeletedEvent;