import React, { useState, useEffect, useMemo } from "react";
import SideBar from "../../components/HomePage/SideBar";
import SearchBar from "../../components/HomePage/SearchBar";
import ThemeToggle from "../../components/HomePage/ThemeToggle";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import { getMyEvents } from "../../services/ticketService";
import { Eye } from 'lucide-react';

// Import icons from lucide-react
// Make sure to install lucide-react: npm install lucide-react
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Radio,
} from "lucide-react";

// This function will replace the hardcoded shadow in NEUMORPHIC_CLASS
const getNeumorphicShadows = (isDark) => {
  if (isDark) {
    return "shadow-[inset_5px_5px_10px_#1a1b1e,inset_-5px_-5px_10px_#3c3f44]";
  } else {
    // Define light mode shadows. These are examples, might need fine-tuning.
    return "shadow-[inset_-5px_-5px_10px_rgba(0,0,0,0.1),inset_5px_5px_10px_rgba(255,255,255,1)]";
  }
};

// This function will provide inset shadows for buttons
const getButtonNeumorphicShadows = (isDark) => {
  if (isDark) {
    return "shadow-[inset_2px_2px_5px_#1a1b1e,inset_-2px_-2px_5px_#3c3f44]";
  } else {
    // Light mode inset shadows for buttons
    return "shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.1),inset_2px_2px_5px_rgba(255,255,255,1)]";
  }
};

const getOuterDepthShadows = (isDark) => {
  if (isDark) {
    // More offset, more blur, more contrast
    return "shadow-[10px_10px_20px_#111214,-10px_-10px_20px_#4b4e54]";
  } else {
    // More offset, more blur, more contrast
    return "shadow-[-10px_-10px_20px_rgba(0,0,0,0.1),10px_10px_20px_rgba(255,255,255,1)]";
  }
};



// NEUMORPHIC_CLASS will now be a function or derived dynamically
const getNeumorphicCardClass = (isDark, theme) => {
  const baseClass = `rounded-3xl p-6`;
  const bgColor = theme.cardBg;
  const shadows = getNeumorphicShadows(isDark);
  return `${bgColor} ${baseClass} ${shadows}`;
};

const GroupsCard = ({ isDark, theme, className }) => (
  <div
    className={`${getNeumorphicCardClass(
      isDark,
      theme
    )} ${className} flex flex-col items-center justify-around relative p-4 sm:p-6`}
  >
    <div className="flex flex-col md:flex-row items-center w-full md:w-auto gap-6 md:gap-10 mb-4 mt-2">
      <div className="relative w-full max-w-[100px] aspect-square rounded-full bg-cyan-500/30 flex items-center justify-center border-4 border-cyan-400 shadow-lg">
        <img src="https://i.pinimg.com/736x/53/90/16/539016a188ae741641a63064adcd048e.jpg" alt="Group Image 1" className="w-full h-full object-cover" />
      </div>
      <img
        className="w-full max-w-[100px] aspect-square rounded-full border-4 border-pink-500 object-cover shadow-lg"
        src="https://i.pinimg.com/736x/53/90/16/539016a188ae741641a63064adcd048e.jpg"
        alt="Group Image 2"
      />
    </div>

    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-base font-semibold hover:opacity-90 transition-opacity absolute right-6 bottom-6 shadow-md">
      See more
    </button>
  </div>
);

const StatsCard = ({ isDark, theme, className }) => (
  <div
    className={`${theme.cardBg} rounded-3xl p-6 ${getOuterDepthShadows(isDark)} ${className} flex flex-col items-center justify-around py-8`}
  >
    <div className="text-teal-400">
      <PartyPopper className="h-10 w-10" />
    </div>
    <p className="text-6xl font-bold">666</p>
    <p className={`text-sm ${theme.subText}`}>Confirmed events</p>
  </div>
);

const LiveEventsCard = ({ isDark, theme, className }) => (
  <div
    className={`${theme.cardBg} rounded-3xl p-6 ${getOuterDepthShadows(isDark)} ${className} flex flex-col items-center justify-around py-8`}
  >
    <div className="text-red-500 relative">
      <Radio className="h-10 w-10" />
    </div>
    <p className="text-6xl font-bold">2</p>
    <p className={`text-sm ${theme.subText}`}>Live events</p>
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
  const years = [];
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    years.push(i);
  }
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

const CalendarWidget = ({ isDark, theme, className }) => {
  // Ensure only one modal is open at a time
  const handleSelectYear = (selectedYear) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setFullYear(selectedYear);
      return newDate;
    });
    setShowYearSelector(false);
    setShowMonthSelector(false);
  };

  const handleSelectMonth = (selectedMonth) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(selectedMonth);
      return newDate;
    });
    setShowMonthSelector(false);
    setShowYearSelector(false);
  };
  const [currentDate, setCurrentDate] = useState(new Date()); // State for current month/year display
  const [selectedDate, setSelectedDate] = useState(null); // State for selected date
  const [showMonthSelector, setShowMonthSelector] = useState(false); // New state
  const [showYearSelector, setShowYearSelector] = useState(false); // New state

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
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
  const month = currentDate.getMonth(); // 0-indexed month

  // Helper function to generate calendar dates for the current month
  const generateCalendarDates = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const dates = [];

    // Add leading days from previous month
    for (let i = startDayOfWeek; i > 0; i--) {
      dates.push({
        date: prevMonthLastDay - i + 1,
        isCurrentMonth: false,
        isToday: false,
        fullDate: new Date(year, month - 1, prevMonthLastDay - i + 1),
      });
    }

    // Add days of the current month
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

    // Add trailing days from next month to fill the grid (up to 42 cells)
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
  }, [year, month]); // Recalculate only when year or month changes

  const handlePrevMonth = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Fix: Define handleSelectMonth

  const handleDateClick = (dayInfo) => {
    setSelectedDate(dayInfo.fullDate);
    setCurrentDate(dayInfo.fullDate);
  };

  return (
    <div className={`${className} flex flex-col gap-8`}>
      {/* Controls */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className={`p-3 ${
                theme.inputBg
              } rounded-full ${getButtonNeumorphicShadows(isDark)}`}
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <button
              className={`p-3 ${
                theme.inputBg
              } rounded-full ${getButtonNeumorphicShadows(isDark)}`}
              onClick={handleNextMonth}
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          </div>
          <div className="flex items-center gap-2 relative">
            <div className="relative">
              <button
                className={`flex items-center gap-2 px-4 py-2 ${
                  theme.inputBg
                } rounded-full ${getButtonNeumorphicShadows(isDark)}`}
                onClick={() => {
                  setShowMonthSelector(true);
                  setShowYearSelector(false);
                }}
              >
                <span className="text-lg font-semibold">{months[month]}</span>
                <ChevronDown className="w-6 h-6" />
              </button>
              {showMonthSelector && (
                <div className="absolute left-0 w-full z-20 mt-2">
                  <MonthSelector
                    currentMonth={month}
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
                className={`flex items-center gap-2 px-4 py-2 ${
                  theme.inputBg
                } rounded-full ${getButtonNeumorphicShadows(isDark)}`}
                onClick={() => {
                  setShowYearSelector(true);
                  setShowMonthSelector(false);
                }}
              >
                <span className="text-lg font-semibold">{year}</span>
                <ChevronDown className="w-6 h-6" />
              </button>
              {showYearSelector && (
                <div className="absolute right-0 w-full z-20 mt-2">
                  <YearSelector
                    currentYear={year}
                    onSelectYear={handleSelectYear}
                    onClose={() => setShowYearSelector(false)}
                    isDark={isDark}
                    theme={theme}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Card */}
      <div className={`${getNeumorphicCardClass(isDark, theme)} flex-1`}>
        <div className="grid grid-cols-7 gap-y-2 text-center">
          {days.map((day) => (
            <div key={day} className={`text-sm font-bold ${theme.subText}`}>
              {day}
            </div>
          ))}
          {generateCalendarDates.map((dayInfo, index) => (
            <div
              key={index}
              className={`p-2 rounded-full text-base flex items-center justify-center aspect-square flex-1 mx-auto cursor-pointer ${
                dayInfo.isCurrentMonth ? theme.text : theme.subText
              } ${dayInfo.isToday ? "bg-indigo-600 text-white font-bold" : ""} ${
                selectedDate &&
                dayInfo.fullDate.toDateString() === selectedDate.toDateString()
                  ? "bg-blue-500 text-white font-bold"
                  : ""
              }`}
              onClick={() => handleDateClick(dayInfo)}
            >
              {dayInfo.date}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const EventsTable = ({ isDark, theme, events = [] }) => (
  <div className={`${getNeumorphicCardClass(isDark, theme)}`}>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className={`text-xs ${theme.subText} uppercase`}>
          <tr>
            <th
              scope="col"
              className="px-6 py-3 whitespace-nowrap min-w-max font-extrabold"
            >
              Event name
            </th>
            <th
              scope="col"
              className="px-6 py-3 whitespace-nowrap min-w-max font-extrabold"
            >
              Event Type
            </th>
            <th
              scope="col"
              className="px-6 py-3 whitespace-nowrap min-w-max font-extrabold"
            >
              Date
            </th>
            <th
              scope="col"
              className="px-6 py-3 whitespace-nowrap min-w-max font-extrabold"
            >
              Created At
            </th>
            <th
              scope="col"
              className="px-6 py-3 whitespace-nowrap min-w-max font-extrabold"
            >
              Location
            </th>
            <th
              scope="col"
              className="px-6 py-3 whitespace-nowrap min-w-max font-extrabold"
            >
              Event Mode
            </th>
            <th
              scope="col"
              className="px-6 py-3 whitespace-nowrap min-w-max font-extrabold"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {(events || []).map((event, index) => (
            <tr key={index} className="border-b border-gray-700">
              <td className={`px-6 py-4 font-semibold ${theme.text}`}>
                {event.event_name}
              </td>
              <td className={`px-6 py-4 ${theme.text}`}>{event.event_type}</td>
              <td className={`px-6 py-4 ${theme.text}`}>{event.start_date ? new Date(event.start_date).toLocaleDateString() : 'N/A'}</td>
              <td className={`px-6 py-4 ${theme.text}`}>{event.createdAt ? new Date(event.createdAt).toLocaleDateString() : 'N/A'}</td>
              <td className={`px-6 py-4 ${theme.text}`}>{event.location}</td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 rounded-md text-sm font-semibold ${
                  event.event_mode === "Public"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {event.event_mode}
                </span>
              </td>
              <td className="px-6 py-4">
                <a
                  href="#"
                  className={`flex items-center gap-2 ${theme.subText} hover:${theme.text} transition-colors`}
                >
                  <Eye className="w-6 h-6" />
                  <span>View Details</span>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="flex justify-center items-center mt-6 gap-2">
      {[1, 2, 3, 4, 5].map((num) => (
        <button
          key={num}
          className={`w-9 h-9 rounded-full text-sm flex items-center justify-center transition-colors duration-150 font-semibold ${
            num === 2
              ? "bg-blue-600 text-white"
              : `${theme.inputBg} ${theme.subText} hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900`
          }`}
        >
          {num}
        </button>
      ))}
      <button className="bg-blue-500 text-white px-4 py-1.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity ml-2">
        See more
      </button>
    </div>
  </div>
);

const ViewEvent = () => {
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await getMyEvents();
        if (response && response.tickets) {
          const fetchedTickets = response.tickets;
          if (Array.isArray(fetchedTickets)) {
            setEvents(fetchedTickets);
          } else if (typeof fetchedTickets === 'object' && fetchedTickets !== null) {
            setEvents([fetchedTickets]);
          } else {
            setEvents([]);
          }
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
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

  const theme = isDark
    ? {
        bg: "bg-[#212426]",
        text: "text-white",
        subText: "text-[#c9c9cf]",
        cardBg: "bg-[#232426]",
        border: "border-[#23233a]",
        inputBg: "bg-[#212426]",
      }
    : {
        bg: "bg-slate-100",
        text: "text-gray-900",
        subText: "text-gray-600",
        cardBg: "bg-slate-100",
        border: "border-[#e4e6ea]",
        inputBg: "bg-slate-100",
      };

  // Dummy user object for Sidebar
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
            <div className="flex items-center gap-4 ml-auto flex-shrink-0">
              {/* Removed Bell, MessageSquare, Settings icons */}
              <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <h1 className={`text-4xl font-bold mb-8 ${theme.text}`}>
            View events
          </h1>
          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            {" "}
            {/* Top section: Groups, Stats, Calendar */}
            <GroupsCard isDark={isDark} theme={theme} className="flex-1" />
            <div
              className={`${theme.cardBg} rounded-3xl py-6 px-4 md:px-8 ${getNeumorphicShadows(isDark)} grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 flex-1 justify-center items-center`}
            >
              {/* This will contain the two individual stat cards */}
              <StatsCard isDark={isDark} theme={theme} className="w-full min-h-[200px]" />
              <LiveEventsCard
                isDark={isDark}
                theme={theme}
                className="w-full min-h-[200px]"
              />
            </div>
            <CalendarWidget isDark={isDark} theme={theme} className="flex-1" />
          </div>
          <EventsTable isDark={isDark} theme={theme} events={events} />
        </main>
      </div>
    </div>
  );
};

export default ViewEvent;