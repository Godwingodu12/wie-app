// src/pages/LiveEventsPage/LiveEventsPage.jsx
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import ThemeToggle from "../../components/HomePage/ThemeToggle";
import SearchBar from "../../components/HomePage/SearchBar";
import SideBar from "../../components/HomePage/SideBar";
import BottomNavigation from "../../components/HomePage/BottomNavigation";
import WieLogo from "../../assets/HomePage/WieLogo.svg?url";
import { toast } from "react-hot-toast";
import { getMyLiveEventView, getGroupView } from "../../services/ticketService";
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
} from "lucide-react";

const HEADER_HEIGHT = 72; // From HomePage

// Main Component
const LiveEventsPage = () => {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const { ticketId } = useParams();
    const [isDark, setIsDark] = useState(true);
    const [searchValue, setSearchValue] = useState("");
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

        console.log("Fetching live event data for ticketId:", ticketId);

        // Fetch ticket data
        const ticketResponse = await getMyLiveEventView(ticketId);
        console.log("Live Event Response:", ticketResponse);

        // Extract event data - API returns { message, ticket }
        const data = ticketResponse?.ticket;

        if (!data) {
            throw new Error("No event data received from server");
        }

        if (!data.event_name) {
            throw new Error("Invalid event data structure");
        }
        console.log("Live Event Data:", data);
        setEventData(data);
        // Fetch group data if groupId exists
        if (data.groupId) {
            try {
            const groupResponse = await getGroupView(ticketId);
            console.log("Group Response:", groupResponse);
            const fetchedGroupData = groupResponse?.data?.group || groupResponse?.group || groupResponse?.data || groupResponse;
            setGroupData(fetchedGroupData);
            setGroupName(fetchedGroupData.name || "Unknown Group");
            } catch (groupErr) {
            console.warn("Failed to fetch group data:", groupErr);
            // Continue without group data
            }
        }

        } catch (err) {
        console.error("Failed to fetch live event data:", err);
        const errorMessage = err?.response?.data?.message || err.message || "Failed to load event details.";
        toast.error(errorMessage);
        setError(errorMessage);
        } finally {
        setLoading(false);
        }
    };

    fetchEventData();
    }, [ticketId]);

    // Computed values from API data
    const computedEventData = eventData ? {
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
    } : null;
      // Theme setup from HomePage
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
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
    if (!eventData?.event_dates?.length) {
        // Fallback to current week if no event dates
        const today = new Date();
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);

        const days = [];
        for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        days.push({
            day: date.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase(),
            date: date.getDate().toString(),
            active: date.toDateString() === today.toDateString(),
        });
        }
        return days;
    }

    // Use event dates from API
    const eventDate = new Date(eventData.event_dates[0].start_date);
    const dayOfWeek = eventDate.getDay();
    const startOfWeek = new Date(eventDate);
    startOfWeek.setDate(eventDate.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        days.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase(),
        date: date.getDate().toString(),
        active: date.toDateString() === eventDate.toDateString(),
        });
    }
    return days;
    };
    const calendarDays = generateCalendarDays();
    const addOnEvents = eventData?.sub_events?.map(subEvent => ({
    name: subEvent.event_name,
    id: subEvent._id,
    category: subEvent.event_category,
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
// Loading State
if (loading) {
  return (
    <div className={`${theme.bg} ${theme.text} min-h-screen flex items-center justify-center`}>
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
    <div className={`${theme.bg} min-h-screen flex flex-col items-center justify-center text-xl text-red-400 p-8`}>
      <div className="text-center space-y-4">
        <p className="text-2xl font-bold">Error Loading Event</p>
        <p className="text-lg">{error || `Event with ID "${ticketId}" not found.`}</p>
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
  return (
    <>
      <style>{`
        /* Main page scrollbar (using HomePage style) */
        body::-webkit-scrollbar,
        html::-webkit-scrollbar,
        .overflow-y-auto::-webkit-scrollbar { width: 8px; }
        body::-webkit-scrollbar-track,
        html::-webkit-scrollbar-track,
        .overflow-y-auto::-webkit-scrollbar-track { background: ${
          isDark ? "#1f2937" : "#f1f1f1"
        }; }
        body::-webkit-scrollbar-thumb,
        html::-webkit-scrollbar-thumb,
        .overflow-y-auto::-webkit-scrollbar-thumb { background: ${
          isDark ? "#4b5563" : "#cbd5e1"
        }; border-radius: 10px; }
        body::-webkit-scrollbar-thumb:hover,
        html::-webkit-scrollbar-thumb:hover,
        .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: ${
          isDark ? "#6b7280" : "#94a3b8"
        }; }
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
                  onTuneClick={() => {}}
                />
              </div>
              <div className="relative">
                <div
                  style={neumorphShadow}
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${theme.bg}`}
                >
                  <Bell
                    className={`w-4 h-4 ${
                      isDark
                        ? "filter brightness-0 invert"
                        : "filter brightness-0"
                    }`}
                  />
                </div>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  12
                </span>
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
                      <span className={`${theme.text}`}>
                        {groupName}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter Pills (Right) */}
              <div className="flex items-center gap-3 flex-wrap pb-2 lg:pb-0 mt-4 lg:mt-0">
                {["All", "Day", "Week", "Month"].map((filter, idx) => (
                  <button
                    key={filter}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                      filter === "Week" ? theme.activePill : theme.inactivePill
                    }`}
                  >
                    {filter}
                  </button>
                ))}
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
                  <div className={`text-base ${theme.subText}`}>
                    (JAN-AUG) Months
                  </div>
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
                <div className="flex flex-col md:flex-row gap-8">
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
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center ${theme.bg}`}
                      >
                        <Armchair />
                      </button>
                      <span className="text-xs font-medium">
                        Seating layout
                      </span>
                    </div>
                  </div>

                  {/* Calendar */}
                  <div className="flex-1">
                    <div
                      className={`py-6 px-4 sm:py-10 sm:px-8 rounded-3xl ${theme.cardBgDarker}`}
                      style={{ ...cardStyle, borderRadius: "36px" }}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <button className={`${theme.subText}`}>&lt;</button>
                        <div className="font-semibold text-lg">
                          September 2025
                        </div>
                        <button className={`${theme.subText}`}>&gt;</button>
                      </div>
                      <div className="grid grid-cols-7 gap-2 text-center">
                        {calendarDays.map((day, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col items-center p-1 sm:p-2 md:p-3 rounded-lg ${
                              day.active ? "bg-blue-600 text-white" : ""
                            }`}
                          >
                            <span className="text-xs sm:text-sm uppercase mb-1">
                              {day.day}
                            </span>
                            <span className="text-base sm:text-lg md:text-2xl font-bold">
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
                <div className="mt-8">
                  <div
                    className={`py-8 px-6 rounded-3xl ${theme.cardBgDarker} flex flex-col flex-1`}
                    style={{ ...cardStyle, borderRadius: "36px" }}
                  >
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                      Add-On Events
                    </h3>
                    <div className="flex items-center justify-between flex-1 px-4">
                      <button className={`${theme.subText}`}>&lt;</button>
                    <div className="flex gap-6 overflow-x-auto">
                    {addOnEvents.length > 0 ? (
                        addOnEvents.map((event, idx) => (
                        <div
                            key={event.id || idx}
                            className="flex flex-col items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => {
                            // Navigate to sub-event details if needed
                            console.log("Sub-event clicked:", event.name);
                            }}
                        >
                            <div
                            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center ${
                                idx === 2 ? theme.purpleBtn : theme.bg
                            }`}
                            >
                            <Ticket className={`w-6 h-6 sm:w-8 sm:h-8 ${idx === 2 ? 'text-white' : theme.text}`} />
                            </div>
                            <span className="text-xs text-center">{event.name}</span>
                        </div>
                        ))
                    ) : (
                        <p className={`${theme.subText} text-center py-4`}>No add-on events available</p>
                    )}
                    </div>
                      <button className={`${theme.subText}`}>&gt;</button>
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
        </div>
      </div>
      {/* <-- This closing div was missing */}
    </>
  );
};

// --- Sub-Components for this page ---

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
    style={{ background: 'linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)' }}
  >
    {icon}
    <span>{text}</span>
  </button>
);
export default LiveEventsPage;
