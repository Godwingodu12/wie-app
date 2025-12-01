import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import GroupSelectionModal from "../../components/modals/GroupSelectionModal";
import BottomNavigation from "../../components/HomePage/BottomNavigation.jsx";
import GroupViewModal from "../../components/CreateGroup/GroupViewModal";
import SideBar from "../../components/HomePage/SideBar";
import SearchBar from "../../components/HomePage/SearchBar";
import ThemeToggle from "../../components/HomePage/ThemeToggle";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import FilterButton from "../../components/HomePage/FilterButton.jsx";
import ShowArrow from "../../assets/Event/ShowArrow.png";
import HideArrow from "../../assets/Event/HideArrow.png";
import ViewConfirm from "../../assets/Event/ViewConfirm.png";
import {
  getMyEvents,
  getGroups,
  getMyLiveEvents,
  getGroupStatistics,
} from "../../services/ticketService";
import PlusIcon from "../../assets/HomePage/PlusIcon.svg";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Radio,
  Search,
} from "lucide-react";
import ProfileImage from "../../assets/PROFILEPAGE/ProfileImage.png";
import { getImageUrl } from "../../utils/imageUtils";
import MyGroupsCard from "../../components/HomePage/MyGroupCard.jsx";
import StatsCard from "../../components/ViewPage/StatsCard.jsx";
const LegendItem = ({ color, label, percentage, theme }) => (
  <div className="w-full flex items-center gap-2">
    <div className="flex items-center gap-2 w-1/3">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className={`${theme.text} text-sm truncate`}>{label}</span>
    </div>
    <div className="w-2/3 flex items-center gap-2">
      <div
        className={`w-full ${
          theme.cardBg === "bg-[#232426]" ? "bg-gray-700" : "bg-gray-200"
        } rounded-full h-1.5`}
      >
        <div
          className={`${color} h-1.5 rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <span className={`${theme.text} font-medium text-sm w-10 text-right`}>
        {percentage}%
      </span>
    </div>
  </div>
);
const DoughnutChart = ({ stats, theme }) => {
  const radius = 60;
  const strokeWidth = 16;
  const viewBoxSize = 152;
  const center = viewBoxSize / 2;
  const circumference = 2 * Math.PI * radius;
  const hasMultipleSegments = stats.length > 1;
  const gapSize = hasMultipleSegments ? 10 : 0;

  const primaryStat =
    stats.find((s) => s.isPrimary) || (stats.length > 0 ? stats[0] : null);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: "152px", height: "152px" }}
    >
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${theme.text}`}>
          {primaryStat ? `${primaryStat.percentage}%` : "0%"}
        </span>
      </div>
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        style={{ width: "152px", height: "152px" }}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={theme.cardBg === "bg-[#232426]" ? "#232426" : ""}
          strokeWidth={strokeWidth}
        />
        <g transform={`rotate(-90 ${center} ${center})`}>
          {stats.map((stat, index) => {
            const segmentArcLength = (circumference * stat.percentage) / 100;
            const visibleArcLength = hasMultipleSegments
              ? Math.max(segmentArcLength - gapSize * 2, 0)
              : segmentArcLength;

            let startPosition = 0;
            for (let i = 0; i < index; i++) {
              startPosition += (circumference * stats[i].percentage) / 100;
            }
            const offset = hasMultipleSegments
              ? startPosition + gapSize
              : startPosition;
            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={stat.strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={`${visibleArcLength} ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
};
const GroupStatisticsChart = ({ theme, statsData = [] }) => {
  if (statsData.length === 0) {
    return (
      <>
        <h2
          className={`text-lg md:text-xl font-bold ${theme.text} mb-3 md:mb-4`}
        >
          Active group statistics
        </h2>
        <div className="flex-grow flex justify-center items-center min-h-[192px] xl:min-h-0">
          <p className={`${theme.subText} text-sm`}>No group to display</p>
        </div>
      </>
    );
  }
  return (
    <>
      <h2 className={`text-lg md:text-xl font-bold ${theme.text} mb-3 md:mb-4`}>
        Active group statistics
      </h2>
      <div className="flex flex-col xl:flex-row items-center xl:justify-start gap-3 md:gap-4">
        <div
          className="flex justify-center items-center flex-shrink-0"
          style={{
            width: "152px",
            height: "152px",
            borderRadius: "100px",
          }}
        >
          <DoughnutChart stats={statsData} theme={theme} />
        </div>
        <div className="flex-grow w-full xl:w-auto">
          <div className="flex flex-col space-y-3 md:space-y-4">
            {statsData.map((stat, index) => (
              <LegendItem
                key={index}
                color={stat.color}
                label={stat.label}
                percentage={stat.percentage}
                theme={theme}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
// --- End of inlined DoughnutChart.jsx code ---
const getNeumorphicShadows = (isDark) =>
  isDark
    ? "shadow-[inset_6px_6px_12px_#0000004D,inset_-6px_-6px_12px_#FFFFFF0A]"
    : "shadow-[inset_6px_6px_12px_#0000002E,inset_-6px_-6px_12px_#FFFFFF14]";
const getButtonNeumorphicShadows = (isDark) =>
  isDark
    ?  "shadow-[8px_8px_12px_0px_#00000029,_-8px_-8px_12px_0px_#FFFFFF0A]"
    : "shadow-[8px_8px_12px_0px_#0000001A,_-8px_-8px_12px_0px_#FFFFFF0A)]";




function MonthSelector({
  currentMonth,
  onSelectMonth,
  onClose,
  style,
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
      className={`${theme.cardBg} rounded-xl  p-1 flex flex-col gap-1 w-24 shadow-lg`}
      style={style}
    >
      {months.map((monthName, index) => (
        <button
          key={monthName}
          className={`w-full px-2 py-1.5 rounded-md text-sm font-semibold text-left transition-colors duration-150 ${
            currentMonth === index
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
function YearSelector({
  currentYear,
  onSelectYear,
  onClose,
  style,
  isDark,
  theme,
}) {
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  return (
    <div
      className={`${theme.cardBg} rounded-xl  p-1 flex flex-col gap-1 w-24 shadow-lg max-h-[13.5rem] overflow-y-auto`}
      style={style}
    >
      {years.map((yearNum) => (
        <button
          key={yearNum}
          className={`w-full px-2 py-1.5 rounded-md text-sm font-semibold text-left transition-colors duration-150 ${
            currentYear === yearNum
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
function CalendarControls({
  isDark,
  theme,
  onPrevMonth,
  onNextMonth,
  onSelectMonth,
  onSelectYear,
  currentMonth,
  currentYear,
  months,
  fullMonths,
  className,
}) {
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const calendarBg = isDark ? theme.cardBg : "bg-[ffffff]";
  return (
    <div
      className={`flex flex-wrap md:flex-nowrap items-center justify-start max-w-full md:w-auto gap-2 md:gap-1 ${
        className || ""
      } ${theme.text}`}
    >
      <div className="flex items-center gap-1 md:gap-1 lg:gap-3">
        <button
          onClick={onPrevMonth}
          className={`p-1 md:p-1.5 flex items-center justify-center ${calendarBg} rounded-full  w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10`}
          style={{
    boxShadow: isDark
      ? "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A"
      : "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A",
  }}
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <button
          onClick={onNextMonth}
          style={{
    boxShadow: isDark
      ? "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A"
      : "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A",
  }}
          className={`p-1 md:p-1.5 flex items-center justify-center ${calendarBg} rounded-full  w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10`}
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      <div className="flex items-center gap-1 md:gap-2 lg:gap-3 ml-auto">
        <div className="relative">
          <button
            onClick={() => {
              setShowMonthSelector((s) => !s);
              setShowYearSelector(false);
            }}
            style={{
    boxShadow: isDark
      ? "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A"
      : "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A",
  }}
            className={`flex items-center justify-between ${calendarBg} rounded-full  h-7 md:h-8 lg:h-10 gap-1 md:gap-2 px-2 md:px-2`}
          >
            <span className="text-xs md:text-sm font-semibold whitespace-nowrap">
              <span className="lg:hidden">{months[currentMonth]}</span>
              <span className="hidden lg:inline">
                {fullMonths[currentMonth]}
              </span>
            </span>
            <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
          </button>
          {showMonthSelector && (
            <div className="absolute z-20 mt-2 left-0">
              <MonthSelector
                currentMonth={currentMonth}
                onSelectMonth={(m) => {
                  onSelectMonth(m);
                  setShowMonthSelector(false);
                }}
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
              setShowYearSelector((s) => !s);
              setShowMonthSelector(false);
            }}
            className={`flex items-center ${calendarBg} rounded-full  h-7 md:h-8 lg:h-10 gap-1 px-2 md:px-3 md:pr-[13px]`}
            style={{
    boxShadow: isDark
      ? "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A"
      : "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A",
  }}
          >
            <span className="text-xs md:text-sm font-semibold">
              {currentYear}
            </span>
            <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
          </button>
          {showYearSelector && (
            <div className="absolute z-20 mt-2 right-0">
              <YearSelector
                currentYear={currentYear}
                onSelectYear={(y) => {
                  onSelectYear(y);
                  setShowYearSelector(false);
                }}
                onClose={() => setShowYearSelector(false)}
                isDark={isDark}
                theme={theme}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function CalendarGrid({
  isDark,
  theme,
  dates,
  selectedDate,
  onDateClick,
  className,
}) {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return (
    <div
      className={`${
        isDark ? theme.cardBg : "bg-[#FFFFFF]"
      } rounded-[2.5rem] w-full flex flex-col p-4 gap-2 ${className}`}
      style={{
    boxShadow: isDark
      ? "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A"
      : "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A",
  }}
    >
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((day) => (
          <div
            key={day}
            className={`text-[10px] py-4 md:text-xs font-bold ${theme.subText}`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-1">
        {dates.map((dayInfo, index) => {
          const isSelected =
            selectedDate &&
            dayInfo.fullDate.toDateString() === selectedDate.toDateString();
          const isToday = dayInfo.isToday;
          const isCurrentMonth = dayInfo.isCurrentMonth;

          let textColorClass = isCurrentMonth ? theme.text : theme.subText;
          let otherClasses = "";
          let fontClass = "";
          let ringClass = "";
          let bgColorClass = "";

          if (isSelected) {
            textColorClass = isDark ? "text-purple-400" : "text-purple-600";
            ringClass = isDark
              ? "ring-2 ring-purple-400"
              : "ring-2 ring-purple-600";
            fontClass = "font-bold";
            bgColorClass = isDark ? "bg-gray-700" : "bg-white";
          } else if (isToday) {
            bgColorClass = "bg-[#6549B8]";
            textColorClass = "text-white";
            fontClass = "font-bold";
          }

          return (
            <div
              key={index}
              className={`rounded-xl text-xs md:text-sm flex items-center justify-center cursor-pointer transition-colors duration-200 ${bgColorClass} ${textColorClass} ${fontClass} ${ringClass} ${otherClasses}`}
              onClick={() => onDateClick(dayInfo)}
            >
              {dayInfo.date}
            </div>
          );
        })}
      </div>
    </div>
  );
}
const EventsList = ({
  isDark,
  theme,
  events = [],
  activeFilter,
  searchTerm,
  onSearchTermChange,
  selectedDate, // Make sure this is included
  setSelectedDate, // Make sure this is included
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const searchInputRef = useRef(null);
  const itemsPerPage = 6;
  const [isCategoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const navigate = useNavigate();
  const categories = useMemo(() => {
    if (!events) return ["All"];
    const allCategories = events
      .map((event) => event.event_category)
      .filter(Boolean);
    const uniqueCategories = [...new Set(allCategories)];
    return ["All", ...uniqueCategories];
  }, [events]);

  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory("All");
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (isSearchActive) {
      searchInputRef.current?.focus();
    }
  }, [isSearchActive]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchTerm, selectedCategory]);

  const toggleRowExpansion = (eventId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };
  const filteredEvents = useMemo(() => {
    let filtered = events || [];

    // Filter by selected calendar date (if passed from parent)
    if (selectedDate) {
      filtered = filtered.filter((event) => {
        if (!event?.event_dates?.[0]?.start_date) return false;

        const eventStartDate = new Date(event.event_dates[0].start_date);
        const selectedDateOnly = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        );
        const eventDateOnly = new Date(
          eventStartDate.getFullYear(),
          eventStartDate.getMonth(),
          eventStartDate.getDate()
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

    // Filter by category
    if (selectedCategory && selectedCategory !== "All") {
      filtered = filtered.filter(
        (event) => event.event_category === selectedCategory
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((event) =>
        event.event_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [events, activeFilter, searchTerm, selectedCategory, selectedDate]);
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
    if (!event?.event_dates?.[0]?.start_date) {
      return "N/A";
    }

    const dateString = event.event_dates[0].start_date;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  const handleViewEvent = (event) => {
    const ticketId = event._id;
    const status = event.event_status?.toLowerCase();
    switch (status) {
      case "pending":
        navigate(`/ticket/view-single-event/${ticketId}`);
        break;
      case "confirmed":
        navigate(`/ticket/view-confirm-event/${ticketId}`);
        break;
      case "live":
        navigate(`/ticket/live-event-view/${ticketId}`);
        break;
      case "completed":
        navigate(`/ticket/previous-event-view/${ticketId}`);
        break;
      default:
        // Fallback for unknown status
        navigate(`/ticket/view-single-event/${ticketId}`);
    }
  };
  return (
    <div
      style={{
        gap: "10px",
        opacity: 1,
        transform: "rotate(0deg)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      className={`w-full rounded-[50px] ${
        isDark ? theme.cardBg : "bg-[#f1f1f1]"
      } ${getNeumorphicShadows(isDark)} py-5 px-4 md:px-6 lg:px-4`}
    >
      <div className="flex-1 lg:overflow-auto lg:[&::-webkit-scrollbar]:w-2 lg:[&::-webkit-scrollbar-track]:bg-gray-100 dark:lg:[&::-webkit-scrollbar-track]:bg-gray-800 lg:[&::-webkit-scrollbar-thumb]:rounded-full lg:[&::-webkit-scrollbar-thumb]:bg-gray-300 lg:hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:lg:[&::-webkit-scrollbar-thumb]:bg-gray-600 dark:lg:hover:[&::-webkit-scrollbar-thumb]:bg-gray-500">
        {/* Mobile Only View (below sm breakpoint - phones only) */}
        <div className="flex flex-col sm:hidden">
          <div className="relative mb-6 mt-4">
            <div className="flex items-center gap-3">
              {/* Filter Button */}
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`w-[31px] h-[31px] rounded-[17.1px] flex items-center justify-center flex-shrink-0 ${
                  isDark ? "bg-[#232426]" : "bg-[#f1f1f1]"
                }`}
                style={{
                  boxShadow: isDark
                    ? "3.21px 3.21px 6.41px 0px #0000002E inset, -3.21px -3.21px 6.41px 0px #FFFFFF14 inset"
                    : "3.21px 3.21px 6.41px 0px #0000002E inset, -3.21px -3.21px 6.41px 0px #FFFFFF14 inset",
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </button>
              {/* Search Bar */}
              <div
                className={`flex-1 flex items-center gap-2 ${
                  isDark ? "bg-[#232426]" : "bg-[#f1f1f1]"
                }`}
                style={{
                  maxWidth: "300px",
                  height: "31px",
                  borderRadius: "17.1px",
                  padding: "8.55px",
                  boxShadow: isDark
                    ? "3.21px 3.21px 6.41px 0px #0000002E inset, -3.21px -3.21px 6.41px 0px #FFFFFF14 inset"
                    : "3.21px 3.21px 6.41px 0px #0000002E inset, -3.21px -3.21px 6.41px 0px #FFFFFF14 inset",
                }}
              >
                <Search className="w-4 h-4 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  className={`bg-transparent focus:outline-none w-full text-sm ${
                    isDark ? "placeholder-gray-500" : "placeholder-gray-400"
                  }`}
                />
              </div>
            </div>
            {selectedDate && (
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${theme.subText}`}>
                    Events for:
                  </span>
                  <span className={`text-xs font-semibold ${theme.text}`}>
                    {selectedDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="mt-2">
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
              </div>
            )}
            {/* Filter Dropdown */}
            {showFilter && (
              <div className="absolute top-14 left-0 z-50">
                <FilterButton />
              </div>
            )}
          </div>
          {/* Events Table */}
          <div
            className={`${isDark ? "bg-[#232426]" : "bg-[#f1f1f1]"}`}
            style={{
              width: "100%",
              maxWidth: "344px",
              minHeight: "auto",
              borderRadius: "24px",
              padding: "32px 24px",
              boxShadow: isDark
                ? "6px 6px 12px 0px #0000002E inset, -6px -6px 12px 0px #FFFFFF14 inset"
                : "6px 6px 12px 0px #0000002E inset, -6px -6px 12px 0px #FFFFFF14 inset",
            }}
          >
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
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
                    Create your first event to get started
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {paginatedEvents.map((event, index) => {
                  const isExpanded = expandedRows[event._id];

                  return (
                    <div
                      key={event._id || index}
                      className="flex flex-col gap-4"
                    >
                      {/* Event Row */}
                      <div
                        className="flex items-center justify-between"
                        style={{
                          width: "100%",
                          maxWidth: "294px",
                          height: "30px",
                        }}
                      >
                        <p
                          className={`${theme.text} font-medium text-sm truncate flex-1`}
                        >
                          {event.event_name}
                        </p>
                        <button
                          onClick={() => toggleRowExpansion(event._id)}
                          className="flex-shrink-0 ml-2"
                        >
                          <img
                            src={isExpanded ? HideArrow : ShowArrow}
                            alt={isExpanded ? "Hide" : "Show"}
                            className="w-5 h-5"
                          />
                        </button>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div
                          className="flex flex-col gap-5"
                          style={{
                            width: "100%",
                            maxWidth: "294px",
                            minHeight: "202px",
                          }}
                        >
                          {/* Event Details */}
                          <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <span className={`text-xs ${theme.subText}`}>
                                Category:
                              </span>
                              <span
                                className={`text-xs ${theme.text} font-medium`}
                              >
                                {event.event_category || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-xs ${theme.subText}`}>
                                Sub Category:
                              </span>
                              <span
                                className={`text-xs ${theme.text} font-medium`}
                              >
                                {event.event_subcategory || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-xs ${theme.subText}`}>
                                Start Date:
                              </span>
                              <span
                                className={`text-xs ${theme.text} font-medium`}
                              >
                                {formatDate(event)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-xs ${theme.subText}`}>
                                Location:
                              </span>
                              <span
                                className={`text-xs ${theme.text} font-medium truncate max-w-[150px]`}
                              >
                                {event.venue || event.location_type || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-xs ${theme.subText}`}>
                                Status:
                              </span>
                              <span
                                className={`text-xs ${theme.text} font-medium`}
                              >
                                {event.event_status || "N/A"}
                              </span>
                            </div>
                          </div>
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 justify-start">
                            <button
                              onClick={() => handleViewEvent(event)}
                              className="bg-[#00DEA3] text-black font-semibold text-xs px-4 py-2 rounded-full shadow-md hover:bg-[#00c591] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#00DEA3] focus:ring-opacity-50"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Divider */}
                      {index < paginatedEvents.length - 1 && (
                        <div
                          className={`h-px ${
                            isDark ? "bg-gray-700" : "bg-gray-300"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {/* Tablet/Desktop View (sm breakpoint and above) */}
        <div className="hidden sm:block">
          {/* Tablet Search Header */}
          <div className="flex lg:hidden mb-4 flex-col gap-3">
            <div className="flex items-center justify-between w-full">
              {!isSearchActive ? (
                <button
                  className={`flex items-center gap-2 px-4 py-3 rounded-[32px] ${
                    isDark ? theme.cardBg : "bg-[#f1f1f1]"
                  } ${getNeumorphicShadows(isDark)}`}
                  onClick={() => setIsSearchActive(true)}
                >
                  <Search className={`w-4 h-4 ${theme.subText}`} />
                  <span className={`text-sm font-bold ${theme.text}`}>
                    Event
                  </span>
                </button>
              ) : (
                <div
                  className={`flex items-center gap-2 px-4 py-3 rounded-[32px] ${
                    isDark ? theme.cardBg : "bg-[#f1f1f1]"
                  } ${getNeumorphicShadows(isDark)}`}
                >
                  <Search className={`w-4 h-4 ${theme.subText}`} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                    onBlur={() => setIsSearchActive(false)}
                    className={`bg-transparent focus:outline-none w-20 ${theme.text} placeholder-gray-500`}
                    autoFocus
                  />
                </div>
              )}
              <span className={`text-sm font-bold ${theme.text} mr-1`}>
                Actions
              </span>
            </div>

            {/* Date Filter Indicator - Tablet */}
            {selectedDate && (
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${theme.subText}`}>
                    Events for:
                  </span>
                  <span className={`text-sm font-semibold ${theme.text}`}>
                    {selectedDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                    isDark
                      ? "bg-blue-600 hover:bg-blue-500 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>
          {/* Tablet List View */}
          <div className="flex flex-col lg:hidden">
            {displayEvents.map((event, index) => {
              if (!event) {
                return (
                  <div key={`placeholder-${index}`} className="p-4 h-[80px]">
                    &nbsp;
                  </div>
                );
              }
              return (
                <div
                  key={event._id || index}
                  className={`border-b ${
                    isDark ? "border-gray-700/50" : "border-gray-200"
                  } p-4`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full ${
                          isDark ? "bg-indigo-500/20" : "bg-indigo-100"
                        } flex items-center justify-center ${
                          isDark ? "text-indigo-300" : "text-indigo-500"
                        }`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <span className={`${theme.text} truncate`}>
                        {event.event_name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewEvent(event)}
                      className={`px-4 sm:px-6 py-2 border border-[#6549B8] rounded-full text-sm transition-colors ${
                        isDark
                          ? "text-white hover:bg-[#6549B8]"
                          : "text-[#6549B8] hover:bg-[#6549B8] hover:text-white"
                      }`}
                    >
                      View
                    </button>
                  </div>
                  <div
                    className={`mt-2 text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    <p>Event Status: {event.event_status}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            {/* Date Filter Indicator - Desktop */}
            {selectedDate && (
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${theme.subText}`}>
                    Events for:
                  </span>
                  <span className={`text-sm font-semibold ${theme.text}`}>
                    {selectedDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className={`border  rounded-full px-4 py-1 text-sm font-light tracking-wider transition-colors hover:bg-[#6549B8] border-[#6549B8] hover:text-white ${
                          isDark ? "text-gray-300" : "text-gray-700"
                        }`}
                >
                  Clear filter
                </button>
              </div>
            )}

            <table className="w-full table-auto text-left">
              <thead>
                <tr
                  className={`${
                    isDark ? "text-gray-400" : "text-black"
                  } border-b ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  } text-sm sticky top-0`}
                  style={{
                    background: isDark ? "#232426" : "transparent",
                    zIndex: 10,
                  }}
                >
                  <th className="py-3 px-2 lg:px-4 font-bold text-sm lg:text-base w-[38%]">
                    <div className="flex items-center justify-start gap-2">
                      {isSearchActive ? (
                        <div className="flex items-center gap-2 w-full">
                          <Search className="w-4 h-4" />
                          <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => onSearchTermChange(e.target.value)}
                            onBlur={() => {
                              setIsSearchActive(false);
                              onSearchTermChange("");
                            }}
                            className="bg-transparent focus:outline-none w-full placeholder-gray-500"
                          />
                        </div>
                      ) : (
                        <>
                          <span>Event</span>
                          <Search
                            className="w-4 h-4 cursor-pointer"
                            onClick={() => setIsSearchActive(true)}
                          />
                        </>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-2 lg:px-4 font-bold text-sm lg:text-base w-[22%]">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setCategoryDropdownOpen(!isCategoryDropdownOpen)
                        }
                        className="flex items-center justify-between w-full"
                      >
                        <span>
                          {selectedCategory === "All"
                            ? "Category"
                            : selectedCategory}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {isCategoryDropdownOpen && (
                        <div
                          className={`absolute z-50 mt-2 w-56 rounded-2xl p-2 ring-1 ring-opacity-5 top-full left-0 ${
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
                          <div className="max-h-56 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {categories.map((category) => (
                              <button
                                key={category}
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setCategoryDropdownOpen(false);
                                }}
                                className={`block w-full text-left px-3 py-1.5 text-sm rounded-lg my-1 transition-colors ${
                                  selectedCategory === category
                                    ? isDark
                                      ? "bg-gray-700 text-white"
                                      : "bg-gray-200 text-gray-900"
                                    : isDark
                                    ? "text-gray-300 hover:bg-gray-800"
                                    : "text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                {category}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-2 lg:px-4 font-bold text-sm lg:text-base w-[22%]">
                    <div className="flex items-center gap-2">
                      <span>Event Status</span>
                    </div>
                  </th>
                  <th className="py-3 px-2 lg:px-4 font-normal w-[18%]"></th>
                </tr>
              </thead>
              <tbody>
                {displayEvents.map((event, index) => {
                  if (!event) {
                    return (
                      <tr key={`placeholder-${index}`}>
                        <td className="py-3 px-4 h-[60px]">&nbsp;</td>
                        <td className="py-3 px-4">&nbsp;</td>
                        <td className="py-3 px-4">&nbsp;</td>
                        <td className="py-3 px-4">&nbsp;</td>
                      </tr>
                    );
                  }
                  return (
                    <tr
                      key={event._id || index}
                      className={`border-b ${
                        isDark ? "border-gray-700/50" : "border-gray-200"
                      } ${
                        isDark ? "hover:bg-gray-800/30" : "hover:bg-gray-100/50"
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full ${
                              isDark ? "bg-indigo-500/20" : "bg-indigo-100"
                            } flex items-center justify-center ${
                              isDark ? "text-indigo-300" : "text-indigo-500"
                            }`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                          </div>
                          <span className={`${theme.text} text-sm truncate`}>
                            {event.event_name}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`py-3 px-4 ${theme.text} text-sm truncate`}
                      >
                        {event.event_category ? event.event_category : "N/A"}
                      </td>
                      <td
                        className={`py-3 px-4 ${theme.text} text-sm truncate`}
                      >
                        {event.event_status ? event.event_status : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleViewEvent(event)}
                          className={`px-4 py-1.5 border border-[#6549B8] rounded-full text-sm transition-colors ${
                            isDark
                              ? "text-white hover:bg-[#6549B8]"
                              : "text-[#6549B8] hover:bg-[#6549B8] hover:text-white"
                          }`}
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
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex justify-end mt-3 pt-2 border-t border-opacity-20"
          style={{ borderColor: isDark ? "#4a5568" : "#e2e8f0" }}
        >
          <div className="flex items-end gap-2">
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${
                  currentPage === page
                    ? "bg-[#6549B8] text-white"
                    : isDark
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
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

const ViewEvent = () => {
  const [isDark, setIsDark] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [groupStats, setGroupStats] = useState([]);

  const handleCreateEvent = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const groupsResponse = await getGroups();
      const groupsArray = Array.isArray(groupsResponse)
        ? groupsResponse
        : groupsResponse.data || [];
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
  const handleSelectGroup = (selectedGroup) => {
    setIsModalOpen(false);
    navigate(`/ticket/create-event/${selectedGroup._id}`);
  };
  const shortMonths = [
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
  const fullMonths = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const generateCalendarDates = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();
    const dates = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek; i > 0; i--) {
      dates.push({
        date: prevMonthLastDay - i + 1,
        isCurrentMonth: false,
        isToday: false,
        fullDate: new Date(year, month - 1, prevMonthLastDay - i + 1),
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const today = new Date();
      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === i;
      dates.push({
        date: i,
        isCurrentMonth: true,
        isToday: isToday,
        fullDate: new Date(year, month, i),
      });
    }
    let nextMonthDay = 1;
    while (dates.length < 42) {
      dates.push({
        date: nextMonthDay,
        isCurrentMonth: false,
        isToday: false,
        fullDate: new Date(year, month + 1, nextMonthDay),
      });
      nextMonthDay++;
    }
    return dates;
  }, [year, month]);

  const handlePrevMonth = () =>
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() - 1);
      return n;
    });
  const handleNextMonth = () =>
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() + 1);
      return n;
    });
  const handleSelectMonth = (m) =>
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setMonth(m);
      return n;
    });
  const handleSelectYear = (y) =>
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setFullYear(y);
      return n;
    });
  const handleDateClick = (dayInfo) => {
    if (
      selectedDate &&
      dayInfo.fullDate.toDateString() === selectedDate.toDateString()
    ) {
      setSelectedDate(null);
    } else {
      setSelectedDate(dayInfo.fullDate);
    }
    setCurrentDate(dayInfo.fullDate);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, groupsRes, liveEventsRes, groupStatsRes] =
          await Promise.all([
            getMyEvents(),
            getGroups(),
            getMyLiveEvents(),
            getGroupStatistics(),
          ]);
        const eventsArray = eventsRes?.tickets
          ? [].concat(eventsRes.tickets)
          : [];
        setEvents(eventsArray);

        const groupsArray = Array.isArray(groupsRes) ? groupsRes : [];
        setGroups(groupsArray);

        if (Array.isArray(groupStatsRes)) {
          const processedStats = groupStatsRes.map((stat, index) => {
            const colors = [
              { name: "green-500", stroke: "#22c55e" },
              { name: "blue-500", stroke: "#3b82f6" },
              { name: "yellow-500", stroke: "#eab308" },
              { name: "red-500", stroke: "#ef4444" },
              { name: "purple-500", stroke: "#8b5cf6" },
            ];
            const color = colors[index % colors.length];

            return {
              label: stat.groupName || `Group ${index + 1}`,
              percentage: Math.round(stat.percentage || 0),
              color: `bg-${color.name}`,
              strokeColor: color.stroke,
              isPrimary: index === 0,
            };
          });
          setGroupStats(processedStats);
        }
      } catch (e) {
        console.error("Error fetching data:", e);
        setEvents([]);
        setGroups([]);
        setTotalLiveEvents(0);
        setGroupStats([]);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (events.length > 0 && groups.length > 0) {
      const stats = groups.map((group) => {
        const groupEvents = events.filter(
          (event) => event.groupId === group._id
        );
        const percentage =
          events.length > 0 ? (groupEvents.length / events.length) * 100 : 0;
        return {
          label: group.name,
          percentage: Math.round(percentage),
        };
      });

      const sortedStats = stats.sort((a, b) => b.percentage - a.percentage);

      const colors = [
        "green-500",
        "blue-500",
        "yellow-500",
        "red-500",
        "purple-500",
      ];

      const colorMap = {
        "green-500": "#22c55e",
        "blue-500": "#3b82f6",
        "yellow-500": "#eab308",
        "red-500": "#ef4444",
        "purple-500": "#8b5cf6",
      };

      const finalStats = sortedStats.slice(0, 5).map((stat, index) => {
        const colorName = colors[index % colors.length];
        return {
          ...stat,
          color: `bg-${colorName}`,
          strokeColor: colorMap[colorName],
          isPrimary: index === 0,
        };
      });

      setGroupStats(finalStats);
    }
  }, [events, groups]);
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    const d = theme
      ? theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(d);
    document.documentElement.classList.toggle("dark", d);
  }, []);

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
        cardBg: "bg-[#212426]",
        border: "border-[#23233a]",
        inputBg: "bg-[#212426]",
      }
    : {
        bg: "bg-[#F9F9F9]",
        text: "text-gray-900",
        subText: "text-gray-600",
        cardBg: "bg-[#f1f1f1]",
        border: "border-[#e4e6ea]",
        inputBg: "bg-[#ffffff]",
      };

  const user = { name: "U" };
  const confirmedEventsCount = events.length;
  const totalLiveEvents = events.filter(
    (event) => event.event_status === "live"
  ).length;
  return (
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
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 md:mb-8 gap-4">
            <div>
              <h1
                className={`text-lg md:text-3xl font-semibold ${theme.text} flex items-center gap-3`}
              >
                View events
              </h1>
              <p className={`${theme.subText} mt-2 text-base md:text-base`}>
                Review and manage everything related to events
              </p>
            </div>
            <button
              onClick={handleCreateEvent}
              disabled={loading}
              style={{
             
                      boxShadow: isDark
      ? "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A"
      : "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A",

              }}
              className={`hidden md:flex flex-1 md:flex-none items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition h-12 ${
                theme.bg
              } ${theme.text} ${
                isDark ? "hover:bg-[#2a2d2f]" : "hover:bg-gray-200"
              }`}
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

          {/* FIXED GRID LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 xl:gap-8">
            {/* Left Column - Stacks on mobile/tablet, 60% on desktop */}
            <div className="lg:col-span-3 flex flex-col gap-6 xl:gap-8">
              {/* My Groups & Stats Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:gap-8">
                {/* My Groups Card */}
                <div className="w-full md:col-span-1  p-4">
                  <MyGroupsCard theme={theme} groups={groups} isDark={isDark} />
                </div>

                {/* Stats Cards Container */}
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
                        title="Confirmed events"
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
                        title="Live events"
                        icon={
                          <div className="text-red-500 relative">
                            <Radio className="h-6 w-6 sm:h-7 sm:w-7" />
                          </div>
                        }
                        isMobile={true}
                      />
                    </div>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden lg:flex w-full justify-center">
                    <div
                      style={{
                        width: "min(100%, 300px)",
                        height: "203px",
                        padding: "21px",
                        gap: "20px",
                        borderRadius: "50px",
                        background: isDark ? "#212426" : "#f1f1f1",
                        boxShadow: isDark
                          ? "6px 6px 12px 0px #0000002E inset, -6px -6px 12px 0px #FFFFFF14 inset"
                          : "6px 6px 12px 0px #0000002E inset, -6px -6px 12px 0px #FFFFFF14 inset",
                      }}
                      className="flex flex-row items-center justify-between transition-all duration-300"
                    >
                      <StatsCard
                        isDark={isDark}
                        theme={theme}
                        count={confirmedEventsCount}
                        title="Total events"
                        icon={
                          <div className="text-yellow-400">
                            <PartyPopper className="h-9 w-9 xl:h-10 xl:w-10" />
                          </div>
                        }
                        isMobile={false}
                      />

                      <StatsCard
                        isDark={isDark}
                        theme={theme}
                        count={totalLiveEvents}
                        title="Live events"
                        icon={
                          <div className="text-red-500 relative">
                            <Radio className="h-9 w-9 xl:h-10 xl:w-10" />
                          </div>
                        }
                        isMobile={false}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex justify-end items-center">
                <div className="flex items-center gap-2 flex-wrap">
                  {["All events", "Paid events", "Free events"].map(
                    (filter) => {
                      const filterName = filter.split(" ")[0];
                      const isActive = activeFilter === filterName;

                      const activeClass =
                        "bg-[linear-gradient(180deg,#1E1242_0%,#6549B8_100%)] text-white shadow-lg border border-[#6549B8]  rounded-full px-4 py-1 text-sm font-light tracking-wider";
                      const inactiveOutlineClass = `border border-[#6549B8] ${
                        isDark ? "text-white" : "text-[#6D4DE6]"
                      }`;
                      const inactiveNeumorphicClass = `${
                        theme.text
                      } ${getButtonNeumorphicShadows}`;

                      let buttonClass;
                      if (isActive) {
                        buttonClass = activeClass;
                      } else {
                        if (filterName === "All") {
                          buttonClass = inactiveNeumorphicClass;
                        } else {
                          buttonClass = inactiveOutlineClass;
                        }
                      }
                      return (
                        <button
                          key={filter}
                          onClick={() => setActiveFilter(filterName)}
                          className={`px-4 md:px-5 py-2 md:py-2.5  border border-[#6549B8] rounded-full text-xs md:text-sm font-medium transition-all duration-200 ${buttonClass}`}
                        >
                          {filter}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Events List */}
              <EventsList
                isDark={isDark}
                theme={theme}
                events={events}
                activeFilter={activeFilter}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            </div>
            {/* Right Column - Statistics & Calendar (40%) */}
            <div className="lg:col-span-2">
              <div
                className={`w-full rounded-[50px] ${
                  isDark ? theme.cardBg : "bg-[#f1f1f1]"
                } ${getNeumorphicShadows(
                  isDark
                )} p-4 md:p-5 lg:p-6 flex flex-col gap-4 h-full`}
              >
                {/* Group Statistics Chart */}
                <div className="w-full py-6">
                  <GroupStatisticsChart theme={theme} statsData={groupStats} />
                </div>
                {/* Calendar Section */}
                <div className="w-full flex flex-col gap-4 flex-1">
                  <CalendarControls
                    isDark={isDark}
                    theme={theme}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    onSelectMonth={handleSelectMonth}
                    onSelectYear={handleSelectYear}
                    currentMonth={month}
                    currentYear={year}
                    months={shortMonths}
                    fullMonths={fullMonths}
                    className="md:ml-0"
                  />

                  <div className="w-full flex-1">
                    <CalendarGrid
                      isDark={isDark}
                      theme={theme}
                      dates={generateCalendarDates}
                      selectedDate={selectedDate}
                      onDateClick={handleDateClick}
                      className="h-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <GroupSelectionModal
            isDark={isDark}
            groups={groups}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSelectGroup={handleSelectGroup}
          />
        </main>
      </div>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t"
        style={{
          backgroundColor: isDark ? "#212426" : "#f5f5f5",
          paddingBottom: "env(safe-area-inset-bottom)",
          boxShadow: isDark
            ? "0 -4px 6px -1px rgba(0, 0, 0, 0.3)"
            : "0 -4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <BottomNavigation theme={theme} user={user} />
      </nav>
    </div>
  );
};
export default ViewEvent;
