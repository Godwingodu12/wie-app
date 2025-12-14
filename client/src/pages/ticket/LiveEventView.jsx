import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import ThemeToggle from "../../components/HomePage/ThemeToggle";
import SearchBar from "../../components/HomePage/SearchBar";
import SideBar from "../../components/HomePage/SideBar";
import BottomNavigation from "../../components/HomePage/BottomNavigation";
import WieLogo from "../../assets/HomePage/WieLogo.svg?url";
import { toast } from "react-hot-toast";
import {
  getMyLiveEventView,
  getGroupView,
  getTicketById,
} from "../../services/ticketService";
import {
  Radio,
  ArrowLeft,
  Lock,
  LayoutGrid,
  XCircle,
  Heart,
  Share2,
  Armchair,
  Users,
  MapPin,
  Landmark,
  Download,
  Bell,
  Ticket,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

const HEADER_HEIGHT = 72; // From HomePage

// Main Component
const LiveEventsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  // API State Management
  const [eventData, setEventData] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupName, setGroupName] = useState("");
  // Fetch event data
  useEffect(() => {
    const fetchEventData = async () => {
      if (!ticketId) {
        setError("Event ID not found in URL parameters.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch ticket data using getTicketById (matches ConfirmEventView)
        const ticketResponse = await getTicketById(ticketId);

        // Extract event data - Handle multiple response structures (Robust extraction)
        const data =
          ticketResponse?.ticket ||
          ticketResponse?.data?.ticket ||
          ticketResponse?.data ||
          ticketResponse;

        if (!data) {
          throw new Error("No event data received from server");
        }

        if (!data.event_name) {
          throw new Error("Invalid event data structure");
        }
        setEventData(data);
        // Fetch group data if groupId exists
        if (data.groupId) {
          try {
            const groupResponse = await getGroupView(ticketId);
            const fetchedGroupData =
              groupResponse?.data?.group ||
              groupResponse?.group ||
              groupResponse?.data ||
              groupResponse;
            setGroupData(fetchedGroupData);
            setGroupName(fetchedGroupData.name || "Unknown Group");
          } catch (groupErr) {
            console.warn("Failed to fetch group data:", groupErr);
            // Continue without group data
          }
        }
      } catch (err) {
        console.error("Failed to fetch live event data:", err);
        const errorMessage =
          err?.response?.data?.message ||
          err.message ||
          "Failed to load event details.";
        toast.error(errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [ticketId]);

  // Computed values from API data
  const computedEventData = eventData
    ? {
      name: eventData.event_name || "Event Name",
      creator: eventData.created_by || "Unknown Creator",
      // These fields might need backend calculation
      totalRevenue: eventData.total_revenue || "0",
      totalBooking: eventData.total_bookings || "0",
      totalCancellation: eventData.total_cancellations || "0",
      totalLikes: eventData.like || "0",
      totalShare: eventData.share_count || "0",
      addOnRevenue: eventData.addon_revenue || "$0",
      addOnRevenueMonth: eventData.addon_revenue_month || "$0",
    }
    : null;
  // Theme setup from HomePage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);
  const chartData = eventData?.revenue_data || [
    { month: "JAN", value: 320, height: "h-24" },
    { month: "FEB", value: 320, height: "h-32" },
    { month: "MAR", value: 320, height: "h-28" },
    { month: "APR", value: 320, height: "h-20" },
    { month: "MAY", value: 320, height: "h-40" },
    { month: "JUN", value: 320, height: "h-28" },
    { month: "JUL", value: 320, height: "h-24" },
    { month: "AUG", value: 320, height: "h-16" },
  ];
  const generateCalendarDays = () => {
    // Rely on currentDate state for calendar navigation
    // We want to show a week or a month? The original code showed a week starting from event date or today.
    // To support "Calendar Controls" (Month/Year), we usually show the whole month or at least a week within that month.
    // The user's request is "check for calendar controls... implement the same buttons".
    // I will anchor the 7-day view to the 'currentDate' state.

    // Logic: Show 7 days starting from the beginning of the week of 'currentDate'
    // OR if we want to show strict days of the selected month/year.
    // Let's stick to the "week" view but updated by the controls for now, as the grid is 7 cols but only 1 row (based on original code).
    // Wait, original code: for (let i = 0; i < 7; i++)

    // Better Approach: 'currentDate' represents the focal point.
    // If the user changes Month/Year, 'currentDate' updates.
    // We display the week containing 'currentDate', or just the first 7 days of that month?
    // Let's display the week containing 'currentDate'.

    const dayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        day: date
          .toLocaleDateString("en-US", { weekday: "short" })
          .toLowerCase(),
        date: date.getDate().toString(),
        active: date.toDateString() === currentDate.toDateString(),
        fullDate: date,
      });
    }
    return days;
  };
  const calendarDays = generateCalendarDays();
  const addOnEvents =
    eventData?.sub_events?.map((subEvent) => ({
      name: subEvent.event_name,
      id: subEvent._id,
      category: subEvent.event_category,
      banner: subEvent.event_banner,
    })) || [];
  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  // Theme object from HomePage
  const theme = isDark
    ? {
      bg: "bg-[#212426]", // Using HomePage dark theme
      text: "text-white",
      subText: "text-[#c9c9cf]",
      cardBg: "bg-[#212426]", // Using HomePage dark theme
      border: "border-[#23233a]",
      inputBg: "bg-[#212426]",
      // Specific colors from screenshot for this page
      cardBgDarker: "bg-[#1C1C1E]", // A slightly darker card bg from screenshot
      purpleBtn: "bg-gradient-to-r from-[#6a47fa] to-[#5a3fea]",
      activePill: "bg-white text-black",
      inactivePill: "bg-transparent text-white border border-gray-700",
    }
    : {
      bg: "bg-[#f0f2f5]",
      text: "text-gray-900",
      subText: "text-gray-600",
      cardBg: "bg-[#ffffff]", // Using white for light mode cards
      border: "border-[#e4e6ea]",
      inputBg: "bg-[#ffffff]",
      // Specific colors for light mode
      cardBgDarker: "bg-gray-100",
      purpleBtn: "bg-gradient-to-r from-[#6a47fa] to-[#5a3fea] text-white",
      activePill: "bg-black text-white",
      inactivePill: "bg-transparent text-black border border-gray-300",
    };

  // Neumorphism shadow style from HomePage
  const neumorphShadow = {
    boxShadow: isDark
      ? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)"
      : "-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)",
  };

  // Specific shadows from user request (Dark Mode mainly)
  const controlShadow = isDark
    ? "4px 4px 12px 0px #00000029, -4px -4px 12px 0px #FFFFFF0A"
    : "4px 4px 12px 0px rgba(0,0,0,0.1), -4px -4px 12px 0px rgba(255,255,255,0.8)"; // Adapted for light

  const activeDateShadow = isDark
    ? "inset 6px 6px 12px 0px #0000002E, inset -6px -6px 12px 0px #FFFFFF14"
    : "inset 6px 6px 12px 0px rgba(0,0,0,0.1), inset -6px -6px 12px 0px rgba(255,255,255,0.8)";

  const calendarBg = isDark ? theme.cardBg : "bg-white";

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

  const handlePrevMonth = () => {
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() - 1);
      return n;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() + 1);
      return n;
    });
  };

  const handleSelectMonth = (m) => {
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setMonth(m);
      return n;
    });
  };

  const handleSelectYear = (y) => {
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setFullYear(y);
      return n;
    });
  };

  // A darker/flatter shadow for the inner cards, closer to the screenshot
  const cardStyle = {
    border: "3px solid transparent",
    backgroundImage: isDark
      ? "linear-gradient(#212426, #212426), linear-gradient(286.41deg, #171717 -2.79%, #343434 101.27%)"
      : "linear-gradient(#F1F1F1, #F1F1F1), linear-gradient(286.41deg, #e8e8e8 -2.79%, #f5f5f5 101.27%)",
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
    boxShadow: isDark
      ? "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A"
      : "8px 8px 12px 0px #0000001A, -8px -8px 12px 0px #FFFFFF80",
  };

  const calendarSpecificCardStyle = isDark
    ? { ...cardStyle, borderRadius: "36px" }
    : {
      background: "#F1F1F1",
      borderRadius: "24px",
      boxShadow: "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A",
    };
  // Loading State
  if (loading) {
    return (
      <div
        className={`${theme.bg} ${theme.text} min-h-screen flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading Live Event Data...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !eventData) {
    return (
      <div
        className={`${theme.bg} min-h-screen flex flex-col items-center justify-center text-xl text-red-400 p-8`}
      >
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold">Error Loading Event</p>
          <p className="text-lg">
            {error || `Event with ID "${ticketId}" not found.`}
          </p>
          <div className="text-sm text-gray-400 mt-4">
            <p>Ticket ID: {ticketId}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  const formattedDate = eventData?.event_dates?.[0]?.start_date
    ? new Date(eventData.event_dates[0].start_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    : "N/A";
  return (
    <>
      <style>{`
        /* Main page scrollbar (using HomePage style) */
        body::-webkit-scrollbar,
        html::-webkit-scrollbar,
        .overflow-y-auto::-webkit-scrollbar { width: 8px; }
        body::-webkit-scrollbar-track,
        html::-webkit-scrollbar-track,
        .overflow-y-auto::-webkit-scrollbar-track { background: ${isDark ? "#1f2937" : "#f1f1f1"
        }; }
        body::-webkit-scrollbar-thumb,
        html::-webkit-scrollbar-thumb,
        .overflow-y-auto::-webkit-scrollbar-thumb { background: ${isDark ? "#4b5563" : "#cbd5e1"
        }; border-radius: 10px; }
        body::-webkit-scrollbar-thumb:hover,
        html::-webkit-scrollbar-thumb:hover,
        .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: ${isDark ? "#6b7280" : "#94a3b8"
        }; }
        /* Hide scrollbar for specific elements */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}</style>
      <div
        className={`${theme.bg} ${theme.text} min-h-screen flex overflow-hidden transition-colors duration-300`}
      >
        {/* Desktop Sidebar (from HomePage) */}
        <div
          className={`hidden md:flex flex-col flex-shrink-0 nest-hub-sidebar ${theme.bg} border-r ${theme.border}`}
        >
          <div
            className="flex items-center justify-center"
            style={{ height: HEADER_HEIGHT }}
          >
            <img src={WieLogo} alt="Wie Logo" className="w-12 h-12" />
          </div>
          <div className="flex-1 sidebar-content overflow-y-auto">
            <SideBar user={user} theme={theme} />
          </div>
        </div>

        <div className="flex flex-col flex-1 relative overflow-hidden">
          {/* Header (from HomePage) */}
          <header
            className="flex items-center justify-between px-4 md:px-6 flex-shrink-0"
            style={{ height: HEADER_HEIGHT }}
          >
            {/* Mobile Header (from HomePage) */}
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

            {/* Desktop Header (from HomePage) */}
            <div className="hidden md:flex items-center gap-4 w-full">
              <div className="flex-1 min-w-0">
                <SearchBar
                  theme={theme}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onTuneClick={() => { }}
                />
              </div>
              <div className="flex items-center gap-4 ml-auto flex-shrink-0">
                <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
              </div>
            </div>
          </header>

          {/* --- Main Content Area (New Design) --- */}
          <main
            className={`main-scrollbar flex flex-col flex-1 p-4 md:p-6 lg:px-8 lg:pt-8 overflow-y-auto pb-32 md:pb-8 ${theme.bg}`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10">
              {/* Page Header (Left) */}
              <div className="flex items-center gap-4 mb-4 lg:mb-0">
                <button
                  onClick={() => navigate(-1)} // Use navigate(-1) to go back
                  style={neumorphShadow}
                  className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${theme.bg} ${theme.text} hover:scale-105 transition-transform`}
                >
                  <ArrowLeft />
                </button>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-semibold flex items-center gap-3">
                    <Radio className="text-red-500" />
                    {computedEventData?.name || "Loading..."}
                  </h1>
                  <div className="mt-4">
                    <p className="text-base">
                      <span className={`${theme.subText}`}>
                        Created under: {""}
                      </span>
                      <span className={`${theme.text}`}>{groupName}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter Pills (Right) */}
              <div className="flex items-center gap-3 flex-wrap pb-2 lg:pb-0 mt-4 lg:mt-0">
                <button
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${theme.inactivePill} ml-auto lg:ml-0 text-blue-500`}
                >
                  January 22 - January 29
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Left Side: Total Revenue & Total Booking */}
              <StatCard
                theme={theme}
                shadow={{ ...cardStyle, borderRadius: "20px" }}
                icon={<Lock />}
                title="TOTAL REVENUE"
                value={`$${computedEventData?.totalRevenue || "0"}`}
                color={theme.subText}
              />
              <StatCard
                theme={theme}
                shadow={{ ...cardStyle, borderRadius: "20px" }}
                icon={<LayoutGrid />}
                title="TOTAL BOOKING"
                value={computedEventData?.totalBooking || "0"}
                color={theme.subText}
              />
              {/* Right Side: Total Cancellation & Combined Likes/Share */}
              <StatCard
                theme={theme}
                shadow={{ ...cardStyle, borderRadius: "20px" }}
                icon={<XCircle />}
                title="TOTAL CANCELLATION"
                value={computedEventData?.totalCancellation || "0"}
                color={theme.subText}
              />
              <div
                className={`p-6 rounded-3xl ${theme.cardBgDarker}`}
                style={{ ...cardStyle, borderRadius: "20px" }}
              >
                <div className="flex justify-around items-center">
                  {/* Total Likes Section */}
                  <div className="flex flex-col items-center">
                    <span
                      className={`text-xs uppercase font-semibold ${theme.subText} mb-2`}
                    >
                      TOTAL LIKES
                    </span>
                    <Heart className="text-pink-500 w-6 h-6 mb-1" />
                    <div className={`text-xl font-bold ${theme.text}`}>
                      {computedEventData?.totalLikes || "0"}
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="h-16 w-px bg-gray-600"></div>

                  {/* Total Share Section */}
                  <div className="flex flex-col items-center">
                    <span
                      className={`text-xs uppercase font-semibold ${theme.subText} mb-2`}
                    >
                      TOTAL SHARE
                    </span>
                    <Share2 className="text-blue-500 w-6 h-6 mb-1" />
                    <div className={`text-xl font-bold ${theme.text}`}>
                      {computedEventData?.totalShare || "0"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
              {/* Left Column: Total Booking of Add-On Events Chart */}
              <div
                className={`lg:col-span-2 py-8 px-6 rounded-3xl ${theme.cardBgDarker} flex flex-col`}
                style={{ ...cardStyle, borderRadius: "50px" }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <h3 className="text-base font-semibold uppercase tracking-wider">
                    Total Booking of Add-On Events
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold">
                      {computedEventData?.addOnRevenue || "$0"}
                    </div>
                    <div className={`${theme.subText} text-base`}>
                      Total amount
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl ${theme.bg} text-center`}>
                    <div className={`${theme.subText} text-sm`}>
                      Revenue of this month
                    </div>
                    <div className="text-xl font-bold">
                      {computedEventData?.addOnRevenueMonth || "$0"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-16 h-8" />
                    <div
                      className={`w-10 h-10 rounded-full border ${theme.border} flex items-center justify-center`}
                    >
                      <span className="text-sm font-bold">14%</span>
                    </div>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="flex justify-around items-end flex-1 overflow-x-auto">
                  {chartData.map((bar) => (
                    <div
                      key={bar.month}
                      className="flex flex-col items-center gap-2"
                    >
                      <span className={`text-base ${theme.subText}`}>
                        {bar.value}k
                      </span>
                      <div
                        className={`w-6 rounded-t-lg bg-green-500 ${bar.height}`}
                      ></div>
                      <span className={`text-base ${theme.subText}`}>
                        {bar.month}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  className={`flex justify-between text-base ${theme.subText} mt-4 pt-4 border-t ${theme.border}`}
                >
                  <span>Coldpoly concert : $666.27k</span>
                </div>
              </div>

              {/* Right side: Ticket types, Seating layout, Calendar, and Add-on Events */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                {/* Top section: Ticket types, Seating layout, and Calendar */}
                <div className="flex flex-col md:flex-row gap-8 md:gap-2">
                  {/* Ticket types and Seating layout */}
                  <div className="flex flex-row md:flex-col items-center justify-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <button
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center ${theme.purpleBtn} text-white`}
                      >
                        <Ticket className="w-8 h-8 filter brightness-0 invert" />
                      </button>
                      <span className="text-xs font-medium">Ticket types</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <button
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center ${theme.purpleBtn} text-white`}
                      >
                        <Armchair className="w-8 h-8 filter brightness-0 invert" />
                      </button>
                      <span className="text-xs font-medium">
                        Seating layout
                      </span>
                    </div>
                  </div>

                  {/* Calendar */}
                  <div className="flex-1">
                    <div
                      className={`h-full p-4 sm:p-6 md:p-1 lg:p-6 ${isDark ? theme.cardBgDarker : ""}`}
                      style={calendarSpecificCardStyle}
                    >
                      <div className="flex flex-row flex-nowrap overflow-x-auto scrollbar-hide items-center justify-between gap-2 w-full mb-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handlePrevMonth}
                            style={{
                              boxShadow: controlShadow,
                              borderRadius: "30px",
                            }}
                            className={`flex items-center justify-center ${calendarBg} w-10 h-10 md:w-12 md:h-12 flex-shrink-0`}
                          >
                            <ChevronLeft
                              className={`${theme.text}`}
                              size={20}
                            />
                          </button>
                          <button
                            onClick={handleNextMonth}
                            style={{
                              boxShadow: controlShadow,
                              borderRadius: "30px",
                            }}
                            className={`flex items-center justify-center ${calendarBg} w-10 h-10 md:w-12 md:h-12 flex-shrink-0`}
                          >
                            <ChevronRight
                              className={`${theme.text}`}
                              size={20}
                            />
                          </button>
                        </div>

                        <div className="flex w-auto items-center gap-2">
                          {/* Month Selector */}
                          <div className="relative w-auto">
                            <button
                              onClick={() => {
                                setShowMonthSelector(!showMonthSelector);
                                setShowYearSelector(false);
                              }}
                              style={{
                                boxShadow: controlShadow,
                                borderRadius: "30px",
                                paddingLeft: "12px",
                                paddingRight: "12px",
                              }}
                              className={`flex items-center justify-between ${calendarBg} flex-1 min-w-[90px] h-10 md:h-12`}
                            >
                              <span
                                className={`text-sm font-semibold ${theme.text}`}
                              >
                                {fullMonths[currentDate.getMonth()]}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 ${theme.text}`}
                              />
                            </button>
                            {showMonthSelector && (
                              <div className="absolute z-20 mt-2 right-0">
                                <MonthSelector
                                  currentMonth={currentDate.getMonth()}
                                  onSelectMonth={(m) => {
                                    handleSelectMonth(m);
                                    setShowMonthSelector(false);
                                  }}
                                  onClose={() => setShowMonthSelector(false)}
                                  isDark={isDark}
                                  theme={theme}
                                />
                              </div>
                            )}
                          </div>

                          {/* Year Selector */}
                          <div className="relative">
                            <button
                              onClick={() => {
                                setShowYearSelector(!showYearSelector);
                                setShowMonthSelector(false);
                              }}
                              style={{
                                boxShadow: controlShadow,
                                borderRadius: "30px",
                                paddingLeft: "12px",
                                paddingRight: "12px",
                              }}
                              className={`flex items-center justify-between ${calendarBg} flex-1 min-w-[80px] h-10 md:h-12`}
                            >
                              <span
                                className={`text-sm font-semibold ${theme.text}`}
                              >
                                {currentDate.getFullYear()}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 ${theme.text}`}
                              />
                            </button>
                            {showYearSelector && (
                              <div className="absolute z-20 mt-2 right-0">
                                <YearSelector
                                  currentYear={currentDate.getFullYear()}
                                  onSelectYear={(y) => {
                                    handleSelectYear(y);
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
                      <div
                        className={`grid grid-cols-7 gap-1 text-center rounded-3xl p-2 mb-2 mr-6 md:mr-0 ${isDark ? theme.bg : "bg-white"}`}
                      >
                        {calendarDays.map((day, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col items-center justify-center p-0.5 transition-all duration-300 ${day.active ? "text-white" : ""
                              }`}
                            style={
                              day.active
                                ? {
                                  backgroundColor: "#5E5CE6",
                                  borderRadius: "9999px",
                                  marginTop: "-2px",
                                  marginBottom: "-2px",
                                  zIndex: 10,
                                  height: "auto",
                                  minHeight: "50px",
                                  width: "100%",
                                  maxWidth: "36px",
                                  marginLeft: "auto",
                                  marginRight: "auto",
                                }
                                : {
                                  height: "auto",
                                  minHeight: "40px",
                                  width: "100%",
                                  maxWidth: "36px",
                                  marginLeft: "auto",
                                  marginRight: "auto",
                                }
                            }
                          >
                            <span className="text-[9px] uppercase mb-1 opacity-80">
                              {day.day}
                            </span>
                            <span className="text-sm md:text-base font-bold">
                              {day.date}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-6">
                        <div className="text-sm">
                          <span className={`opacity-50`}>Common growth</span>{" "}
                          14% from last day
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-sm font-bold text-black">
                          64%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add-on Events */}
                {/* Add-on Events */}
                <div className="flex-1">
                  <div
                    className={`py-8 px-6 rounded-3xl ${theme.cardBgDarker} flex flex-col h-full`}
                    style={{ ...cardStyle, borderRadius: "36px" }}
                  >
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                      Add-On Events
                    </h3>
                    <div className="flex items-center justify-between flex-1 px-4">
                      <button className={`${theme.subText}`}>
                        <ChevronLeft />
                      </button>
                      <div
                        className="flex gap-4 overflow-x-auto py-4 scrollbar-hide"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        {addOnEvents.length > 0 ? (
                          addOnEvents.map((event, idx) => {
                            // Style logic adapted from ConfirmEventView
                            const baseStyle = {
                              borderRadius: "25.33px",
                              transition:
                                "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                            };
                            const shadowDimensions =
                              "6.75px 6.75px 10.13px 0px";

                            // Using "inactive" style as base but with 100% opacity for better visibility in a list
                            // or closely mimicking the "active" style for all since they are just items.
                            // Let's use a style in between: fully visible but using theme colors.

                            const cardStyle = {
                              ...baseStyle,
                              background: isDark ? "#212426" : "#E0E0E0",
                              border: isDark
                                ? "0.84px solid #33373A"
                                : "0.84px solid #D0D0D0",
                              boxShadow: isDark
                                ? `${shadowDimensions} #00000015,-${shadowDimensions} #FFFFFF06`
                                : `${shadowDimensions} #A0A0A040,-${shadowDimensions} #FFFFFF`,
                            };

                            return (
                              <div
                                key={event.id || idx}
                                className={`flex-shrink-0 lg:w-24 lg:h-36 w-20 h-28 p-2 rounded-xl transition-all duration-300 transform-gpu cursor-pointer hover:scale-105`}
                                style={cardStyle}
                                onClick={() => {
                                  // Handle click if needed
                                }}
                              >
                                <div className="flex flex-col items-center justify-between h-full">
                                  <div className="lg:w-10 lg:h-10 h-8 w-8 mt-4 rounded-full overflow-hidden flex items-center justify-center bg-white">
                                    {event.banner ? (
                                      <img
                                        src={event.banner}
                                        alt={event.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Ticket className="w-5 h-5 text-black" />
                                    )}
                                  </div>
                                  <div
                                    className={`lg:text-xs text-[10px] font-bold ${isDark ? "text-white" : "text-gray-900"
                                      } text-center leading-tight mt-2`}
                                  >
                                    {event.name}
                                  </div>
                                  <p
                                    className={`text-[10px] text-center ${isDark ? "text-gray-400" : "text-gray-500"
                                      } leading-none truncate w-full px-1 mb-1`}
                                  >
                                    {formattedDate}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className={`${theme.subText} text-center py-4`}>
                            No add-on events available
                          </p>
                        )}
                      </div>
                      <button className={`${theme.subText}`}>
                        <ChevronRight />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <FooterButton
                theme={theme}
                icon={<Users />}
                text="Guests details"
              />
              <FooterButton
                theme={theme}
                icon={<MapPin />}
                text="Event location"
              />
              <FooterButton
                theme={theme}
                icon={<Landmark />}
                text="Bank account details of add-on events"
              />
              <FooterButton
                theme={theme}
                icon={<Download />}
                text="Download daily revenue report"
              />
            </div>
          </main>
          {/* --- End of Main Content Area --- */}

          <BottomNavigation theme={theme} user={user} />
        </div >
      </div >
      {/* <-- This closing div was missing */}
    </>
  );
};

// --- Sub-Components for this page ---

const getButtonNeumorphicShadows = (isDark) =>
  isDark
    ? "shadow-[inset_2px_2px_5px_#1a1b1e,inset_-2px_-2px_5px_#3c3f44]"
    : "shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.1),inset_2px_2px_5px_rgba(255,255,255,1)]";

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
      className={`${theme.cardBg} rounded-xl ${getButtonNeumorphicShadows(
        isDark,
      )} p-1 flex flex-col gap-1 w-24 shadow-lg`}
      style={style}
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
      className={`${theme.cardBg} rounded-xl ${getButtonNeumorphicShadows(
        isDark,
      )} p-1 flex flex-col gap-1 w-24 shadow-lg max-h-[13.5rem] overflow-y-auto`}
      style={style}
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

const StatCard = ({ theme, shadow, icon, title, value, color = "" }) => {
  return (
    <div className={`p-6 rounded-3xl ${theme.cardBgDarker}`} style={shadow}>
      <div className="flex justify-between items-center mb-2">
        <span className={`text-xs uppercase font-semibold ${theme.subText}`}>
          {title}
        </span>
        <span className={`text-lg ${color || theme.text}`}>{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${color || theme.text}`}>{value}</div>
    </div>
  );
};

const FooterButton = ({ theme, icon, text }) => (
  <button
    className={`flex items-center justify-center text-center gap-3 p-4 rounded-full text-white font-medium text-sm hover:opacity-90 transition-opacity`}
    style={{
      background: "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)",
    }}
  >
    {icon}
    <span>{text}</span>
  </button>
);
export default LiveEventsPage;
