// src/pages/HomePage/HomePage.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../services/authService";
import { logoutSuccess } from "../../features/auth/authSlice";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getGroups } from "../../services/ticketService";
import GroupSelectionModal from "../../components/modals/GroupSelectionModal";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import SideBar from "../../components/HomePage/SideBar.jsx";
// ICONS
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import HomeIcon from "../../assets/HomePage/HomeIcon.svg";
import TicketIcon from "../../assets/HomePage/TicketIcon.svg";
import OrgIcon from "../../assets/HomePage/OrgIcon.svg";
import SpeakerIcon from "../../assets/HomePage/SpeakerIcon.svg";
import ChatIcon from "../../assets/HomePage/ChatIcon.svg";
import Vector from "../../assets/HomePage/Vector.svg";
import SettingIcon from "../../assets/HomePage/SettingIcon.svg";
import CalenderIcon from "../../assets/HomePage/CalenderIcon.svg";
import EventCalenderIcon from "../../assets/HomePage/EventCalenderIcon.svg";
import MoneyIcon from "../../assets/HomePage/MoneyIcon.svg";
import MovieIcon from "../../assets/HomePage/MovieIcon.svg";
import RevenueIcon from "../../assets/HomePage/RevenueIcon.svg";
import LiveIcon from "../../assets/HomePage/LiveIcon.svg";
import GroupIcon from "../../assets/HomePage/GroupIcon.svg";
import NotificationIcon from "../../assets/HomePage/NotificationIcon.svg";
import PlusIcon from "../../assets/HomePage/PlusIcon.svg";

const dashboardStats = [
  { icon: EventCalenderIcon, title: "Total Event Created", temp: "🎈", value: "Nothing's Happening... Yet!" },
  { icon: MoneyIcon, title: "Today's Revenue", temp: "💸", value: "No Coins in the Jar Yet!" },
  { icon: MovieIcon, title: "Today's Booking", temp: "📭", value: "No Bookings Today!" },
];

const HEADER_HEIGHT = 72;
const SIDEBAR_WIDTH = 80; // Updated from 90 to 80 for better responsiveness

const HomePage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;

    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const getThemeStyles = () => {
    if (isDark) {
      return {
        bg: "bg-[#212426]",
        cardBg: "bg-[#212426]",
        sidebarBg: "bg-[#212426]",
        buttonBg: "bg-[#363650]",
        text: "text-white",
        subText: "text-[#c9c9cf]",
        border: "border-[#23233a]",
        inputBg: "bg-[#212426]",
      };
    } else {
      return {
        bg: "bg-white",
        cardBg: "bg-gray-50",
        sidebarBg: "bg-gray-100",
        buttonBg: "bg-gray-200",
        text: "text-gray-900",
        subText: "text-gray-600",
        border: "border-gray-200",
        inputBg: "bg-gray-100",
      };
    }
  };

  const theme = getThemeStyles();
  const currentPath = location.pathname;
  const isHomePage = currentPath === "/home" || currentPath === "/";

  const handleCreateEvent = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const groupsResponse = await getGroups();
      const groupsArray = Array.isArray(groupsResponse) ? groupsResponse : groupsResponse.data || [];
      setGroups(groupsArray);

      if (groupsArray.length === 0) {
        navigate("/ticket/create-group");
      } else if (groupsArray.length === 1) {
        navigate(`/ticket/create-event/${groupsArray[0]._id}`);
      } else {
        setIsModalOpen(true);
      }
    } catch {
      alert("Error fetching groups. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = (selectedGroup) => {
    setIsModalOpen(false);
    navigate(`/ticket/create-event/${selectedGroup._id}`);
  };

  const displayName = user?.name || "User";

  // Bottom Navigation Component for Mobile
  const BottomNavigation = () => (
    <nav className={`${theme.bg} border-t ${theme.border} px-4 py-2 fixed bottom-0 left-0 right-0 z-50`}>
      <div className="flex justify-around items-center max-w-md mx-auto">
        {/* Home */}
        <Link to="/home" className="flex flex-col items-center gap-1 p-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200
              ${isHomePage 
                ? isDark 
                  ? 'bg-[#212426] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),inset_-2px_-2px_4px_rgba(60,60,60,0.3)]'
                  : 'bg-white border border-gray-300 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]'
                : ''
              }`}
          >
            <img 
              src={HomeIcon} 
              alt="Home" 
              className={`w-4 h-4 ${!isDark ? 'filter brightness-0' : ''} ${isHomePage ? 'opacity-100' : 'opacity-70'}`}
            />
          </div>
          <span className={`text-xs ${isHomePage ? theme.text : theme.subText}`}>Home</span>
        </Link>

        {/* Tickets */}
        <Link to="/ticket/events" className="flex flex-col items-center gap-1 p-2">
          <img src={TicketIcon} alt="Tickets" className={`w-4 h-4 opacity-70 ${!isDark ? 'filter brightness-0' : ''}`} />
          <span className={`text-xs ${theme.subText}`}>Tickets</span>
        </Link>

        {/* Group */}
        <Link to="/ticket/groups" className="flex flex-col items-center gap-1 p-2">
          <img src={OrgIcon} alt="Group" className={`w-4 h-4 opacity-70 ${!isDark ? 'filter brightness-0' : ''}`} />
          <span className={`text-xs ${theme.subText}`}>Group</span>
        </Link>

        {/* Live */}
        <Link to="/ticket/live-events" className="flex flex-col items-center gap-1 p-2">
          <img src={SpeakerIcon} alt="Live" className={`w-4 h-4 opacity-70 ${!isDark ? 'filter brightness-0' : ''}`} />
          <span className={`text-xs ${theme.subText}`}>Live</span>
        </Link>

        {/* Chat */}
        <Link to="/ticket/chats" className="flex flex-col items-center gap-1 p-2">
          <img src={ChatIcon} alt="Chat" className={`w-4 h-4 opacity-70 ${!isDark ? 'filter brightness-0' : ''}`} />
          <span className={`text-xs ${theme.subText}`}>Chat</span>
        </Link>
      </div>
    </nav>
  );

  // Mobile View Component
  const MobileView = () => (
    <div className={`${theme.bg} ${theme.text} h-screen flex flex-col transition-colors duration-300`}>
      {/* Mobile Header */}
      <header className={`flex items-center justify-between px-4 py-3 ${theme.bg}`}>
        {/* Profile Button */}
        <Link to="/profile" className="w-10 h-10 rounded-full overflow-hidden">
          <div className="w-full h-full bg-[#6a47fa] flex items-center justify-center text-white font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </Link>

        {/* Right side buttons */}
        <div className="flex items-center gap-3">
          {/* Notification Button */}
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                ${isDark 
                  ? 'bg-[#212426] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),inset_-2px_-2px_4px_rgba(60,60,60,0.3)]' 
                  : 'bg-white border border-gray-300 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]'
                }`}
            >
              <img src={NotificationIcon} alt="Notification" className={`w-4 h-4 ${isDark ? '' : 'filter brightness-0'}`} />
            </div>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">12</span>
          </div>

          {/* Settings Button */}
          <button
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
              ${isDark 
                ? 'bg-[#212426] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),inset_-2px_-2px_4px_rgba(60,60,60,0.3)]' 
                : 'bg-white border border-gray-300 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]'
              }`}
          >
            <img src={SettingIcon} alt="Settings" className={`w-4 h-4 ${isDark ? '' : 'filter brightness-0'}`} />
          </button>
        </div>
      </header>

      {/* Mobile Content */}
      <main className="flex-1 px-4 pb-20 overflow-y-auto">
        {/* Greeting */}
        <div className="mb-4">
          <h1 className={`text-xl font-semibold ${theme.text}`}>Good day, {displayName}!</h1>
          <p className={`${theme.subText} text-sm`}>Let's Rock This!</p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <SearchBar
            theme={theme}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onTuneClick={() => console.log("Tune clicked")}
          />
        </div>

        {/* Create Event and Calendar Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleCreateEvent}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition h-12 flex-1
              ${theme.bg === "bg-[#212426]" 
                ? 'bg-[#212426] text-white hover:bg-[hsl(204,7%,16%)]' 
                : 'bg-[#f1f1f1] text-gray-900 hover:bg-gray-300'
              }`}
            style={{
              boxShadow: isDark 
                ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)'
                : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)'
            }}
          >
            <span className="bg-[#21d18b] rounded-full w-8 h-8 flex items-center justify-center -ml-2">
              <img src={PlusIcon} alt="Add" className="w-6 h-6" />
            </span>
            {loading ? "Checking..." : "Create event"}
          </button>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-full h-12
            ${theme.bg === "bg-[#212426]" ? theme.cardBg : 'bg-[#f1f1f1]'}`}
            style={{
              boxShadow: isDark 
                ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)'
                : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)'
            }}
          >
            <span className="bg-[#249EFF] rounded-full w-8 h-8 flex items-center justify-center -ml-2">
              <img 
                src={CalenderIcon} 
                alt="Calendar" 
                className={`w-5 h-5 ${theme.bg === "bg-[#212426]" ? '' : 'filter brightness-0 invert'}`}
              />
            </span>
            <span className={`${theme.text} text-sm`}>
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* All Cards - Mobile One by One */}
        <div className="space-y-4">
          {/* Stats Cards with Cutting Effect */}
          {dashboardStats.map((stat) => (
            <div
              key={stat.title}
              className={`${theme.cardBg} rounded-3xl relative p-6 flex flex-col items-center gap-3 min-h-[180px] transition-all duration-300`}
              style={{
                boxShadow: isDark
                  ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)'
                  : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)',
                background: isDark ? '#232426' : '#f1f1f1',
              }}
            >
              {/* Cutting Effect */}
              <div
                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-14 h-6 rounded-b-xl z-10"
                style={{
                  background: isDark ? '#232426' : '#f1f1f1',
                  boxShadow: isDark
                    ? 'inset 4px 4px 8px 0px rgba(0,0,0,0.30), inset -4px -4px 8px 0px rgba(255,255,255,0.09)'
                    : 'inset 4px 4px 8px 0px rgba(0,0,0,0.10), inset -4px -4px 8px 0px rgba(255,255,255,0.22)',
                }}
              ></div>

              {/* Icon */}
              <img
                src={stat.icon}
                alt={stat.title}
                className="w-5 h-5 absolute left-8 top-3 z-20"
              />

              {/* Content */}
              <div className="flex flex-col items-center w-full mt-8">
                <div 
                  className={`font-semibold text-center mb-2 text-sm ${isDark ? 'text-white' : 'text-black'}`}
                  style={{ letterSpacing: '0.05em' }}
                >
                  {stat.title.toUpperCase()}
                </div>
                <div className="text-center mt-2 text-2xl">{stat.temp}</div>
                <div className={`${theme.subText} text-base text-center mt-4 px-1`}>{stat.value}</div>
              </div>
            </div>
          ))}

          {/* Revenue Statistics - No Cutting */}
          <div 
            className="rounded-3xl p-6 min-h-[200px] transition-all duration-300"
            style={{
              boxShadow: isDark
                ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)'
                : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)',
              background: isDark ? '#232426' : '#f1f1f1'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <img src={RevenueIcon} alt="Revenue Statistics" className={`w-5 h-5 ${!isDark ? 'filter brightness-0' : ''}`} />
              <div className={`${isDark ? 'text-white' : 'text-black'} font-semibold text-base`}>
                Live Events Revenue Statistics
              </div>
            </div>
            <div className={`flex items-center justify-center ${theme.subText} text-sm h-1/2`}>
              Revenue Data Not Available
            </div>
            <div className={`flex items-center justify-center ${theme.subText} text-xs mt-2 px-2`}>
              This section will update as revenue data comes in from active events.
            </div>
          </div>

          {/* Live Events - No Cutting */}
          <div 
            className="rounded-3xl p-6 min-h-[180px] relative transition-all duration-300"
            style={{
              boxShadow: isDark
                ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)'
                : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)',
              background: isDark ? '#232426' : '#f1f1f1'
            }}
          >
            <div className="flex items-center gap-3">
              <img src={LiveIcon} alt="Live Events" className={`w-5 h-5 ${!isDark ? 'filter brightness-0' : ''}`} />
              <div className={`${isDark ? 'text-white' : 'text-black'} font-semibold text-base`}>
                Live Events
              </div>
            </div>
            <div className={`flex items-center justify-center ${theme.subText} text-sm mt-6`}>
              Nothing's Happening... Now!
            </div>
            <div className={`flex items-center justify-center ${theme.subText} text-xs mt-2 px-2 text-center`}>
              Ready to make some noise? Create your first event now and let the magic begin.
            </div>

            <button
              onClick={handleCreateEvent}
              className={`absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full p-3 shadow-lg transition-all duration-200
                ${isDark 
                  ? 'bg-[hsl(204,7%,14%)] hover:bg-[hsl(204,7%,16%)]' 
                  : 'bg-[#f1f1f1] hover:bg-gray-300'
                }`}
              style={{
                boxShadow: isDark
                  ? `4px 4px 8px rgba(0, 0, 0, 0.6), -4px -4px 8px rgba(255, 255, 255, 0.08)`
                  : `4px 4px 8px rgba(0, 0, 0, 0.15), -4px -4px 8px rgba(255, 255, 255, 0.8)`,
              }}
            >
              <img 
                src={PlusIcon} 
                alt="Add Live Event" 
                className={`w-5 h-5 ${!isDark ? 'filter brightness-0' : ''}`}
              />
            </button>
          </div>

          {/* My Groups - No Cutting */}
          <div 
            className="rounded-3xl p-6 min-h-[180px] relative transition-all duration-300"
            style={{
              boxShadow: isDark
                ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)'
                : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)',
              background: isDark ? '#232426' : '#f1f1f1'
            }}
          >
            <div className="flex items-center gap-3">
              <img src={GroupIcon} alt="My Groups" className={`w-5 h-5 ${!isDark ? 'filter brightness-0' : ''}`} />
              <div className={`${isDark ? 'text-white' : 'text-black'} font-semibold text-base`}>
                My Groups
              </div>
            </div>
            <div className={`flex items-center justify-center ${theme.subText} text-sm mt-6`}>
              It's Lonely Here!
            </div>
            <div className={`flex items-center justify-center ${theme.subText} text-xs mt-2 px-2 text-center`}>
              No groups yet — let's fix that by creating your first one!
            </div>
            <button
              onClick={handleCreateEvent}
              className={`absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full p-3 shadow-lg transition-all duration-200
                ${isDark 
                  ? 'bg-[hsl(204,7%,14%)] hover:bg-[hsl(204,7%,16%)]' 
                  : 'bg-[#f1f1f1] hover:bg-gray-300'
                }`}
              style={{
                boxShadow: isDark
                  ? `4px 4px 8px rgba(0, 0, 0, 0.6), -4px -4px 8px rgba(255, 255, 255, 0.08)`
                  : `4px 4px 8px rgba(0, 0, 0, 0.15), -4px -4px 8px rgba(255, 255, 255, 0.8)`,
              }}
            >
              <img 
                src={PlusIcon} 
                alt="Add Group" 
                className={`w-5 h-5 ${!isDark ? 'filter brightness-0' : ''}`}
              />
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );

  // Desktop View (Original Layout) - Nest Hub Max and Nest Hub
  const DesktopView = () => (
    <div className={`${theme.bg} ${theme.text} h-screen flex flex-col overflow-hidden transition-colors duration-300`}>
      {/* HEADER */}
      <header
        className={`flex items-center justify-between px-6 ${theme.bg} transition-colors duration-300`}
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="flex items-center gap-5">
          <img src={WieLogo} alt="Wie Logo" className="w-12 h-12" />
          <div className="ml-2">
            <SearchBar
              theme={theme}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onTuneClick={() => console.log("Tune clicked")}
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Notification Button */}
          <div className="relative">
            <div
              className={`w-[48px] h-[48px] rounded-full flex items-center justify-center transition-all duration-200
                ${isDark 
                  ? 'bg-[#212426] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),inset_-2px_-2px_4px_rgba(60,60,60,0.3)]' 
                  : 'bg-white border border-gray-300 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]'
                }`}
            >
              <img
                src={NotificationIcon}
                alt="Notification"
                className={`w-[16px] h-[16px] ${isDark ? '' : 'filter invert-0 brightness-0'}`}
              />
            </div>
            <span
              className="absolute -top-1 -right-1 text-white text-[10px] font-bold rounded-full px-[6px] py-[2px]"
              style={{ backgroundColor: "red" }}
            >
              12
            </span>
          </div>

          <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
        </div>
      </header>
      {/* MAIN BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR - Fixed responsive container */}
        <div className="flex-shrink-0">
          <div 
            className="h-full"
            style={{ 
              height: `calc(100vh - ${HEADER_HEIGHT}px)`,
              minHeight: '500px', // Minimum viable height
              maxHeight: `calc(100vh - ${HEADER_HEIGHT}px)`
            }}
          >
            <SideBar user={user} theme={theme} />
          </div>
        </div>
        
        {/* MAIN CONTENT - Updated to work better with sidebar */}
        <main className="flex flex-1 px-2 sm:px-4 pt-4 sm:pt-6 lg:pt-8 flex-col overflow-y-auto overflow-x-hidden min-w-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 sm:mb-6">
            <div className="mb-3 md:mb-0">
              <h1 className={`text-lg sm:text-xl font-semibold ${theme.text}`}>Good day, {displayName}!</h1>
              <p className={`${theme.subText} text-xs sm:text-sm`}>Let's Rock This!</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Create Event Button */}
              <button
                onClick={handleCreateEvent}
                disabled={loading}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition h-10 sm:h-12
                  ${theme.bg === "bg-[#212426]" 
                    ? 'bg-[#212426] text-white hover:bg-[hsl(204,7%,16%)]' 
                    : 'bg-[#f1f1f1] text-gray-900 hover:bg-gray-300'
                  }`}
                style={{
                  boxShadow: isDark 
                    ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)'
                    : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)'
                }}
              >
                <span className="bg-[#21d18b] rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center -ml-1 sm:-ml-2">
                  <img src={PlusIcon} alt="Add" className="w-4 h-4 sm:w-6 sm:h-6" />
                </span>
                <span className="hidden sm:inline">{loading ? "Checking..." : "Create event"}</span>
                <span className="sm:hidden">{loading ? "..." : "Create"}</span>
              </button>

              {/* Calendar Date */}
              <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-full h-10 sm:h-12
                ${theme.bg === "bg-[#212426]" 
                  ? theme.cardBg 
                  : 'bg-[#f1f1f1]'
                }`}
                style={{
                  boxShadow: isDark 
                    ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)'
                    : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)'
                }}
              >
                <span className="bg-[#249EFF] rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center -ml-1 sm:-ml-2">
                  <img 
                    src={CalenderIcon} 
                    alt="Calendar" 
                    className={`w-3 h-3 sm:w-5 sm:h-5 ${theme.bg === "bg-[#212426]" ? '' : 'filter brightness-0 invert'}`}
                  />
                </span>
                <span className={`${theme.text} text-xs sm:text-sm`}>
                  {new Date().toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Dashboard - Responsive Grid Layout */}
          <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 flex-1 pb-4 min-h-0">
            {/* Left Column */}
            <div className="flex flex-col gap-2 sm:gap-4 flex-1 min-h-0">
              {/* Top 3 Stats - Responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2 md:gap-3 lg:gap-4">
                {dashboardStats.map((stat) => (
                  <div
                    key={stat.title}
                    className={`${theme.cardBg} rounded-xl sm:rounded-2xl lg:rounded-3xl relative p-3 sm:p-4 lg:p-6 flex flex-col items-center gap-2 sm:gap-3 min-h-[140px] sm:min-h-[160px] lg:min-h-[200px] transition-all duration-300`}
                    style={{
                      boxShadow: isDark
                        ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)'
                        : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)',
                      background: isDark ? '#232426' : '#f1f1f1',
                    }}
                  >
                    {/* Static Notch with Pressed Effect */}
                    <div
                      className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 sm:w-10 lg:w-14 h-3 sm:h-4 lg:h-6 rounded-b-xl z-10"
                      style={{
                        background: isDark ? '#232426' : '#f1f1f1',
                        boxShadow: isDark
                          ? 'inset 4px 4px 8px 0px rgba(0,0,0,0.30), inset -4px -4px 8px 0px rgba(255,255,255,0.09)'
                          : 'inset 4px 4px 8px 0px rgba(0,0,0,0.10), inset -4px -4px 8px 0px rgba(255,255,255,0.22)',
                      }}
                    ></div>

                    {/* Icon */}
                    <img
                      src={stat.icon}
                      alt={stat.title}
                      className="w-3 sm:w-4 lg:w-5 h-3 sm:h-4 lg:h-5 absolute left-3 sm:left-4 lg:left-8 top-1 sm:top-2 lg:top-3 z-20"
                    />
                    
                    {/* Content */}
                    <div className="flex flex-col items-center w-full mt-4 sm:mt-6 lg:mt-8">
                      <div 
                        className={`font-semibold text-center mb-1 sm:mb-2 text-[10px] sm:text-xs lg:text-sm 
                          ${isDark ? 'text-white' : 'text-black'}`}
                        style={{ letterSpacing: '0.05em' }}
                      >
                        {stat.title.toUpperCase()}
                      </div>
                      <div className="text-center mt-1 sm:mt-2 text-lg sm:text-xl lg:text-2xl">
                        {stat.temp}
                      </div>
                      <div 
                        className={`${theme.subText} text-[10px] sm:text-xs lg:text-base text-center mt-2 sm:mt-4 lg:mt-6 px-1`}
                      >
                        {stat.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Revenue Statistics - Responsive */}
              <div 
                className="rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 min-h-[180px] sm:min-h-[220px] lg:min-h-[280px] transition-all duration-300 flex-1"
                style={{
                  boxShadow: isDark
                    ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)'
                    : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)',
                  background: isDark ? '#232426' : '#f1f1f1'
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <img src={RevenueIcon} alt="Revenue Statistics" className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6" />
                  <div className={`${isDark ? 'text-white' : 'text-black'} font-semibold text-xs sm:text-sm lg:text-base`}>
                    Live Events Revenue Statistics
                  </div>
                </div>
                <div className={`flex items-center justify-center ${theme.subText} text-xs sm:text-sm h-1/2`}>
                  Revenue Data Not Available
                </div>
                <div className={`flex items-center justify-center ${theme.subText} text-[10px] sm:text-xs mt-2 px-2`}>
                  This section will update as revenue data comes in from active events.
                </div>
              </div>
            </div>

            {/* Right Column - Only on large screens */}
            <div className="hidden lg:flex flex-col gap-2 sm:gap-4 flex-1 min-h-0">
              {/* Live Events */}
              <div 
                className="rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 min-h-[180px] sm:min-h-[220px] lg:min-h-[261px] relative transition-all duration-300 flex-1"
                style={{
                  boxShadow: isDark
                    ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)'
                    : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)',
                  background: isDark ? '#232426' : '#f1f1f1'
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <img src={LiveIcon} alt="Live Events" className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6" />
                  <div className={`${isDark ? 'text-white' : 'text-black'} font-semibold text-xs sm:text-sm lg:text-base`}>
                    Live Events
                  </div>
                </div>
                <div className={`flex items-center justify-center ${theme.subText} text-xs sm:text-sm mt-4 sm:mt-6`}>
                  Nothing's Happening... Now!
                </div>
                <div className={`flex items-center justify-center ${theme.subText} text-[10px] sm:text-xs mt-2 px-2 text-center`}>
                  Ready to make some noise? Create your first event now and let the magic begin.
                </div>

                <button
                  onClick={handleCreateEvent}
                  className={`absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full p-2 sm:p-3 shadow-lg transition-all duration-200
                    ${isDark 
                      ? 'bg-[hsl(204,7%,14%)] hover:bg-[hsl(204,7%,16%)]' 
                      : 'bg-[#f1f1f1] hover:bg-gray-300'
                    }`}
                  style={{
                    boxShadow: isDark
                      ? `4px 4px 8px rgba(0, 0, 0, 0.6), -4px -4px 8px rgba(255, 255, 255, 0.08)`
                      : `4px 4px 8px rgba(0, 0, 0, 0.15), -4px -4px 8px rgba(255, 255, 255, 0.8)`,
                  }}
                >
                  <img 
                    src={PlusIcon} 
                    alt="Add Live Event" 
                    className={`w-3 sm:w-4 lg:w-5 h-3 sm:h-4 lg:h-5 ${!isDark ? 'filter brightness-0' : ''}`}
                  />
                </button>
              </div>

              {/* My Groups */}
              <div 
                className="rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 min-h-[180px] sm:min-h-[220px] lg:min-h-[261px] relative transition-all duration-300 flex-1"
                style={{
                  boxShadow: isDark
                    ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)'
                    : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)',
                  background: isDark ? '#232426' : '#f1f1f1'
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <img src={GroupIcon} alt="My Groups" className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6" />
                  <div className={`${isDark ? 'text-white' : 'text-black'} font-semibold text-xs sm:text-sm lg:text-base`}>
                    My Groups
                  </div>
                </div>
                <div className={`flex items-center justify-center ${theme.subText} text-xs sm:text-sm mt-4 sm:mt-6`}>
                  It's Lonely Here!
                </div>
                <div className={`flex items-center justify-center ${theme.subText} text-[10px] sm:text-xs mt-2 px-2 text-center`}>
                  No groups yet — let's fix that by creating your first one!
                </div>
                <button
                  onClick={handleCreateEvent}
                  className={`absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full p-2 sm:p-3 shadow-lg transition-all duration-200
                    ${isDark 
                      ? 'bg-[hsl(204,7%,14%)] hover:bg-[hsl(204,7%,16%)]' 
                      : 'bg-[#f1f1f1] hover:bg-gray-300'
                    }`}
                  style={{
                    boxShadow: isDark
                      ? `4px 4px 8px rgba(0, 0, 0, 0.6), -4px -4px 8px rgba(255, 255, 255, 0.08)`
                      : `4px 4px 8px rgba(0, 0, 0, 0.15), -4px -4px 8px rgba(255, 255, 255, 0.8)`,
                  }}
                >
                  <img 
                    src={PlusIcon} 
                    alt="Add Group" 
                    className={`w-3 sm:w-4 lg:w-5 h-3 sm:h-4 lg:h-5 ${!isDark ? 'filter brightness-0' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Mobile/Tablet - Live Events and Groups in single column */}
            <div className="flex lg:hidden flex-col gap-2 sm:gap-4">
              {/* Live Events */}
              <div 
                className="rounded-xl sm:rounded-2xl p-4 sm:p-6 min-h-[180px] relative transition-all duration-300"
                style={{
                  boxShadow: isDark
                    ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)'
                    : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)',
                  background: isDark ? '#232426' : '#f1f1f1'
                }}
              >
                <div className="flex items-center gap-3">
                  <img src={LiveIcon} alt="Live Events" className="w-5 h-5" />
                  <div className={`${isDark ? 'text-white' : 'text-black'} font-semibold text-base`}>
                    Live Events
                  </div>
                </div>
                <div className={`flex items-center justify-center ${theme.subText} text-sm mt-6`}>
                  Nothing's Happening... Now!
                </div>
                <div className={`flex items-center justify-center ${theme.subText} text-xs mt-2 px-2 text-center`}>
                  Ready to make some noise? Create your first event now and let the magic begin.
                </div>

                <button
                  onClick={handleCreateEvent}
                  className={`absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full p-3 shadow-lg transition-all duration-200
                    ${isDark 
                      ? 'bg-[hsl(204,7%,14%)] hover:bg-[hsl(204,7%,16%)]' 
                      : 'bg-[#f1f1f1] hover:bg-gray-300'
                    }`}
                  style={{
                    boxShadow: isDark
                      ? `4px 4px 8px rgba(0, 0, 0, 0.6), -4px -4px 8px rgba(255, 255, 255, 0.08)`
                      : `4px 4px 8px rgba(0, 0, 0, 0.15), -4px -4px 8px rgba(255, 255, 255, 0.8)`,
                  }}
                >
                  <img 
                    src={PlusIcon} 
                    alt="Add Live Event" 
                    className={`w-5 h-5 ${!isDark ? 'filter brightness-0' : ''}`}
                  />
                </button>
              </div>

              {/* My Groups */}
              <div 
                className="rounded-xl sm:rounded-2xl p-4 sm:p-6 min-h-[180px] relative transition-all duration-300"
                style={{
                  boxShadow: isDark
                    ? '-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)'
                    : '-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)',
                  background: isDark ? '#232426' : '#f1f1f1'
                }}
              >
                <div className="flex items-center gap-3">
                  <img src={GroupIcon} alt="My Groups" className="w-5 h-5" />
                  <div className={`${isDark ? 'text-white' : 'text-black'} font-semibold text-base`}>
                    My Groups
                  </div>
                </div>
                <div className={`flex items-center justify-center ${theme.subText} text-sm mt-6`}>
                  It's Lonely Here!
                </div>
                <div className={`flex items-center justify-center ${theme.subText} text-xs mt-2 px-2 text-center`}>
                  No groups yet — let's fix that by creating your first one!
                </div>
                <button
                  onClick={handleCreateEvent}
                  className={`absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full p-3 shadow-lg transition-all duration-200
                    ${isDark 
                      ? 'bg-[hsl(204,7%,14%)] hover:bg-[hsl(204,7%,16%)]' 
                      : 'bg-[#f1f1f1] hover:bg-gray-300'
                    }`}
                  style={{
                    boxShadow: isDark
                      ? `4px 4px 8px rgba(0, 0, 0, 0.6), -4px -4px 8px rgba(255, 255, 255, 0.08)`
                      : `4px 4px 8px rgba(0, 0, 0, 0.15), -4px -4px 8px rgba(255, 255, 255, 0.8)`,
                  }}
                >
                  <img 
                    src={PlusIcon} 
                    alt="Add Group" 
                    className={`w-5 h-5 ${!isDark ? 'filter brightness-0' : ''}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  return (
    <div>
      {/* Mobile View (below 768px) */}
      <div className="block md:hidden">
        <MobileView />
      </div>
      
      {/* Desktop/Nest Hub View (768px and above) */}
      <div className="hidden md:block">
        <DesktopView />
      </div>

      <GroupSelectionModal
        groups={groups}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectGroup={handleSelectGroup}
      />
    </div>
  );
};

export default HomePage;
