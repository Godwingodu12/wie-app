import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import GroupSelectionModal from "../../components/modals/GroupSelectionModal";
import BottomNavigation from "../../components/HomePage/BottomNavigation.jsx";
import SideBar from "../../components/HomePage/SideBar";
import SearchBar from "../../components/HomePage/SearchBar";
import ThemeToggle from "../../components/HomePage/ThemeToggle";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import FilterButton from "../../components/HomePage/FilterButton.jsx";
import ShowArrow from "../../assets/Event/ShowArrow.png";
import HideArrow from "../../assets/Event/HideArrow.png";
import ViewConfirm from "../../assets/Event/ViewConfirm.png";
import EditIcon from "../../assets/Event/EditIcon.png";
import {
  getGroups,
  getMyLiveEvents,
  getPreviousEvents,
} from "../../services/ticketService";
import PlusIcon from "../../assets/HomePage/PlusIcon.svg";
import NotificationIcon from "../../assets/HomePage/NotificationIcon.svg";
import {
  ChevronDown,
  PartyPopper,
  Radio,
  Search,
  Landmark,
} from "lucide-react";
import ProfileImage from "../../assets/PROFILEPAGE/ProfileImage.png";
// import AdminLogo from "../../assets/auth/admin.webp";
// import OrgLogo from "../../assets/auth/orgz.webp";

const API_BASE_URL = import.meta.env.VITE_TICKET_API_BASE_URL;
const getImageUrl = (path) => {
    if (!path) return null;
    if (typeof path === 'object') {
      path = path.path || path.url || null;
    }
    if (typeof path !== 'string') {
      console.warn('Invalid path type:', typeof path, path);
      return null;
    }
    let cleanPath = path.replace(/\\/g, '/');
    cleanPath = cleanPath.replace(/^src\//, '');
    cleanPath = cleanPath.replace(/^\//, '');
    const fullUrl = `${API_BASE_URL}/${cleanPath}`;
    return fullUrl;
};

const getNeumorphicShadows = (isDark) =>
  isDark
    ? "shadow-[inset_5px_5px_10px_#1a1b1e,inset_-5px_-5px_10px_#3c3f44]"
    : "shadow-[inset_5px_5px_10px_#a4a4a4,inset_-5px_-5px_10px_#ffffff]";
const getButtonNeumorphicShadows = (isDark) =>
  isDark
    ? "shadow-[inset_2px_2px_5px_#1a1b1e,inset_-2px_-2px_5px_#3c3f44]"
    : "shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.1),inset_2px_2px_5px_rgba(255,255,255,1)]";

const MyGroupsCard = ({ theme, groups, isDark }) => (
  <div className="h-full flex flex-col">
    <div className="flex items-center justify-between w-full mb-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold">
          My groups,
        </h3>
        <p className={`text-sm ${theme.subText}`}>{groups.length} groups</p>
      </div>
      {groups.length > 2 && (
        <button className={`text-sm ${theme.subText} hover:underline`}>
          See more
        </button>
      )}
    </div>
    <div className="flex flex-row flex-wrap items-center justify-start w-full gap-6 flex-grow">
      {groups.slice(0, 2).map((group, index) => {
        let imageUrl;
        if (group.grp_type === "admin") {
          imageUrl = ProfileImage;
        } else if (group.grp_type === "organization") {
          imageUrl = getImageUrl(group.company_logo) || ProfileImage;
        } else {
          imageUrl = getImageUrl(group.company_logo) || ProfileImage;
        }
        return (
          <div key={index} className="flex flex-col items-center gap-2">
            <div
              className="relative w-[100px] h-[100px] rounded-[58px] overflow-hidden"
              style={{
                boxShadow: isDark
                  ? "inset 6px 6px 12px 0px rgba(0,0,0,0.18), inset -6px -6px 12px 0px rgba(255,255,255,0.08)"
                  : "inset 6px 6px 12px 0px rgba(0,0,0,0.18), inset -6px -6px 12px 0px rgba(255,255,255,0.08)",
              }}
            >
              <img
                src={imageUrl}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className={`font-medium text-sm ${theme.text} text-center`}>
              {group.name}
            </p>
          </div>
        );
      })}
    </div>
  </div>
);
const StatsCard = ({ count, title, isDark, theme, className, icon, isMobile = false }) => {
  if (isMobile) {
    return (
      <div
        style={{
          width: "48%",
          height: "160px",
          padding: "3%",
          borderRadius: "30px",
          border: "3px solid transparent",
          backgroundImage: isDark 
            ? "linear-gradient(#212426, #212426), linear-gradient(286.41deg, #171717 -2.79%, #343434 101.27%)"
            : "linear-gradient(#F1F1F1, #F1F1F1), linear-gradient(286.41deg, #e8e8e8 -2.79%, #f5f5f5 101.27%)",
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
          boxShadow: isDark
            ? "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A"
            : "8px 8px 12px 0px #0000001A, -8px -8px 12px 0px #FFFFFF80",
        }}
        className={`flex flex-col items-center justify-around ${className}`}
      >
        {icon}
        <p className={`text-xl sm:text-2xl font-semibold ${theme.text}`}>
          {count}
        </p>
        <p className={`text-[9px] sm:text-[10px] text-center leading-tight px-1 ${theme.subText}`}>
          {title}
        </p>
      </div>
    );
  }
  
  return (
    <div
      style={{
        width: "105px",
        height: "145px",
        padding: "12px 10px",
        borderRadius: "30px",
        border: "3px solid transparent",
        backgroundImage: isDark 
          ? "linear-gradient(#212426, #212426), linear-gradient(286.41deg, #171717 -2.79%, #343434 101.27%)"
          : "linear-gradient(#F1F1F1, #F1F1F1), linear-gradient(286.41deg, #e8e8e8 -2.79%, #f5f5f5 101.27%)",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        boxShadow: isDark
          ? "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A"
          : "8px 8px 12px 0px #0000001A, -8px -8px 12px 0px #FFFFFF80",
      }}
      className={`flex flex-col items-center justify-around flex-shrink-0 ${className}`}
    >
      {icon}
      <p className={`text-xl lg:text-2xl xl:text-3xl font-semibold ${theme.text}`}>
        {count}
      </p>
      <p className={`text-[9px] lg:text-[10px] xl:text-xs text-center leading-tight ${theme.subText}`}>
        {title}
      </p>
    </div>
  );
};
function MonthSelector({
  currentMonth,
  onSelectMonth,
  onClose,
  isDark,
  theme,
}) {
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  return (
    <div
      className={`${theme.cardBg} rounded-xl ${getButtonNeumorphicShadows(
        isDark
      )} p-1 flex flex-col gap-1 w-24 shadow-lg`}
    >
      {months.map((monthName, index) => (
        <button
          key={monthName}
          className={`w-full px-2 py-1.5 rounded-md text-sm font-semibold text-left transition-colors duration-150 ${currentMonth === index
              ? "bg-blue-600 text-blue-100"
              : `${theme.text} hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900`
          }`}
          onClick={() => {
            onSelectMonth(index);
            onClose();
          }}
        >
          {monthName}
        </button>
      ))}
    </div>
  );
}

function YearSelector({ currentYear, onSelectYear, onClose, isDark, theme }) {
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  return (
    <div
      className={`${theme.cardBg} rounded-xl ${getButtonNeumorphicShadows(
        isDark
      )} p-1 flex flex-col gap-1 w-24 shadow-lg max-h-[13.5rem] overflow-y-auto`}
    >
      {years.map((yearNum) => (
        <button
          key={yearNum}
          className={`w-full px-2 py-1.5 rounded-md text-sm font-semibold text-left transition-colors duration-150 ${currentYear === yearNum
              ? "bg-blue-600 text-blue-100"
              : `${theme.text} hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900`
          }`}
          onClick={() => {
            onSelectYear(yearNum);
            onClose();
          }}
        >
          {yearNum}
        </button>
      ))}
    </div>
  );
}

function OneLinerCalendar({ isDark, theme, dates, selectedDate, onDateClick }) {
  const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const getDayStyle = (dayInfo) => {
    const isSelected = selectedDate && dayInfo.fullDate.toDateString() === selectedDate.toDateString();
    const isToday = dayInfo.isToday;

    if (isToday) {
      return {
        wrapper: "bg-[#00DEA3] rounded-2xl shadow-lg border-2 border-[#00c591]",
        day: "text-black font-bold text-lg",
        date: "text-black font-bold text-lg",
      };
    }
    if (isSelected && !isToday) {
      return {
        wrapper: "bg-[#6549B8] rounded-2xl",
        day: "text-white font-semibold",
        date: "text-white font-bold",
      };
    }
    return {
      wrapper: "",
      day: theme.subText,
      date: theme.text,
    };
  };

  return (
    <div
      className={`mt-4 p-3 sm:p-4 md:p-5 lg:p-6 rounded-[30px] ${isDark ? theme.cardBg : "bg-[#f1f1f1]"} ${getNeumorphicShadows(isDark)}`}
    >
      <div
        className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 px-2 hide-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {dates.map((dayInfo, index) => {
          const style = getDayStyle(dayInfo);
          return (
            <div
              key={index}
              onClick={() => onDateClick(dayInfo)}
              className={`flex-shrink-0 w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 flex flex-col justify-center items-center space-y-0.5 sm:space-y-1 cursor-pointer transition-all duration-200 ${style.wrapper} ${index >= 5 ? "hidden sm:flex" : ""}`}
            >
              <span className={`text-xs uppercase ${style.day}`}>
                {dayInfo.isToday
                  ? "Today"
                  : daysOfWeek[
                      dayInfo.fullDate.getDay() === 0
                        ? 6
                        : dayInfo.fullDate.getDay() - 1
                    ]}
              </span>
              <span
                className={`text-sm sm:text-base md:text-lg lg:text-xl font-bold ${style.date}`}
              >
                {dayInfo.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const YourContentHeader = ({ isDark, theme, onDateChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const handleSelectMonth = (month) => {
    const newDate = new Date(currentYear, month, selectedDate?.getDate() || 1);
    setCurrentDate(newDate);
  };

  const handleSelectYear = (year) => {
    const newDate = new Date(year, currentMonth, selectedDate?.getDate() || 1);
    setCurrentDate(newDate);
  };
  const handleDateClick = (dayInfo) => {
    if (selectedDate && dayInfo.fullDate.toDateString() === selectedDate.toDateString()) {
      setSelectedDate(null);
      onDateChange?.(null);
    } else {
      setSelectedDate(dayInfo.fullDate);
      onDateChange?.(dayInfo.fullDate);
    }
  };

  const dates = useMemo(() => {
    const today = new Date();
    const isLargeDesktop = window.innerWidth >= 1280;
    const totalDays = isLargeDesktop ? 14 : 7;
    
    // Use currentDate as the center point for the calendar
    const centerDate = new Date(currentDate);
    const daysBefore = Math.floor(totalDays / 2);

    const startOfWeek = new Date(centerDate);
    startOfWeek.setDate(centerDate.getDate() - daysBefore);

    const days = [];
    const todayStr = today.toDateString();
    
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        fullDate: new Date(date),
        date: date.getDate(),
        isToday: date.toDateString() === todayStr,
      });
    }
    return days;
  }, [currentDate]);

  const fullMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const calendarBg = isDark ? theme.cardBg : "bg-gray-200";

  return (
    <>
      <header
        className={`flex items-center justify-center border-b ${isDark ? "border-gray-700" : "border-gray-200"} pb-3 sm:pb-4 mb-4 sm:mb-6 flex-wrap gap-2 sm:gap-4`}
      >
        <div className="flex flex-row items-center justify-center gap-2 sm:gap-4">
          <div className="relative">
            <button
              onClick={() => {
                setShowMonthSelector(!showMonthSelector);
                setShowYearSelector(false);
              }}
              className={`flex items-center justify-between ${calendarBg} rounded-full ${getButtonNeumorphicShadows(
                isDark
              )} h-8 sm:h-9 md:h-10 lg:h-12 gap-1 sm:gap-2 md:gap-3 px-3 sm:px-4 md:px-5`}
            >
              <span className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold whitespace-nowrap">
                {fullMonths[currentMonth]}
              </span>
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </button>
            {showMonthSelector && (
              <div className="absolute z-20 mt-2 left-0">
                <MonthSelector
                  currentMonth={currentMonth}
                  onSelectMonth={handleSelectMonth}
                  onClose={() => setShowMonthSelector(false)}
                  isDark={isDark}
                  theme={theme}
                />
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowYearSelector(!showYearSelector);
                setShowMonthSelector(false);
              }}
              className={`flex items-center ${calendarBg} rounded-full ${getButtonNeumorphicShadows(
                isDark
              )} h-8 sm:h-10 md:h-12 gap-1 sm:gap-2 px-3 sm:px-4 md:px-5`}
            >
              <span className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold">
                {currentYear}
              </span>
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </button>
            {showYearSelector && (
              <div className="absolute z-20 mt-2 right-0">
                <YearSelector
                  currentYear={currentYear}
                  onSelectYear={handleSelectYear}
                  onClose={() => setShowYearSelector(false)}
                  isDark={isDark}
                  theme={theme}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <OneLinerCalendar
        isDark={isDark}
        theme={theme}
        dates={dates}
        selectedDate={selectedDate}
        onDateClick={handleDateClick}
      />
    </>
  );
};
  const EventsList = ({
    isDark,
    theme,
    events = [],
    groups = [],
    activeFilter,
    selectedDate,
    setSelectedDate,
    searchTerm,
    onSearchTermChange,
  }) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const searchInputRef = useRef(null);
    const itemsPerPage = 6;
    const [isOrganisationDropdownOpen, setOrganisationDropdownOpen] = useState(false);
    const [isEventTypeDropdownOpen, setEventTypeDropdownOpen] = useState(false);
    const [eventTypeFilter, setEventTypeFilter] = useState("All");

    useEffect(() => {
      if (isSearchActive) {
        searchInputRef.current?.focus();
      }
    }, [isSearchActive]);

  const filteredEvents = useMemo(() => {
    let filtered = events || [];
    
    // Filter by selected calendar date
    if (selectedDate) {
      filtered = filtered.filter((event) => {
        const endDateStr = event.event_dates?.[0]?.end_date || event.end_date;
        const startDateStr = event.event_dates?.[0]?.start_date || event.start_date || event.event_start_date;
        
        if (!endDateStr && !startDateStr) return false;
        
        // Normalize selected date to start of day
        const selectedDateOnly = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        );
        
        // Check if selected date falls within event date range
        if (startDateStr && endDateStr) {
          const eventStartDate = new Date(startDateStr);
          const eventEndDate = new Date(endDateStr);
          
          const eventStartOnly = new Date(
            eventStartDate.getFullYear(),
            eventStartDate.getMonth(),
            eventStartDate.getDate()
          );
          const eventEndOnly = new Date(
            eventEndDate.getFullYear(),
            eventEndDate.getMonth(),
            eventEndDate.getDate()
          );
          
          // Check if selected date is within the event's date range
          return selectedDateOnly.getTime() >= eventStartOnly.getTime() && 
                selectedDateOnly.getTime() <= eventEndOnly.getTime();
        }
        
        // Fallback to single date check if only one date is available
        const dateToCheck = new Date(endDateStr || startDateStr);
        const eventDateOnly = new Date(
          dateToCheck.getFullYear(),
          dateToCheck.getMonth(),
          dateToCheck.getDate()
        );
        
        return eventDateOnly.getTime() === selectedDateOnly.getTime();
      });
    }

    // Filter by Paid/Free
    if (activeFilter === "Paid") {
      filtered = filtered.filter(
        (event) => event.ticket_types && event.ticket_types.length > 0
      );
    } else if (activeFilter === "Free") {
      filtered = filtered.filter(
        (event) => !event.ticket_types || event.ticket_types.length === 0
      );
    }
    // Filter by event type (Public/Private)
    if (eventTypeFilter !== "All") {
      filtered = filtered.filter(
        (event) =>
          event.event_privacy &&
          event.event_privacy.toLowerCase() === eventTypeFilter.toLowerCase()
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((event) =>
        event.event_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [events, searchTerm, activeFilter, selectedDate, eventTypeFilter]);

    const paginatedEvents = useMemo(() => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return filteredEvents.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredEvents, currentPage]);

    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    const displayEvents = [...paginatedEvents];
    while (displayEvents.length < itemsPerPage) {
      displayEvents.push(null);
    }

    const formatDate = (event) => {
      const dateString = event.event_dates?.[0]?.end_date || 
                        event.end_date || 
                        event.event_start_date;    
      if (!dateString) return "N/A";
      
      const date = new Date(dateString);
      if (isNaN(date)) {
        return "Invalid Date";
      }
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };
    const Dropdown = ({
      title,
      isOpen,
      setIsOpen,
      options,
      selectedOption,
      onSelect,
      isDark,
      theme,
    }) => (
      <div className="relative inline-block text-left">
        <div>
          <button
            type="button"
            className={`inline-flex items-center justify-start w-auto min-w-[80px] md:w-[180px] lg:w-[200px] xl:w-[226px] rounded-full px-2 md:px-3 lg:px-4 py-1.5 md:py-2 text-xs md:text-sm lg:text-base xl:text-lg focus:outline-none transition-all whitespace-nowrap ${theme.text}`}
            style={{
              background: isDark ? "#232426" : "#f1f1f1",
              boxShadow: isDark
                ? "inset 5px 5px 10px #1a1b1e, inset -5px -5px 10px #3c3f44"
                : "inset 5px 5px 10px #a4a4a4, inset -5px -5px 10px #ffffff",
              height: "32px",
            }}
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className={`p-0.5 md:p-1 rounded-full mr-1 md:mr-2 bg-gray-500`}>
              <ChevronDown
                className={`h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 ${theme.text}`}
              />
            </div>
            {selectedOption === "All" ? title : selectedOption}
          </button>
        </div>
        {isOpen && (
          <div
            className={`origin-top-right absolute right-0 mt-2 w-56 rounded-2xl ring-1 ring-opacity-5 z-50 ${
              isDark
                ? "bg-[#232426] ring-gray-600"
                : "bg-slate-100 ring-gray-400"
            }`}
            style={{
              boxShadow: isDark
                ? "8px 8px 12px rgba(0,0,0,0.4), -8px -8px 12px rgba(255,255,255,0.05)"
                : "8px 8px 12px #00000029, -8px -8px 12px #FFFFFF0A",
            }}
          >
            <div className="py-1" role="menu">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onSelect(option);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm rounded-xl mx-2 my-1 transition-colors ${
                    selectedOption === option
                      ? isDark
                        ? "bg-gray-700"
                        : "bg-gray-200"
                      : ""
                  } ${
                    isDark
                      ? "text-gray-400 hover:bg-gray-800"
                      : "text-gray-500 hover:bg-gray-200"
                  }`}
                  role="menuitem"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );


    return (
       <div
        style={{
          gap: "10px",
          opacity: 1,
          transform: "rotate(0deg)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          height: "402px",
        }}
        className={`w-full rounded-[50px] p-4 sm:p-8 ${
          isDark ? theme.cardBg : "bg-[#f1f1f1]"
        } ${getNeumorphicShadows(isDark)}`}>
        {/* Filters for Mobile */}
        <div className="flex flex-col gap-3 mb-4 md:hidden mt-4">
          {/* Search Bar */}
            <div
            className="flex items-center gap-2 rounded-full px-3 py-2"
              style={{
                background: isDark ? "#232426" : "#f1f1f1",
                boxShadow: isDark
                  ? "inset 5px 5px 10px #1a1b1e, inset -5px -5px 10px #3c3f44"
                  : "inset 5px 5px 10px #a4a4a4, inset -5px -5px 10px #ffffff",
                height: "36px",
              }}
            >
              <Search className={`w-4 h-4 ${theme.text} flex-shrink-0`} />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className={`bg-transparent focus:outline-none w-full text-xs font-medium ${theme.text} placeholder-gray-500`}
              />
            </div>
          {/* Dropdowns Row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Dropdown
                title="Organisation"
                isOpen={isOrganisationDropdownOpen}
                setIsOpen={setOrganisationDropdownOpen}
                options={["All"].concat(
                  [...new Set(groups.map((g) => g.name))].filter(Boolean)
                )}
                selectedOption={"All"}
                onSelect={() => {}}
                isDark={isDark}
                theme={theme}
              />
            </div>
            <div className="flex-1">
              <Dropdown
                title="Event Type"
                isOpen={isEventTypeDropdownOpen}
                setIsOpen={setEventTypeDropdownOpen}
                options={["All", "Public", "Private"]}
                selectedOption={eventTypeFilter}
                onSelect={setEventTypeFilter}
                isDark={isDark}
                theme={theme}
              />
            </div>
          </div>
        </div>
        {selectedDate && (
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs sm:text-sm ${theme.subText}`}>
                Showing events for:
              </span>
              <span className={`text-xs sm:text-sm font-semibold ${theme.text}`}>
                {selectedDate.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <button
                onClick={() => setSelectedDate(null)}
                className={`text-[10px] px-3 py-1.5 rounded-full transition-colors font-medium ${
                  isDark
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Clear filter
              </button>
          </div>
        )}
        {/* Scrollable content area */}
          <div
            className="flex-1 overflow-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-500"
            style={{
              maxHeight: "calc(582px - 200px)", 
            }}
          >
          {/* Mobile view */}
          <div className="flex flex-col md:hidden gap-4">
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className={`text-center ${theme.subText}`}>
                  <svg
                    className="w-16 h-16 mx-auto mb-4 opacity-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className={`text-base font-medium ${theme.text} mb-2`}>
                    No events found
                  </p>
                  <p className="text-sm">
                    {selectedDate
                      ? "No events on this date"
                      : "Create your first event to get started"}
                  </p>
                </div>
              </div>
            ) : (
              displayEvents.map((event, index) => {
                if (!event) {
                  return null;
                }
                const group = groups.find((g) => g._id === event.groupId);
                const groupName = group ? group.name : "N/A";

                return (
                  <div
                    key={event._id || index}
                    className={`p-4 sm:p-5 flex items-center justify-between gap-3 rounded-2xl ${
                      isDark ? "bg-gray-800/50" : "bg-white"
                    } shadow-md`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isDark ? "bg-purple-500/20" : "bg-purple-100"
                        }`}
                      >
                        <PartyPopper
                          className={`w-5 h-5 ${
                            isDark ? "text-purple-300" : "text-purple-600"
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`${theme.text} font-semibold text-sm truncate`}
                        >
                          {event.event_name}
                        </p>
                        <div
                          className={`text-xs ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          } flex items-center flex-wrap gap-x-2 gap-y-1 mt-1`}
                        >
                          <span className="truncate">{groupName}</span>
                          <span>•</span>
                          <span className="truncate">
                            {event.event_type || "N/A"}
                          </span>
                          <span>•</span>
                          <span className="truncate">{formatDate(event)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        navigate(`/ticket/previous-event/${event._id}`)
                      }
                      className="text-white font-semibold text-xs px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-shadow duration-300 flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(180deg, #1E1242 0%, #6942B8 100%)",
                        minWidth: "60px",
                      }}
                    >
                      View
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <table className="hidden md:table w-full text-left">
            <thead>
              <tr
                className={`${isDark ? "text-gray-400" : "text-black"} border-b ${isDark ? "border-gray-700" : "border-gray-200"} text-sm sticky top-0`}
                style={{
                  background: isDark ? "#232426" : "#F1F1F1",
                  zIndex: 10,
                }}
              >
                <th className="py-6 md:py-4 px-2 md:px-4 font-bold text-sm md:text-base lg:text-lg xl:text-xl relative">
                  <div
                    className="flex items-center justify-start gap-2 rounded-full transition-colors px-4"
                    style={{
                      height: "32px",
                      width: "180px",
                      background: isDark ? "#232426" : "#f1f1f1",
                      boxShadow: isDark
                        ? "inset 5px 5px 10px #1a1b1e, inset -5px -5px 10px #3c3f44"
                        : "inset 5px 5px 10px #a4a4a4, inset -5px -5px 10px #ffffff",
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Search className={`w-5 h-5 ${theme.text}`} />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                        className={`bg-transparent focus:outline-none w-full placeholder-gray-500 font-bold text-sm md:text-base lg:text-lg xl:text-xl ${theme.text}`}
                      />
                    </div>
                  </div>
                </th>
                <th className="py-2 md:py-3 px-2 md:px-4 font-semibold text-sm md:text-base lg:text-lg xl:text-xl">
                  <div className="flex items-center">
                    <Dropdown
                      title="Organisation"
                      isOpen={isOrganisationDropdownOpen}
                      setIsOpen={setOrganisationDropdownOpen}
                      options={["All"]
                        .concat(
                          [...new Set(groups.map((g) => g.name))].filter(Boolean)
                        )
                        .slice(0, 5)}
                      selectedOption={"All"}
                      onSelect={() => {}}
                      isDark={isDark}
                      theme={theme}
                    />
                  </div>
                </th>
                <th className="py-2 md:py-3 px-2 md:px-4 font-semibold text-sm md:text-base lg:text-lg xl:text-xl">
                  <div className="flex items-center">
                    <Dropdown
                      title="Event Type"
                      isOpen={isEventTypeDropdownOpen}
                      setIsOpen={setEventTypeDropdownOpen}
                      options={["All", "Public", "Private"]}
                      selectedOption={eventTypeFilter}
                      onSelect={setEventTypeFilter}
                      isDark={isDark}
                      theme={theme}
                    />
                  </div>
                </th>
                <th className="py-2 md:py-3 px-2 md:px-4 font-bold text-xs md:text-sm lg:text-base xl:text-lg text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayEvents.map((event, index) => {
                if (!event) {
                  return (
                    <tr key={`placeholder-d-${index}`}>
                      <td className="py-8 px-4 min-h-[78px]">&nbsp;</td>
                      <td className="py-8 px-4">&nbsp;</td>
                      <td className="py-8 px-4">&nbsp;</td>
                      <td className="py-4 px-4">&nbsp;</td>
                    </tr>
                  );
                }
                const group = groups.find((g) => g._id === event.groupId);
                const groupName = group ? group.name : "N/A";
                return (
                  <tr
                    key={event._id || index}
                    className={`border-b ${isDark ? "border-gray-700/50" : "border-gray-200"} ${isDark ? "hover:bg-gray-800/30" : "hover:bg-gray-100/50"} transition-colors min-h-[78px]`}
                  >
                    <td className={`py-8 px-4 ${theme.text} text-sm`}>
                      <div className="truncate pr-4">
                        {event.event_name || "N/A"}
                      </div>
                    </td>
                    <td className={`py-8 px-4 ${theme.text} text-sm`}>
                      <div className="truncate pr-4">{groupName}</div>
                    </td>
                    <td className={`py-8 px-4 ${theme.text} text-sm`}>
                      <div className="truncate pr-4">
                        {event.event_type || "N/A"}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() =>
                          navigate(`/ticket/previous-event/${event._id}`)
                        }
                        style={{
                          width: "90px",
                          height: "36px",
                          borderRadius: "18px",
                          background:
                            "linear-gradient(180deg, #1E1242 0%, #6942B8 100%)",
                          color: "white",
                          fontWeight: "600",
                          fontSize: "14px",
                          border: "none",
                          cursor: "pointer",
                        }}
                        className="shadow-md hover:shadow-lg transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex justify-center mt-3 pt-2 border-t border-opacity-20"
            style={{ borderColor: isDark ? "#4a5568" : "#e2e8f0" }}
          >
            <div className="flex items-center gap-2">
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === page
                      ? "bg-[#6549B8] text-white"
                      : isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  const PreviousEvent = () => {
    const { user } = useSelector((state) => state.auth);
    const [isDark, setIsDark] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [events, setEvents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState("All");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    const handleCreateEvent = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const groupsData = await getGroups();
        const groupsArray =
          groupsData?.groups || (Array.isArray(groupsData) ? groupsData : []);
        setGroups(groupsArray);
        if (groupsArray.length === 0) navigate("/ticket/create-group");
        else if (groupsArray.length === 1)
          navigate(`/ticket/create-event/${groupsArray[0]._id}`);
        else setIsModalOpen(true);
      } catch {
        alert("Error fetching groups. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    const handleDateChange = (date) => {
      setSelectedDate(date);
    };

    const handleSelectGroup = (selectedGroup) => {
      setIsModalOpen(false);
      navigate(`/ticket/create-event/${selectedGroup._id}`);
    };

    useEffect(() => {
      const fetchData = async () => {
        try {
          const [previousEventsData, groupsData] =
            await Promise.all([
              getPreviousEvents(),
              getGroups(),
            ]);

          const eventsArray =
            previousEventsData?.events ||
            previousEventsData?.tickets ||
            (Array.isArray(previousEventsData) ? previousEventsData : []);
          setEvents(eventsArray);

          const groupsArray =
            groupsData?.groups || (Array.isArray(groupsData) ? groupsData : []);
          setGroups(groupsArray);
        } catch (e) {
          console.error("Error fetching data:", e);
          setEvents([]);
          setGroups([]);
        }
      };

      fetchData();
    }, [currentDate]);

    useEffect(() => {
      const theme = localStorage.getItem("theme");
      const d = theme
        ? theme === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(d);
      document.documentElement.classList.toggle("dark", d);
    }, [currentDate]);

    const handleThemeToggle = () => {
      const newDark = !isDark;
      setIsDark(newDark);
      document.documentElement.classList.toggle("dark", newDark);
      localStorage.setItem("theme", newDark ? "dark" : "light");
    };

    const theme = isDark
      ? {
          bg: "bg-[#212426]",
          text: "text-white",
          subText: "text-[#c9c9cf]",
          cardBg: "bg-[#232426]",
        }
      : {
          bg: "bg-slate-100",
          text: "text-gray-900",
          subText: "text-gray-600",
          cardBg: "bg-slate-100",
        };

    const confirmedEventsCount = events.length;
    const totalLiveEvents = events.filter(
      (event) => event.event_status === "live"
    ).length;

    return (
      <>
      <style>{`
        /* Main page scrollbar */
        body::-webkit-scrollbar,
        html::-webkit-scrollbar,
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        
        body::-webkit-scrollbar-track,
        html::-webkit-scrollbar-track,
        .overflow-y-auto::-webkit-scrollbar-track {
          background: ${isDark ? '#1f2937' : '#f1f1f1'};
        }
        
        body::-webkit-scrollbar-thumb,
        html::-webkit-scrollbar-thumb,
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: ${isDark ? '#4b5563' : '#cbd5e1'};
          border-radius: 10px;
        }
        
        body::-webkit-scrollbar-thumb:hover,
        html::-webkit-scrollbar-thumb:hover,
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#6b7280' : '#94a3b8'};
        }
      `}</style>
      <div
        className={`${theme.bg} ${theme.text} h-screen flex overflow-hidden transition-colors duration-300 max-w-full`}
      >
        <div
          className={`hidden md:flex flex-col flex-shrink-0 nest-hub-sidebar ${theme.bg}`}
        >
          <div
            className="flex items-center justify-center"
            style={{ height: 72 }}
          >
            <img src={WieLogo} alt="Wie Logo" className="w-12 h-12" />
          </div>
          <div className="flex-1 sidebar-content">
            <SideBar user={user} theme={theme} />
          </div>
        </div>

        <div className="flex flex-col flex-1 w-full overflow-hidden md:ml-4">
          <header
            className="flex items-center justify-between px-4 md:px-6 flex-shrink-0"
            style={{ height: 72 }}
          >
            <div className="flex md:hidden items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <img
                  src={WieLogo}
                  alt="WIE Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4 w-full">
              <div className="flex-1 min-w-0">
                <SearchBar
                  theme={theme}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onTuneClick={() => {}}
                />
              </div>
              <div className="flex items-center gap-4 ml-auto flex-shrink-0">
                <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-32 md:pb-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-500">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
              <div className="block">
                <h1
                  className={`text-xl sm:text-2xl lg:text-3xl font-bold ${theme.text}`}
                >
                  Previous Event
                </h1>
              </div>
              <button
                onClick={handleCreateEvent}
                disabled={loading}
                style={{
                  boxShadow: isDark
                    ? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)"
                    : "-4px -4px 8px rgba(255,255,255,0.9), 4px 4px 8px rgba(0,0,0,0.15)",
                }}
                className={`hidden md:flex flex-1 md:flex-none items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition h-12 ${theme.bg} ${theme.text} ${isDark ? "hover:bg-[#2a2d2f]" : "hover:bg-gray-200"}`}
              >
                <span
                  className="w-[38px] h-[38px] flex items-center justify-center rounded-full -ml-2"
                  style={{
                    background: "#3EB489",
                    padding: "7px",
                    boxShadow:
                      "inset 4px 4px 12px #00000052, inset -4px -4px 8px #FFFFFF05",
                  }}
                >
                  <img src={PlusIcon} alt="Add" className="w-6 h-6" />
                </span>
                {loading ? "Checking..." : "Create event"}
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-8">
    {/* My Groups Card */}
    <div className="lg:col-span-1 w-full p-2 md:p-4">
      <MyGroupsCard theme={theme} groups={groups} isDark={isDark} />
    </div>
        <div className="w-full flex items-center justify-center">
          {/* Mobile/Tablet View */}
          <div className="lg:hidden w-full flex justify-center px-2">
            <div
              style={{
                width: "100%",
                maxWidth: "340px",
                minWidth: "280px",
                height: "203px",
                padding: "21px",
                gap: "20px",
                borderRadius: "50px",
                background: isDark ? "#212426" : "#f1f1f1",
                boxShadow: isDark 
                  ? "6px 6px 12px 0px #0000002E inset, -6px -6px 12px 0px #FFFFFF14 inset"
                  : "6px 6px 12px 0px #0000002E inset, -6px -6px 12px 0px #FFFFFF14 inset",
              }}
              className="flex flex-row items-center justify-between"
            >
              <StatsCard
                isDark={isDark}
                theme={theme}
                count={confirmedEventsCount}
                title="Total Completed events"
                icon={
                  <div className="text-yellow-400">
                    <PartyPopper className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                }
                isMobile={true}
              />
              <StatsCard
                isDark={isDark}
                theme={theme}
                count={totalLiveEvents}
                title="Total created events"
                icon={
                  <div className="text-red-500 relative">
                    <Radio className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                }
                isMobile={true}
              />
            </div>
          </div>
          <div className="hidden lg:flex w-full justify-start [@media(width:1024px)]:-ml-8">
            <div
              style={{
                width: "min(100%, 280px)",
                maxWidth: "280px",
                height: "203px",
                padding: "21px",
                gap: "18px",
                borderRadius: "50px",
                background: isDark ? "#212426" : "#f1f1f1",
                boxShadow: isDark
                  ? "6px 6px 12px 0px #0000002E inset, -6px -6px 12px 0px #FFFFFF14 inset"
                  : "6px 6px 12px 0px #0000002E inset, -6px -6px 12px 0px #FFFFFF14 inset",
              }}
              className="flex flex-row items-center justify-center transition-all duration-300 
                        [@media(width:1024px)]:!w-[280px] [@media(width:1024px)]:!max-w-[280px]"
            >
              <StatsCard
                isDark={isDark}
                theme={theme}
                count={confirmedEventsCount}
                title="Total Completed events"
                icon={
                  <div className="text-yellow-400">
                    <PartyPopper className="h-7 w-7 lg:h-8 lg:w-8 xl:h-9 xl:w-9" />
                  </div>
                }
                isMobile={false}
              />
              
              <StatsCard
                isDark={isDark}
                theme={theme}
                count={totalLiveEvents}
                title="Total created events"
                icon={
                  <div className="text-red-500 relative">
                    <Radio className="h-7 w-7 lg:h-8 lg:w-8 xl:h-9 xl:w-9" />
                  </div>
                }
                isMobile={false}
              />
            </div>
          </div>
          </div>
    {/* Calendar Section */}
  <div className="lg:col-span-2 w-full [@media(width:1024px)]:scale-90 [@media(width:1024px)]:origin-right">
    <YourContentHeader
      isDark={isDark}
      theme={theme}
      onDateChange={handleDateChange}
    />
  </div>
  </div>

            <div className="flex justify-end items-center mb-2">
              <div
                className={`flex items-center p-1 rounded-full ${theme.cardBg} ${getButtonNeumorphicShadows(isDark)}`}
              >
                {["All", "Paid", "Free"].map((filter) => {
                  const isActive = activeFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-200 ${isActive
                          ? "bg-gradient-to-br from-[#1E1242] to-[#6942B8] text-white"
                          : `${theme.text} hover:bg-gray-500/20`
                      }`}
                    >
                      {filter} events
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <EventsList
                isDark={isDark}
                theme={theme}
                events={events}
                groups={groups}
                activeFilter={activeFilter}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
              />
            </div>
          </main>
        </div>
        <GroupSelectionModal
          groups={groups}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelectGroup={handleSelectGroup}
        />
      </div>
            <nav 
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t"
        style={{
          backgroundColor: isDark ? '#212426' : '#f5f5f5',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: isDark 
            ? '0 -4px 6px -1px rgba(0, 0, 0, 0.3)' 
            : '0 -4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <BottomNavigation theme={theme} user={user} />
      </nav>
    </>
    );
  };

export default PreviousEvent;