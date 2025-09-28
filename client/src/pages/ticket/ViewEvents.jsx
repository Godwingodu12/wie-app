import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import GroupSelectionModal from "../../components/modals/GroupSelectionModal";
import SideBar from "../../components/HomePage/SideBar";
import SearchBar from "../../components/HomePage/SearchBar";
import ThemeToggle from "../../components/HomePage/ThemeToggle";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import { getMyEvents, getGroups, getMyLiveEvents,getGroupStatistics } from "../../services/ticketService";
import PlusIcon from "../../assets/HomePage/PlusIcon.svg";
import NotificationIcon from "../../assets/HomePage/NotificationIcon.svg";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Radio,
  Search,
} from "lucide-react";

// --- Start of inlined DoughnutChart.jsx code ---

const LegendItem = ({ color, label, percentage, theme }) => (
    <div className="w-full flex items-center gap-2">
        <div className="flex items-center gap-2 w-1/3">
            <div className={`w-2 h-2 rounded-full ${color}`}></div>
            <span className={`${theme.text} text-sm truncate`}>{label}</span>
        </div>
        <div className="w-2/3 flex items-center gap-2">
            <div className={`w-full ${theme.cardBg === 'bg-[#232426]' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-1.5`}>
                <div className={`${color} h-1.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
            <span className={`${theme.text} font-medium text-sm w-10 text-right`}>{percentage}%</span>
        </div>
    </div>
);

const DoughnutChart = ({ stats, theme }) => {
  const radius = 42;
  const strokeWidth = 12;
  const viewBoxSize = 100;
  const center = viewBoxSize / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercentage = 0;

  const primaryStat =
    stats.find((s) => s.isPrimary) || (stats.length > 0 ? stats[0] : null);

  return (
    <div className="relative w-44 h-44 md:w-48 md:h-48 flex items-center justify-center mx-auto">
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${theme.text}`}>
          {primaryStat ? `${primaryStat.percentage}%` : "0%"}
        </span>
      </div>
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      >
        <circle
          className="stroke-gray-700"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />
        <g transform={`rotate(-90 ${center} ${center})`}>
          {stats.map((stat, index) => {
            const segmentLength = (circumference * stat.percentage) / 100;
            const offset = (circumference * accumulatedPercentage) / 100;
            accumulatedPercentage += stat.percentage;

            return (
              <circle
                key={index}
                stroke={stat.strokeColor}
                className="transition-all duration-500"
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
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
      <div>
        <h2 className={`text-xl font-bold ${theme.text} mb-4`}>
          Active group statistics
        </h2>
        <p className={`${theme.subText}`}>Not enough data to display stats.</p>
      </div>
    );
  }
  return (
    <>
      <h2 className={`text-xl font-bold ${theme.text} mb-4`}>
        Active group statistics
      </h2>
      <div className="flex flex-col md:flex-row items-center gap-4">
          <div
            style={{
              width: "252px",
              height: "252px",
              padding: "53px 51px", 
              display: "flex",
              gap: "5px",
              opacity: 1,
              transform: "translate(-50px, -10px)",
              boxSizing: "border-box",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <DoughnutChart stats={statsData} theme={theme} />
          </div>
          <div
            className="w-full flex-grow"
            style={{ transform: "translateX(-40px)" }}
          >
            <div className="flex flex-col space-y-4">
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
    ? "shadow-[inset_5px_5px_10px_#1a1b1e,inset_-5px_-5px_10px_#3c3f44]"
    : "shadow-[inset_5px_5px_10px_#a4a4a4,inset_-5px_-5px_10px_#ffffff]";
const getButtonNeumorphicShadows = (isDark) =>
  isDark
    ? "shadow-[inset_2px_2px_5px_#1a1b1e,inset_-2px_-2px_5px_#3c3f44]"
    : "shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.1),inset_2px_2px_5px_rgba(255,255,255,1)]";
const getOuterDepthShadows = (isDark) =>
  isDark
    ? "shadow-[10px_10px_20px_#111214,-10px_-10px_20px_#4b4e54]"
    : "shadow-[-10px_-10px_20px_rgba(0,0,0,0.1),10px_10px_20px_rgba(255,255,255,1)]";
const getNeumorphicCardClass = (isDark, theme) =>
  `${
    isDark ? theme.cardBg : "bg-[#f1f1f1]"
  } rounded-[2.5rem] p-4 ${getNeumorphicShadows(isDark)}`;

const MyGroupsCard = ({ theme, groups, isDark }) => (
  <div className="h-full flex flex-col">
    <div className="flex items-center justify-between w-full mb-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xl font-semibold">My groups,</h3>
        <p className={`text-sm ${theme.subText}`}>{groups.length} groups</p>
      </div>
      {groups.length > 2 && (
        <button className={`text-sm ${theme.subText} hover:underline`}>
          See more
        </button>
      )}
    </div>
    <div className="flex flex-row items-center justify-start w-full gap-6 flex-grow">
      {groups.slice(0, 2).map((group, index) => (
        <div key={index} className="flex flex-col items-center gap-2">
          <div
            className="relative w-[100px] h-[100px] rounded-[58px] overflow-hidden"
            style={{
              boxShadow: isDark 
                ? 'inset 6px 6px 12px 0px rgba(0,0,0,0.18), inset -6px -6px 12px 0px rgba(255,255,255,0.08)'
                : 'inset 6px 6px 12px 0px rgba(0,0,0,0.18), inset -6px -6px 12px 0px rgba(255,255,255,0.08)'
            }}
          >
            <img
              src={group.id_proof}
              alt={group.name}
              className="w-full h-full object-cover"
            />
          </div>
          <p className={`font-medium text-sm ${theme.text} text-center`}>
            {group.name}
          </p>
        </div>
      ))}
    </div>
  </div>
);
// StatsCard.jsx
const StatsCard = ({ count, title }) => (
  <div
    style={{
      width: "119px",
      height: "160px",
      borderRadius: "40px",
      padding: "15px 27px",
      gap: "10px",
      background: "var(--Color, #FFFFFF)",
      boxShadow:
        "8px 8px 12px #00000029, -8px -8px 12px #FFFFFF0A",
    }}
    className="flex flex-col items-center justify-around"
  >
    <div className="text-yellow-400">
      <PartyPopper className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
    </div>
    <p className="text-2xl sm:text-3xl md:text-5xl font-semibold">{count}</p>
    <p className="text-xs text-gray-500">{title}</p>
  </div>
);

// LiveEventsCard.jsx
const LiveEventsCard = ({ count }) => (
  <div
    style={{
      width: "119px",
      height: "160px",
      borderRadius: "40px",
      padding: "15px 27px",
      gap: "10px",
      background: "var(--Color, #FFFFFF)",
      boxShadow:
        "8px 8px 12px #00000029, -8px -8px 12px #FFFFFF0A",
    }}
    className="flex flex-col items-center justify-around"
  >
    <div className="text-red-500 relative">
      <Radio className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
    </div>
    <p className="text-2xl sm:text-3xl md:text-5xl font-semibold">{count}</p>
    <p className="text-xs text-gray-500">Live events</p>
  </div>
);
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
      className={`absolute z-10 ${
        theme.cardBg
      } rounded-xl ${getButtonNeumorphicShadows(
        isDark
      )} p-1 flex flex-col gap-1 w-24 shadow-lg`}
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
      className={`absolute z-10 ${
        theme.cardBg
      } rounded-xl ${getButtonNeumorphicShadows(
        isDark
      )} p-1 flex flex-col gap-1 w-24 shadow-lg`}
      style={{ ...style, maxHeight: "13.5rem", overflowY: "auto" }}
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
  className,
}) {
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const calendarBg = isDark ? theme.cardBg : "bg-gray-200";

  return (
    <div
      className={`flex flex-row items-center justify-between ${className || ""}`}
      style={{
        width: '411px', // Reduced width to fit better
        height: '42px',
        opacity: 1,
      }}
    >
      <div 
        className="flex items-center"
        style={{
          width: '100px',
          height: '42px',
          gap: '16px',
          opacity: 1,
        }}
      >
        <button
          onClick={onPrevMonth}
          className={`p-2 flex items-center justify-center ${calendarBg} rounded-full ${getButtonNeumorphicShadows(
            isDark
          )}`}
          style={{ width: '42px', height: '42px' }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onNextMonth}
          className={`p-2 flex items-center justify-center ${calendarBg} rounded-full ${getButtonNeumorphicShadows(
            isDark
          )}`}
          style={{ width: '42px', height: '42px' }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => {
              setShowMonthSelector((s) => !s);
              setShowYearSelector(false);
            }}
            className={`flex items-center justify-between ${calendarBg} rounded-full ${getButtonNeumorphicShadows(
              isDark
            )}`}
            style={{
              width: '170px', // Reduced width
              height: '42px',
              gap: '10px',
              paddingTop: '9px',
              paddingRight: '20px', // Reduced padding
              paddingBottom: '9px',
              paddingLeft: '20px', // Reduced padding
              opacity: 1,
            }}
          >
            <span className="text-sm font-semibold">
              {months[currentMonth]}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showMonthSelector && (
            <div className="absolute z-20 mt-2" style={{ left: '20px' }}>
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
            className={`flex items-center justify-between ${calendarBg} rounded-full ${getButtonNeumorphicShadows(
              isDark
            )}`}
            style={{
              width: '95px', // Reduced width to fit better
              height: '42px',
              gap: '8px', // Reduced gap
              paddingTop: '9px',
              paddingRight: '16px', // Reduced padding
              paddingBottom: '9px',
              paddingLeft: '16px', // Reduced padding
              opacity: 1,
            }}
          >
            <span className="text-sm font-semibold">{currentYear}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showYearSelector && (
            <div className="absolute z-20 mt-2" style={{ right: '0px' }}> {/* Fixed positioning */}
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
  const calendarBg = isDark ? theme.cardBg : "bg-gray-200";

  return (
    <div
      className={`${calendarBg} rounded-[2.5rem] mx-auto ${getOuterDepthShadows(isDark)}`}
      style={{
        width: '411px', // Reduced width to match controls
        height: '280px', // Increased height to show all dates
        padding: '20px 16px', // Reduced padding for more space
        gap: '8px',
        opacity: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="grid grid-cols-7 gap-1 text-center mb-2"> {/* Reduced gap and added margin-bottom */}
        {days.map((day) => (
          <div
            key={day}
            className={`text-xs font-bold ${theme.subText}`} // Reduced font size
          >
            {day}
          </div>
        ))}
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
            ringClass = isDark ? "ring-2 ring-purple-400" : "ring-2 ring-purple-600";
            fontClass = "font-bold";
            bgColorClass = isDark ? "" : "bg-white";
          } else if (isToday) {
            bgColorClass = "bg-[#6549B8]";
            textColorClass = "text-white";
            fontClass = "font-bold";
          }

          return (
            <div
              key={index}
              className={`p-1 rounded-xl text-sm flex items-center justify-center cursor-pointer transition-colors duration-200 ${bgColorClass} ${textColorClass} ${fontClass} ${ringClass} ${otherClasses}`} // Reduced padding and font size
              style={{ minHeight: '28px', minWidth: '28px' }} // Added minimum dimensions
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
const EventsList = ({ isDark, theme, events = [], activeFilter }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredEvents = useMemo(() => {
    if (activeFilter === "All") {
      return events;
    }
    if (activeFilter === "Paid") {
      return events.filter(
        (event) => event.ticket_types && event.ticket_types.length > 0
      );
    }
    if (activeFilter === "Free") {
      return events.filter(
        (event) => !event.ticket_types || event.ticket_types.length === 0
      );
    }
    return [];
  }, [events, activeFilter]);

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

 return (
  <div 
    style={{
      width: '717px',
      height: '362px',
      borderRadius: '50px',
      padding: '21px 40px',
      gap: '10px',
      background: isDark ? theme.cardBg : '#F1F1F1',
      boxShadow: 'inset 6px 6px 12px 0px rgba(0,0,0,0.18), inset -6px -6px 12px 0px rgba(255,255,255,0.08)',
      opacity: 1,
      transform: 'rotate(0deg)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}
    className="mx-auto"
  >
    {/* Scrollable content area */}
    <div className="flex-1 overflow-y-auto">
      {/* Mobile view */}
      <div className="flex flex-col md:hidden">
        {displayEvents.map((event, index) => {
          if (!event) {
            return (
              <div
                key={`placeholder-${index}`}
                className="p-4 h-[80px]"
              >
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
                  <span className={`${theme.text} truncate`}>{event.event_name}</span>
                </div>
                <button
                  className={`px-8 py-2 border border-[#6549B8] rounded-full text-sm transition-colors ${
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
                <p>Event type: {event.event_type}</p>
              </div>
            </div>
          );
        })}
      </div>
      <table className="hidden md:table w-full table-fixed text-left">
        <thead>
          <tr
            className={`${isDark ? "text-gray-400" : "text-black"} border-b ${
              isDark ? "border-gray-700" : "border-gray-200"
            } text-sm sticky top-0`}
            style={{ 
              background: isDark ? theme.cardBg : '#F1F1F1',
              zIndex: 10 
            }}
          >
            <th className="py-3 px-4 font-bold text-lg w-[45%]">
              <div className="flex items-center gap-2">
                <span>Event</span>
                <Search className="w-4 h-4" />
              </div>
            </th>
            <th className="w-[145px] h-[24px] px-[10px] font-bold text-lg">
              <div className="flex flex-row items-center gap-[10px]">
                <span>Category</span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </th>
            <th className="py-3 px-4 font-bold text-lg w-[20%]">
              <div className="flex items-center gap-2">
                <span>Event type</span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </th>
            <th className="py-3 px-4 font-normal w-[15%]"></th>
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
                } ${isDark ? "hover:bg-gray-800/30" : "hover:bg-gray-100/50"}`}
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
                    <span className={`${theme.text} text-sm truncate`}>{event.event_name}</span>
                  </div>
                </td>
                <td className={`py-3 px-4 ${theme.text} text-sm truncate`}>
                  {event.event_category ? event.event_category : "N/A"}
                </td>
                <td className={`py-3 px-4 ${theme.text} text-sm truncate`}>
                  {event.event_type ? event.event_type : "N/A"}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
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

    {/* Pagination */}
    {totalPages > 1 && (
      <div className="flex justify-center mt-3 pt-2 border-t border-opacity-20" style={{ borderColor: isDark ? '#4a5568' : '#e2e8f0' }}>
        <div className="flex items-center gap-2">
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
  const [searchValue, setSearchValue] = useState("");
  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [liveEventsCount, setLiveEventsCount] = useState(0);
  const [groupStats, setGroupStats] = useState([]);

  const handleCreateEvent = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const groupsResponse = await getGroups();
      const groupsArray = Array.isArray(groupsResponse) ? groupsResponse : groupsResponse.data || [];
      setGroups(groupsArray);
      if (groupsArray.length === 0) navigate("/ticket/create-group");
      else if (groupsArray.length === 1) navigate(`/ticket/create-event/${groupsArray[0]._id}`);
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
  const confirmedEventsCount = events.length;
  const months = [
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
    setSelectedDate(dayInfo.fullDate);
    setCurrentDate(dayInfo.fullDate);
  };

    useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, groupsRes, liveEventsRes, groupStatsRes] = await Promise.all([
          getMyEvents(),
          getGroups(),
          getMyLiveEvents(),
          getGroupStatistics()
        ]);

        const eventsArray = Array.isArray(eventsRes.tickets)
          ? eventsRes.tickets
          : eventsRes.tickets
          ? [eventsRes.tickets]
          : [];
        
        const groupsArray = Array.isArray(groupsRes) ? groupsRes : groupsRes.data || [];
        
        setEvents(eventsArray);
        setGroups(groupsArray);
        setLiveEventsCount(
          liveEventsRes.tickets ? liveEventsRes.tickets.length : 0
        );

        // Process group statistics data
        if (groupStatsRes && groupStatsRes.data && Array.isArray(groupStatsRes.data)) {
          const processedStats = groupStatsRes.data.map((stat, index) => {
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
        setLiveEventsCount(0);
        setGroupStats([]);
      }
    };

    fetchData();
  }, []);


  useEffect(() => {
    if (events.length > 0 && groups.length > 0) {
      const stats = groups.map((group) => {
        const groupEvents = events.filter((event) => event.groupId === group._id);
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
        cardBg: "bg-[#232426]",
      }
    : {
        bg: "bg-slate-100",
        text: "text-gray-900",
        subText: "text-gray-600",
        cardBg: "bg-slate-100",
      };

  const user = { name: "U" };

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
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onTuneClick={() => {}}
              />
            </div>
            <div className="relative">
                <div style={{ boxShadow: isDark ? 'inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)' : 'inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)' }} className={`w-12 h-12 rounded-full flex items-center justify-center ${theme.bg}`}>
                  <img src={NotificationIcon} alt="Notification" className={`w-4 h-4 ${isDark ? 'filter brightness-0 invert' : 'filter brightness-0'}`} />
                </div>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">12</span>
            </div>
            <div className="flex items-center gap-4 ml-auto flex-shrink-0">
              <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
            <div>
              <h1 className={`text-4xl  ${theme.text}`}>View events</h1>
              <p className={`${theme.subText} mt-2 text-lg`}>
                Review and manage everything related to events
              </p>
            </div>
            <button onClick={handleCreateEvent} disabled={loading} style={{boxShadow: isDark? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)": "-4px -4px 8px rgba(255,255,255,0.9), 4px 4px 8px rgba(0,0,0,0.15)", }}
              className={`hidden md:flex flex-1 md:flex-none items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition h-12 ${theme.bg} ${theme.text} ${
                isDark ? "hover:bg-[#2a2d2f]" : "hover:bg-gray-200"}`}>
              <span className="w-[38px] h-[38px] flex items-center justify-center rounded-full -ml-2"style={{background: "#3EB489", padding: "7px",boxShadow:"inset 4px 4px 12px #00000052, inset -4px -4px 8px #FFFFFF05", }} >
                <img src={PlusIcon} alt="Add" className="w-6 h-6" /></span>{loading ? "Checking..." : "Create event"}
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 xl:gap-8">
            {/* Left Column (60%) */}
            <div className="lg:col-span-3 flex flex-col gap-6 xl:gap-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
                <MyGroupsCard theme={theme} groups={groups} isDark={isDark} />
               <div
                  style={{
                    width: "300px",
                    height: "203px",
                    borderRadius: "50px",
                    padding: "21px",
                    gap: "20px",
                    background: "var(--white_cardfill, #F1F1F1)",
                    boxShadow:
                      "inset 6px 6px 12px #0000002E, inset -6px -6px 12px #FFFFFF14",
                  }}
                  className="grid grid-cols-2 items-center"
                >
                  <StatsCard
                    isDark={isDark}
                    theme={theme}
                    className="w-full h-56"
                    count={confirmedEventsCount}
                    title="Total events"
                  />
                  <LiveEventsCard
                    isDark={isDark}
                    theme={theme}
                    className="w-full h-56"
                    count={liveEventsCount}
                  />
                </div>

              </div>
              <div className="flex justify-end items-center mb-2">
                <div className="flex items-center gap-2">
                  {["All events", "Paid events", "Free events"].map(
                    (filter) => {
                      const filterName = filter.split(" ")[0];
                      const isActive = activeFilter === filterName;

                      const activeClass =
                        "bg-gradient-to-br from-[#6D4DE6] to-[#896CF1] text-white shadow-lg";
                      const inactiveOutlineClass = `border border-[#6D4DE6] ${
                        isDark ? "text-white" : "text-[#6D4DE6]"
                      }`;
                      const inactiveNeumorphicClass = `${
                        theme.text
                      } ${getButtonNeumorphicShadows(isDark)}`;

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
                          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${buttonClass}`}
                        >
                          {filter}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
              <EventsList isDark={isDark} theme={theme} events={events} activeFilter={activeFilter} />
            </div>
            {/* Right Column (40%) */}
            <div className="lg:col-span-2">
              <div
                style={{
                  width: '459px',
                  height: '671px',
                  borderRadius: '50px',
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  background: isDark ? theme.cardBg : '#F1F1F1',
                  boxShadow: 'inset 6px 6px 12px 0px rgba(0,0,0,0.18), inset -6px -6px 12px 0px rgba(255,255,255,0.08)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  overflow: 'hidden',
                  margin: '0 auto'
                }}
              >
                {/* Group Statistics Chart */}
                <div style={{ flex: '0 0 auto' }}>
                  <GroupStatisticsChart theme={theme} statsData={groupStats} />
                </div>
                
                {/* Calendar Section */}
               <div
  style={{
    width: "411px", // Match the reduced width
    height: "340px", // Increased height for better visibility
    flex: "1",
    display: "flex",
    flexDirection: "column",
    gap: "16px", // Increased gap between controls and grid
    margin: "0 auto" // Center the calendar
  }}
>
  <CalendarControls
    isDark={isDark}
    theme={theme}
    onPrevMonth={handlePrevMonth}
    onNextMonth={handleNextMonth}
    onSelectMonth={handleSelectMonth}
    onSelectYear={handleSelectYear}
    currentMonth={month}
    currentYear={year}
    months={months}
  />
  
  <div style={{ flex: '1 1 auto', overflow: 'visible' }}> {/* Changed overflow to visible */}
    <CalendarGrid
      isDark={isDark}
      theme={theme}
      dates={generateCalendarDates}
      selectedDate={selectedDate}
      onDateClick={handleDateClick}
    />
  </div>
</div>
                
                <GroupSelectionModal
                  groups={groups}
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  onSelectGroup={handleSelectGroup}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
export default ViewEvent;
