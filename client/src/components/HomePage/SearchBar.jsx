import React, { useState, useEffect } from "react";
import FilterButton from "./FilterButton.jsx";
import NotificationModal from "../Event/NotificationModal.jsx";
import { getNotifications } from "../../services/notificationService.js";

// ICONS
import TuneIcon from "../../assets/HomePage/TuneIcon.svg";
import SearchIcon from "../../assets/HomePage/SearchIcon.svg";
import NotificationIcon from "../../assets/HomePage/NotificationIcon.svg";

// Shared neumorphic style creator (always inset)
const getNeumorphicStyle = (isPressed = false, isDark = true) => {
  const bg = isDark ? "#212426" : "#FFFFFF";
  const lightShadow = isDark
    ? "rgba(255,255,255,0.05)"
    : "rgba(255,255,255,0.9)";
  const darkShadow = isDark
    ? "rgba(0,0,0,0.6)"
    : "rgba(0,0,0,0.2)";

  return {
    backgroundColor: bg,
    borderRadius: "9999px",
    boxShadow: isPressed
      ? `inset -3px -3px 6px ${lightShadow}, inset 3px 3px 6px ${darkShadow}`
      : `inset -2px -2px 5px ${lightShadow}, inset 2px 2px 5px ${darkShadow}`
  };
};

const SearchBar = ({
  theme,
  placeholder = "Search here...",
  user = null
}) => {
  // Detect dark vs light mode from theme.text
  const isDark = theme.text.includes("white");

  // State for pressed effect
  const [tunePressed, setTunePressed] = useState(false);
  const [searchPressed, setSearchPressed] = useState(false);
  const [notificationPressed, setNotificationPressed] = useState(false);

  // State for showing FilterButton and NotificationModal
  const [showFilter, setShowFilter] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  
  // Notification count state
  const [notificationCount, setNotificationCount] = useState(0);

  // Search value state
  const [searchValue, setSearchValue] = useState("");

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!user) return;
      try {
        const data = await getNotifications('all', 1, 0);
        console.log('Notification data:', data);
        setNotificationCount(data.unreadCount || 0);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };
    
    fetchNotificationCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Refresh notification count when modal closes
  const handleNotificationModalClose = async () => {
    setShowNotificationModal(false);
    // Refresh count after closing modal
    if (user) {
      try {
        const data = await getNotifications('all', 1, 0);
        setNotificationCount(data.unreadCount || 0);
      } catch (error) {
        console.error('Error refreshing notification count:', error);
      }
    }
  };

  // Mouse/touch handlers
  const handleTuneDown = () => setTunePressed(true);
  const handleTuneUp = () => setTunePressed(false);
  const handleSearchDown = () => setSearchPressed(true);
  const handleSearchUp = () => setSearchPressed(false);
  const handleNotificationDown = () => setNotificationPressed(true);
  const handleNotificationUp = () => setNotificationPressed(false);

  // Icon & text colors
  const textColor = isDark ? "white" : "black";
  const iconFilter = isDark ? "invert(0)" : "invert(1)";

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 ml-1 sm:ml-2 relative w-full justify-between">
        {/* Left Side - Tune and Search */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 relative">
          {/* Tune Button */}
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-[48px] lg:h-[48px] rounded-full p-2 flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-95 flex-shrink-0"
            style={getNeumorphicStyle(tunePressed, isDark)}
            onMouseDown={handleTuneDown}
            onMouseUp={handleTuneUp}
            onMouseLeave={handleTuneUp}
            onTouchStart={handleTuneDown}
            onTouchEnd={handleTuneUp}
            onClick={() => setShowFilter((prev) => !prev)}
          >
            <img
              src={TuneIcon}
              alt="Tune"
              className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-6 lg:h-6"
              style={{ filter: iconFilter }}
            />
          </div>

          {/* Search Input - Responsive widths for tablets */}
          <div
            className="relative w-[200px] sm:w-[280px] md:w-[350px] lg:w-[520px] h-10 sm:h-11 md:h-12 lg:h-[48px] transition-all duration-150 rounded-full"
            style={getNeumorphicStyle(searchPressed, isDark)}
            onMouseDown={handleSearchDown}
            onMouseUp={handleSearchUp}
            onMouseLeave={handleSearchUp}
            onTouchStart={handleSearchDown}
            onTouchEnd={handleSearchUp}
          >
            <input
              type="text"
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className={`pl-10 sm:pl-11 md:pl-12 lg:pl-12 pr-3 w-full h-10 sm:h-11 md:h-12 lg:h-[48px] rounded-full text-xs sm:text-sm font-medium outline-none border-0 transition-colors duration-300`}
              style={{
                backgroundColor: "transparent",
                color: textColor
              }}
            />
            <img
              src={SearchIcon}
              alt="SearchIcon"
              className="absolute top-1/2 -translate-y-1/2 opacity-70"
              style={{
                width: "18px",
                height: "18px",
                left: "12px",
                filter: iconFilter
              }}
            />
          </div>

          {/* Filter Panel (positioned dropdown) */}
          {showFilter && (
            <div className="absolute top-12 sm:top-14 left-0 z-50">
              <FilterButton />
            </div>
          )}
        </div>

        {/* Right Side - Notification Button - Hidden on mobile, visible on md and up */}
        <div className="hidden md:block relative flex-shrink-0">
          <div
            className="w-11 h-11 md:w-12 md:h-12 lg:w-[48px] lg:h-[48px] rounded-full p-2 flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-95"
            style={getNeumorphicStyle(notificationPressed, isDark)}
            onMouseDown={handleNotificationDown}
            onMouseUp={handleNotificationUp}
            onMouseLeave={handleNotificationUp}
            onTouchStart={handleNotificationDown}
            onTouchEnd={handleNotificationUp}
            onClick={() => setShowNotificationModal(true)}
          >
            <img
              src={NotificationIcon}
              alt="Notifications"
              className="w-4 h-4 md:w-5 md:h-5 lg:w-5 lg:h-5"
              style={{ filter: iconFilter }}
            />
          </div>
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </div>
      </div>

      {/* Notification Modal - Only for desktop/tablet */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={handleNotificationModalClose}
        isDark={isDark}
      />
    </>
  );
};
export default SearchBar;
