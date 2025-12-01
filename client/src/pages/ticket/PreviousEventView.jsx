import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMe } from "../../services/userService";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import BottomNavigation from "../../components/HomePage/BottomNavigation.jsx";
import {
  getMyPreviousEventView,
  getGroupView,
} from "../../services/ticketService";
import { getImageUrl } from "../../utils/imageUtils";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import BackArrowIcon from "../../assets/PreviousEventView/BackArrowIcon.svg";
import CalenderIcon from "../../assets/PreviousEventView/CalenderIcon.svg";
import DownloadIcon from "../../assets/PreviousEventView/DownloadIcon.svg";
import EarningIcon from "../../assets/PreviousEventView/EarningIcon.svg";
import LikeIcon from "../../assets/PreviousEventView/LikeIcon.svg";
import MapIcon from "../../assets/PreviousEventView/MapIcon.svg";
import PublicIcon from "../../assets/PreviousEventView/PublicIcon.svg";
import ShareIcon from "../../assets/PreviousEventView/ShareIcon.svg";
import TagIcon from "../../assets/PreviousEventView/TagIcon.svg";
import ViewIcon from "../../assets/PreviousEventView/ViewIcon.svg";
import SeatIcon from "../../assets/PreviousEventView/SeatIcon.svg";
import TicketIcon from "../../assets/PreviousEventView/TicketIcon.svg";
import CancelIcon from "../../assets/PreviousEventView/CancelIcon.svg";
import BoxIcon from "../../assets/PreviousEventView/BoxIcon.svg";
import LiveEventIcon from "../../assets/PreviousEventView/LiveEventIcon.svg";
import BankIcon from "../../assets/PreviousEventView/BankIcon.svg";
import ChatIcon from "../../assets/PreviousEventView/ChatIcon.svg";
import NotificationIcon from "../../assets/PreviousEventView/NotificationIcon.svg";

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

    /* Custom scrollbar for quarters section */
    .scrollbar-thin {
      scrollbar-width: thin;
      scrollbar-color: #4b5563 transparent;
    }

    .scrollbar-thin::-webkit-scrollbar {
      width: 6px;
      display: block;
    }

    .scrollbar-thin::-webkit-scrollbar-track {
      background: transparent;
    }

    .scrollbar-thin::-webkit-scrollbar-thumb {
      background-color: #4b5563;
      border-radius: 3px;
    }

    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
      background-color: #6b7280;
    }

    /* hide scrollbar for overflow-x containers where we want to allow touch scroll only */
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    @media (min-width: 1024px) and (max-width: 1024px) and (min-height: 600px) and (max-height: 600px) {
      html {
        font-size: 12px;
      }
    }

    @media (min-width: 1280px) and (max-width: 1280px) and (min-height: 800px) and (max-height: 800px) {
      html {
        font-size: 14px;
      }
    }

    @media (min-width: 768px) and (max-width: 1023px) {
      html {
        font-size: 13px;
      }
    }

    @media (min-width: 1440px) {
      html {
        font-size: 16px;
      }
    }
  `}</style>
);

const PreviousEventView = () => {
  const { ticketId } = useParams(); // Note: Change from ticketId to ticketId if needed
  const { user } = useSelector((state) => state.auth);
  const [eventData, setEventData] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");

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
  useEffect(() => {
    const fetchAndSetData = async () => {
      if (!ticketId) {
        // or ticketId depending on your route parameter
        setError("Event ID not found in URL parameters.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("Fetching previous event data for ticketId:", ticketId);

        // Fetch ticket data
        const ticketResponse = await getMyPreviousEventView(ticketId);
        console.log("Ticket Response:", ticketResponse);

        // Extract event data - API returns { message, ticket }
        const data = ticketResponse?.ticket;

        if (!data) {
          throw new Error("No ticket data received from server");
        }

        if (!data.event_name) {
          throw new Error("Invalid ticket data structure");
        }

        console.log("Event Data:", data);
        setEventData(data);

        // Fetch group data if groupId exists
        if (data.groupId) {
          try {
            const groupResponse = await getGroupView(data.groupId);
            console.log("Group Response:", groupResponse);

            const fetchedGroupData =
              groupResponse?.data?.group ||
              groupResponse?.group ||
              groupResponse?.data ||
              groupResponse;
            setGroupData(fetchedGroupData);
          } catch (groupErr) {
            console.warn("Failed to fetch group data:", groupErr);
            // Continue without group data
          }
        }
      } catch (err) {
        console.error("Failed to fetch event data:", err);
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

    fetchAndSetData();
  }, [ticketId]);

  const theme = isDark
    ? {
        bg: "bg-[#212426]",
        text: "text-white",
        subText: "text-[#c9c9cf]",
        cardBg: "bg-[#212426]",
        innerCardBg: "bg-[#24272d]",
        border: "border-gray-700/30",
        cardShadow: "-2px -2px 10px 0px #63636336,5px 6px 9px 0px #00000075",
        smallCardShadow: "-2px -2px 10px 0px #63636336,5px 6px 9px 0px #00000075",
        insetShadow: "inset 0 4px 12px rgba(0,0,0,0.5)",
        buttonShadow:
          "inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)",
      }
    : {
        bg: "bg-[#f9f9f9]",
        text: "text-gray-900",
        subText: "text-gray-600",
        cardBg: "bg-[#ffffff]",
        innerCardBg: "bg-[#f1f1f1]",
        border: "border-gray-300",
        cardShadow:
          "-2px -2px 10px 0px #63636336, 5px 6px 9px 0px #00000075",
        smallCardShadow: "6px 6px 12px #6a6a6a,-6px -6px 12px #ffffff",
        insetShadow: "-2px -2px 10px 0px #63636336 inset,5px 6px 9px 0px #00000075 inset",
        buttonShadow:
          "inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)",
      };

  const chartData = [
    { month: "JAN", value: "320k", percentage: 55 },
    { month: "FEB", value: "320k", percentage: 75 },
    { month: "MAR", value: "320k", percentage: 65 },
    { month: "APR", value: "320k", percentage: 45 },
    { month: "MAY", value: "320k", percentage: 85 },
    { month: "JUN", value: "320k", percentage: 70 },
    { month: "JUL", value: "320k", percentage: 80 },
    { month: "AUG", value: "320k", percentage: 95 },
  ];

  const quarters = [
    {
      period: "January - August",
      bookings: "6552",
      earnings: "645721",
      percentage: 54,
    },
    {
      period: "August - October",
      bookings: "6552",
      earnings: "645721",
      percentage: 54,
    },
    {
      period: "October - December",
      bookings: "6552",
      earnings: "645721",
      percentage: 54,
    },
  ];

  const addOnEvents = [
    { name: "Cricket", icon: "🏏" },
    { name: "Drama", icon: "🎭" },
    { name: "Music", icon: "🎵" },
  ];

  const [activeIndex, setActiveIndex] = useState(
    Math.floor(addOnEvents.length / 2 || 1)
  );

  const prevAddOn = () =>
    setActiveIndex((i) => (i - 1 + addOnEvents.length) % addOnEvents.length);
  const nextAddOn = () => setActiveIndex((i) => (i + 1) % addOnEvents.length);
  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center text-xl ${theme.text}`}
        style={{ backgroundColor: theme.bg.replace("bg-", "") }}
      >
        Loading Previous Event Data...
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center text-xl text-red-400 p-8`}
        style={{ backgroundColor: theme.bg.replace("bg-", "") }}
      >
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold">Error Loading Event</p>
          <p className="text-lg">
            {error || `Event with ID "${ticketId}" not found.`}
          </p>
          <div className="text-sm text-gray-400 mt-4">
            <p>Event ID: {ticketId}</p>
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
      <CustomScrollbarStyles />
      <div
        className={`${theme.bg} min-h-screen flex flex-col text-sm transition-colors duration-300`}
      >
        {/* Header */}
        <header
          className={`flex items-center justify-between px-3 md:px-6 border-b ${theme.border}`}
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="flex items-center gap-2 md:gap-4 w-full">
            <div className="flex items-center gap-2 md:gap-4 flex-1">
              <img
                src={WieLogo}
                alt="Wie Logo"
                className="w-8 h-8 md:w-10 md:h-10"
              />
              {/* Desktop search stays in header (hidden on mobile) */}
              <div className="hidden md:flex flex-1 min-w-0">
                <SearchBar
                  theme={theme}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
            </div>
            {/* Desktop: Theme toggle */}
            <div className="hidden md:flex">
              <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
            </div>

            <div className="flex md:hidden items-center gap-3">
              <button
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95"
                style={{
                  backgroundColor: isDark ? "#212426" : "#FFFFFF",
                  boxShadow: isDark
                    ? "inset -2px -2px 5px rgba(255,255,255,0.05), inset 2px 2px 5px rgba(0,0,0,0.6)"
                    : "inset -2px -2px 5px rgba(255,255,255,0.9), inset 2px 2px 5px rgba(0,0,0,0.2)",
                }}
                aria-label="Notifications"
              >
                <img
                  src={NotificationIcon}
                  alt="Notification"
                  className="w-5 h-5"
                  style={{ filter: isDark ? "invert(0)" : "invert(1)" }}
                />
              </button>

              <button
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95"
                style={{
                  backgroundColor: isDark ? "#212426" : "#FFFFFF",
                  boxShadow: isDark
                    ? "inset -2px -2px 5px rgba(255,255,255,0.05), inset 2px 2px 5px rgba(0,0,0,0.6)"
                    : "inset -2px -2px 5px rgba(255,255,255,0.9), inset 2px 2px 5px rgba(0,0,0,0.2)",
                }}
                aria-label="Chat"
              >
                <img
                  src={ChatIcon}
                  alt="Chat"
                  className="w-5 h-5"
                  style={{ filter: isDark ? "invert(0)" : "invert(1)" }}
                />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 md:p-6 lg:p-10 overflow-y-auto pb-20 md:pb-6">
          <div className="max-w-[1400px] mx-auto">
            {/* Top row with back + title */}
            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-6">
              <button
                onClick={() => navigate(-1)}
                className="hidden md:flex w-10 h-10 md:w-12 md:h-12 bg-[linear-gradient(180.23deg,_#1E1242_-0.04%,_#6549B8_99.57%)] rounded-full items-center justify-center hover:scale-105 transition"
                aria-label="back"
              >
                <img
                  src={BackArrowIcon}
                  alt="Back"
                  className="w-5 h-5 md:w-6 md:h-6"
                />
              </button>

              {/* Desktop title (unchanged) */}
              <h1
                className={`text-xl md:text-2xl lg:text-3xl font-bold ${theme.text}`}
              >
                Previous Event
              </h1>
            </div>

            {/* MOBILE: Search bar under the top row */}
            <div className="md:hidden mb-4">
              <SearchBar
                theme={theme}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>

            <div
              className={`rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-10`}
              style={{
                backgroundColor: theme.cardBg.replace("bg-", ""),
                boxShadow: theme.cardShadow,
              }}
            >
              {/* Event category row (desktop: above, mobile: we'll show mobile-specific below) */}
              <div className="hidden md:flex items-center justify-start gap-2 md:gap-4 mb-3">
                <span
                  className={`uppercase text-xs font-semibold tracking-widest ${theme.subText}`}
                >
                  {eventData.event_category?.toUpperCase()}
                </span>
                <span className={theme.subText}>|</span>
                <span
                  className={`uppercase text-xs font-semibold tracking-widest ${theme.subText}`}
                >
                  {eventData.event_subcategory?.toUpperCase()}
                </span>
              </div>

              {/* Main event header */}
              <div className="relative mb-6 md:mb-8">
                {/* MOBILE: Title, subheading + public, center image, then pill-like location/date stacked */}
                <div className="md:hidden flex flex-col items-center gap-3">
                  <h2
                    className={`text-xl font-extrabold tracking-wider text-center ${theme.text}`}
                  >
                    {eventData.event_name?.toUpperCase() || "EVENT NAME"}
                  </h2>
                  {/* subheading + public in one line */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`uppercase text-xs font-semibold tracking-widest ${theme.subText}`}
                    >
                      {eventData.event_category?.toUpperCase()}
                    </span>
                    <span
                      className={`uppercase text-xs font-semibold tracking-widest ${theme.subText}`}
                    >
                      {eventData.event_subcategory?.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2 ml-2">
                      <img src={PublicIcon} alt="Public" className="w-4 h-4" />
                      <span
                        className={`font-semibold text-sm md:text-lg ${theme.text}`}
                      >
                        {eventData.event_type === "private"
                          ? "Private"
                          : "Public"}
                      </span>
                    </div>
                  </div>
                  <div
                    className="rounded-full border-4 bg-black flex items-center justify-center"
                    style={{
                      width: "clamp(72px, 18vw, 100px)",
                      height: "clamp(72px, 18vw, 100px)",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
                    }}
                  >
                    <img
                      src={getImageUrl(eventData.event_logo)}
                      alt="event_logo"
                      style={{
                        width: "clamp(40px, 10vw, 56px)",
                        height: "clamp(40px, 10vw, 56px)",
                      }}
                    />
                  </div>

                  {/* Mobile pill-style location and date (stacked) */}
                  <div className="w-full flex flex-col items-center gap-3">
                    {/* Location pill */}
                    <div
                      className="relative rounded-full p-3 flex items-center justify-between w-[90%] max-w-[320px]"
                      style={{
                        background: isDark
                          ? "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))"
                          : "linear-gradient(180deg, rgba(0,0,0,0.03), rgba(0,0,0,0.01))",
                      }}
                    >
                      <div className="relative flex items-center gap-2 w-full">
                        {/* Floating circle logo (left) */}
                        <div
                          className="absolute -top-4 -left-3 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                          style={{
                            background:
                              "linear-gradient(180.23deg, #8b5cf6 0%, #6366f1 100%)",
                          }}
                        >
                          <img src={MapIcon} alt="map" className="w-6 h-6" />
                        </div>

                        {/* Text content */}
                        <div className="pl-12 flex items-center gap-1 overflow-hidden">
                          <h3 className={`font-semibold text-sm ${theme.text}`}>
                            {eventData.venue || "Online/Recorded"}
                          </h3>
                          <span className={`text-xs ${theme.subText} truncate`}>
                            {eventData.location || "Address TBA"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Date pill (inline text + floating icon) */}
                    <div
                      className="relative rounded-full p-3 flex items-center justify-between w-[90%] max-w-[320px]"
                      style={{
                        background: isDark
                          ? "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))"
                          : "linear-gradient(180deg, rgba(0,0,0,0.03), rgba(0,0,0,0.01))",
                      }}
                    >
                      {/* Inline date text */}
                      <div className="flex items-center gap-1 pl-2">
                        <span className={`text-xs ${theme.subText}`}>
                          Event on :
                        </span>
                        <span className={`font-bold text-sm ${theme.text}`}>
                          {eventData.event_dates?.[0]?.start_date
                            ? new Date(
                                eventData.event_dates[0].start_date
                              ).toLocaleDateString("en-US", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                                timeZone: "UTC",
                              })
                            : "Date TBA"}
                        </span>
                      </div>
                      {/* Floating calendar icon (right) */}
                      <div
                        className="absolute  -right-3 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                        style={{
                          background:
                            "linear-gradient(180.23deg, #8b5cf6 0%, #6366f1 100%)",
                        }}
                      >
                        <img
                          src={CalenderIcon}
                          alt="calendar"
                          className="w-5 h-5"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop: Public badge (keeps original desktop look) */}
                <div className="absolute -top-4 md:-top-6 right-0 hidden md:flex items-center gap-2">
                  <img
                    src={PublicIcon}
                    className={`w-5 h-5 md:w-6 md:h-6 ${
                      !isDark ? "filter brightness-0" : ""
                    }`}
                    alt="Public"
                  />
                  <span
                    className={`font-semibold text-sm md:text-lg ${theme.text}`}
                  >
                    {eventData.event_type === "private" ? "Private" : "Public"}
                  </span>
                </div>
                {/* Desktop Title (keep for desktop only) */}
                <h2
                  className={`hidden md:block text-xl md:text-2xl lg:text-3xl font-extrabold tracking-wider mb-3 text-center pb-4 ${theme.text}`}
                >
                  {eventData.event_name?.toUpperCase() || "EVENT NAME"}
                </h2>
                {/* Event details bar - Desktop only (hidden on mobile because mobile has stacked pills) */}
                <div className="relative w-full">
                  <div className="mx-auto w-full md:w-[85%] lg:w-[80%]">
                    <div
                      className={`rounded-xl md:rounded-2xl px-4 md:px-8 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0 hidden md:flex`}
                      style={{
                        backgroundColor: theme.innerCardBg.replace("bg-", ""),
                        boxShadow: theme.insetShadow,
                        minHeight: "60px",
                      }}
                    >
                      {/* Location */}
                      <div className="flex items-center gap-2 md:gap-3 md:pl-[95px]">
                        <h3
                          className={`font-semibold text-sm md:text-base ${theme.text}`}
                        >
                          {eventData.venue || "Online/Recorded"}
                        </h3>
                        <span className={`text-xs md:text-sm ${theme.subText}`}>
                          {eventData.location || "Online/Recorded"}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 md:gap-3 md:pr-[95px]">
                        <img
                          src={CalenderIcon}
                          className={`w-4 h-4 md:w-5 md:h-5 ${
                            !isDark ? "filter brightness-0" : ""
                          }`}
                          alt="Calendar"
                        />
                        <span className={`font-bold text-sm ${theme.text}`}>
                          {eventData.event_dates?.[0]?.start_date
                            ? new Date(
                                eventData.event_dates[0].start_date
                              ).toLocaleDateString("en-US", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                                timeZone: "UTC",
                              })
                            : "Date TBA"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Floating icons - Desktop only */}
                  <div className="hidden lg:block">
                    {/* left floating */}
                    <div
                      className="absolute top-1/2 transform -translate-y-1/2 flex items-center justify-center rounded-full"
                      style={{
                        left: "calc(50% - 38% - 6rem)", // keeps it around the left side of center; tweak if needed
                        width: "clamp(56px, 8vw, 100px)",
                        height: "clamp(56px, 8vw, 100px)",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
                        zIndex: 20,
                        background:
                          "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)",
                      }}
                    >
                      <img
                        src={MapIcon}
                        alt="Map"
                        style={{
                          width: "clamp(36px, 6vw, 60px)",
                          height: "clamp(36px, 6vw, 60px)",
                        }}
                      />
                    </div>

                    {/* center floating */}
                    <div
                      className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ zIndex: 30 }}
                    >
                      <div
                        className="rounded-full border-4 bg-black flex items-center justify-center"
                        style={{
                          width: "clamp(64px, 12vw, 100px)",
                          height: "clamp(64px, 12vw, 100px)",
                          boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
                        }}
                      >
                        <img
                          src={getImageUrl(eventData.event_logo)}
                          alt="Event Logo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* right floating */}
                    <div
                      className="absolute top-1/2 transform -translate-y-1/2 flex items-center justify-center rounded-full"
                      style={{
                        right: "calc(50% - 38% - 6rem)",
                        width: "clamp(56px, 8vw, 100px)",
                        height: "clamp(56px, 8vw, 100px)",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
                        zIndex: 20,
                        background:
                          "linear-gradient(180.23deg, #1E1242 -0.04%, #6549B8 99.57%)",
                      }}
                    >
                      <img
                        src={CalenderIcon}
                        alt="Calendar"
                        style={{
                          width: "clamp(36px, 6vw, 50px)",
                          height: "clamp(36px, 6vw, 50px)",
                          filter: "brightness(0) invert(1)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats and chart grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 mb-6 md:mb-8">
                {/* Stats card */}
                <div
                  className={`rounded-2xl md:rounded-3xl px-4 md:px-6 lg:px-8 py-4 md:py-6`}
                  style={{
                    backgroundColor: theme.innerCardBg,
                    boxShadow: theme.smallCardShadow,
                  }}
                >
                  <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                    {/* BoxIcon: show only on large desktop to preserve original desktop UI and hide on mobile/ipad */}
                    <img
                      src={BoxIcon}
                      alt="Stats"
                      className={`hidden sm:block  lg:block w-5 h-5 md:w-6 md:h-6 transition duration-300 ${
                        isDark ? "invert" : "brightness-0"
                      }`}
                    />
                    <h3
                      className={`hidden sm:block text-lg md:text-xl lg:text-2xl font-bold tracking-wide ${theme.text}`}
                    >
                      {eventData.event_name}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6 w-full">
                    {[
                      {
                        title: "Total event earnings",
                        value: "645721",
                        accent: "text-emerald-400",
                        icon: EarningIcon,
                      },
                      {
                        title: "Total bookings",
                        value: "6552",
                        accent: "text-blue-400",
                        icon: TicketIcon,
                        isBlue: true,
                      },
                      {
                        title: "Total cancellation",
                        value: "24",
                        accent: "text-red-400",
                        icon: CancelIcon,
                      },
                      {
                        title: "People liked",
                        value: "7.2 K",
                        accent: "text-red-400",
                        icon: LikeIcon,
                      },
                      {
                        title: "People Shared",
                        value: "2.8 K",
                        accent: "text-blue-400",
                        icon: ShareIcon,
                        needsInvert: true,
                      },
                      {
                        title: "Tag Count",
                        value: "8.5 K",
                        accent: isDark ? "text-white" : "text-gray-900",
                        icon: TagIcon,
                        needsInvert: true,
                      },
                    ].map((st, i) => (
                      <div
                        key={i}
                        className={`relative rounded-2xl md:rounded-3xl p-3 md:p-4 lg:p-6 flex flex-col justify-between w-full h-full`}
                        style={{
                          backgroundColor: theme.innerCardBg.replace("bg-", ""),
                          boxShadow: theme.smallCardShadow,
                          minHeight: "90px",
                        }}
                      >
                        <img
                          src={st.icon}
                          alt=""
                          className={`w-4 h-4 md:w-5 md:h-5 absolute top-3 md:top-6 right-2 md:right-3 ${
                            st.isBlue
                              ? ""
                              : st.needsInvert && !isDark
                              ? "filter brightness-0"
                              : "opacity-80"
                          }`}
                          style={
                            st.isBlue
                              ? {
                                  filter:
                                    "invert(41%) sepia(93%) saturate(7491%) hue-rotate(205deg) brightness(100%) contrast(105%)",
                                }
                              : {}
                          }
                        />

                        <div className="mb-1 pr-6 md:pr-8">
                          <span
                            className={`text-xs md:text-sm leading-tight block ${theme.subText}`}
                          >
                            {st.title}
                          </span>
                        </div>

                        <div className="flex items-end justify-between pt-1 md:pt-2 pb-1 md:pb-2">
                          <div
                            className={`text-xl md:text-2xl lg:text-[2.3rem] font-extrabold ${st.accent}`}
                          >
                            {st.title === "Total event earnings"
                              ? eventData.total_earnings || "0"
                              : st.title === "Total bookings"
                              ? eventData.total_bookings || "0"
                              : st.title === "Total cancellation"
                              ? eventData.total_cancellations || "0"
                              : st.title === "People liked"
                              ? eventData.like || "0"
                              : st.title === "People Shared"
                              ? eventData.share_count || "0"
                              : st.title === "Tag Count"
                              ? eventData.hashtag?.length || "0"
                              : st.value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart card */}
                <div
                  className={`rounded-2xl md:rounded-3xl px-4 md:px-6 lg:px-8 py-4 md:py-6 flex flex-col`}
                  style={{
                    backgroundColor: theme.innerCardBg,
                    boxShadow: theme.smallCardShadow,
                  }}
                >
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="flex items-center gap-2 md:gap-3">
                      <img
                        src={LiveEventIcon}
                        alt="Live Events"
                        className="w-4 h-4 md:w-6 md:h-6"
                      />
                      <h3
                        className={`text-xs md:text-lg font-bold tracking-wide ${theme.text}`}
                      >
                        LIVE EVENTS EARNING STATISTICS
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 text-emerald-400 text-xs md:text-sm font-semibold">
                      <span>↗</span>
                      <span>14%</span>
                    </div>
                  </div>

                  <div className="mb-3 md:mb-4">
                    <span className={`text-xs md:text-sm ${theme.subText}`}>
                      Bellie Ellish Concert
                    </span>
                    <div className="flex items-end gap-2 md:gap-4 mt-2">
                      <span
                        className={`text-2xl md:text-3xl font-bold leading-none ${theme.text}`}
                      >
                        66,672.61
                      </span>
                      <span className={`text-xs self-end ${theme.subText}`}>
                        Total amount
                      </span>
                    </div>
                  </div>

                  {/* Pill chart */}
                  <div className="flex items-end justify-between gap-2 md:gap-4 mt-3 md:mt-4">
                    {chartData.map((d, i) => {
                      const baseHeight = 120;
                      const heightPx = Math.max(
                        18,
                        Math.round((d.percentage / 100) * baseHeight)
                      );

                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center"
                        >
                          <span
                            className={`text-[10px] md:text-xs mb-1 md:mb-2 ${theme.subText}`}
                          >
                            {d.value}
                          </span>

                          <div
                            className="relative flex items-end justify-center"
                            style={{ height: baseHeight }}
                          >
                            <div
                              className="w-6 md:w-10 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-md"
                              style={{
                                height: `${heightPx}px`,
                                transition: "height 400ms ease",
                                boxShadow: "inset 0 -6px 18px rgba(0,0,0,0.12)",
                              }}
                            />
                          </div>

                          <div
                            className={`text-[10px] md:text-xs font-medium mt-2 md:mt-3 ${theme.subText}`}
                          >
                            {d.month}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Add-on section */}
              {/* Mobile / iPad specific layout: md:hidden -> show compact company + add-on in one line, then actions row below */}
              <div className="md:hidden mb-6 px-2">
                <div className="flex items-center gap-2 w-full overflow-hidden">
                  {/* compact company */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center">
                      <img
                        src={getImageUrl(eventData.event_banner)}
                        alt="company"
                        className="w-6 h-6 sm:w-8 sm:h-8"
                      />
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs mt-1 ${theme.text}`}
                    >
                      Company
                    </span>
                  </div>

                  {/* add-on icons inline with horizontal scroll if needed */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-xl flex items-center gap-1.5 sm:gap-2 ${
                        theme.innerCardBg ?? ""
                      }`}
                      style={{ boxShadow: theme.smallCardShadow }}
                    >
                      <span
                        className={`text-xs sm:text-sm font-bold whitespace-nowrap flex-shrink-0 ${theme.text}`}
                      >
                        Add on events
                      </span>

                      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar flex-1 min-w-0 py-1">
                        {addOnEvents.map((event, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            className={`inline-flex items-center justify-center rounded-full w-8 h-8 sm:w-10 sm:h-10 text-base sm:text-lg ${
                              activeIndex === idx
                                ? "ring-2 ring-pink-300/60"
                                : ""
                            } flex-shrink-0`}
                            style={{ background: "#fa62b7", color: "#fff" }}
                            aria-label={eventData.name}
                          >
                            {event.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* actions in next line: try to keep all three visible on mobile and iPad; allow horizontal scroll on very narrow */}
                <div className="mt-3 sm:mt-4">
                  <div className="flex items-center justify-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar px-2">
                    {[
                      { icon: ViewIcon, label: "View" },
                      { icon: SeatIcon, label: "Seat layout" },
                      { icon: TicketIcon, label: "Ticket info" },
                    ].map((action, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center flex-shrink-0 w-16 sm:w-20"
                      >
                        <button
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                          style={{
                            background:
                              "linear-gradient(180.23deg,#1E1242 0%,#6549B8 100%)",
                          }}
                          aria-label={action.label}
                        >
                          <img
                            src={action.icon}
                            alt={action.label}
                            className="w-5 h-5 sm:w-6 sm:h-6"
                          />
                        </button>
                        <span
                          className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 text-center ${theme.text}`}
                        >
                          {action.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop / md+ original layout (unchanged) */}
              <div className="hidden md:flex flex-row md:flex-row items-center justify-between gap-4 md:gap-5 mb-6 md:mb-10">
                {/* Company */}
                <div
                  className={`rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col items-center min-w-[160px] md:min-w-[220px]`}
                >
                  <div className="w-20 h-20 md:w-[92px] md:h-[92px] bg-white rounded-full flex items-center justify-center mb-2">
                    <img
                      src={getImageUrl(eventData.event_banner)}
                      alt="company"
                      className="w-14 h-14 md:w-16 md:h-16"
                    />
                  </div>
                  <span
                    className={`text-sm md:text-base font-semibold ${theme.text}`}
                  >
                    Company
                  </span>
                </div>

                {/* Add on Events */}
                <div
                  className={`w-full md:w-[50%] rounded-2xl md:rounded-3xl p-3 md:p-4 shadow-xl flex flex-col items-center ${
                    theme.innerCardBg ?? ""
                  }`}
                  style={{ boxShadow: theme.smallCardShadow }}
                >
                  <div className="flex items-center w-full justify-center relative">
                    <span
                      className={`text-base md:text-lg font-bold mr-4 md:mr-6 pl-4 md:pl-6 ${theme.text}`}
                    >
                      Add on events
                    </span>

                    <button
                      onClick={prevAddOn}
                      className="w-7 h-7 md:w-8 md:h-8 bg-[#B5B5B5] rounded-full flex items-center justify-center mr-1 z-30"
                      aria-label="previous"
                    >
                      <svg
                        className="w-3 h-3 md:w-4 md:h-4 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={4}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    <div
                      className="relative flex-1 flex items-center justify-center"
                      style={{ minHeight: 80 }}
                    >
                      <div className="flex items-center gap-4 md:gap-8 justify-center">
                        {addOnEvents?.map((event, idx) => {
                          const isActive = idx === activeIndex;
                          return (
                            <div
                              key={idx}
                              onClick={() => setActiveIndex(idx)}
                              className="flex flex-col items-center justify-center transition-all duration-200 cursor-pointer"
                              style={{
                                transform: isActive
                                  ? "scale(1.03) translateY(-2px)"
                                  : "scale(1)",
                                opacity: isActive ? 1 : 0.9,
                              }}
                            >
                              <div
                                className={`flex items-center justify-center rounded-full bg-[#fa62b7] text-white shadow-md w-12 h-12 md:w-16 md:h-16 text-xl md:text-2xl transition-all duration-200 ${
                                  isActive ? "ring-2 ring-pink-300/60" : ""
                                }`}
                              >
                                {event.icon}
                              </div>
                            </div>
                          );
                        }) ?? null}
                      </div>

                      <div
                        className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
                        style={{ bottom: -18 }}
                      >
                        {addOnEvents?.map((_, idx) => {
                          const isActive = idx === activeIndex;
                          return (
                            <button
                              key={idx}
                              onClick={() => setActiveIndex(idx)}
                              className={`rounded-full transition-all duration-200 ${
                                isActive ? "w-3 h-3" : "w-2 h-2"
                              }`}
                              style={{
                                backgroundColor: isActive
                                  ? "#94a3b8"
                                  : "#475569",
                                border: "none",
                              }}
                              aria-label={`go-to-${idx}`}
                            />
                          );
                        }) ?? null}
                      </div>
                    </div>

                    <button
                      onClick={nextAddOn}
                      className="w-7 h-7 md:w-8 md:h-8 bg-[#B5B5B5] rounded-full flex items-center justify-center ml-1 z-30"
                      aria-label="next"
                    >
                      <svg
                        className="w-3 h-3 md:w-4 md:h-4 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={4}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>

                  <div style={{ height: 12 }} />
                </div>

                {/* Action buttons */}
                <div className="w-full md:w-auto">
                  {/* make sure these show in one line on desktop as before */}
                  <div className="overflow-x-visible md:overflow-visible">
                    <div className="flex items-center gap-6 md:gap-16 flex-nowrap px-2 md:px-0 justify-between">
                      {[
                        { icon: ViewIcon, label: "View" },
                        { icon: SeatIcon, label: "Seat layout" },
                        { icon: TicketIcon, label: "Ticket info" },
                      ].map((action, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col items-center flex-shrink-0 w-20 md:w-auto"
                        >
                          <button
                            className="w-12 h-12 md:w-16 md:h-16 bg-[linear-gradient(180.23deg,_#1E1242_-0.04%,_#6549B8_99.57%)] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                            aria-label={action.label}
                          >
                            <img
                              src={action.icon}
                              alt={action.label}
                              className="w-6 h-6 md:w-8 md:h-8"
                            />
                          </button>
                          <span
                            className={`text-xs md:text-base mt-2 ${theme.text}`}
                          >
                            {action.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank + quarters + donut */}
              <div
                className={`rounded-xl md:rounded-2xl p-4 md:p-6 mt-6 md:mt-8`}
                style={{
                  backgroundColor: theme.innerCardBg,
                  boxShadow: theme.smallCardShadow,
                }}
              >
                <div className="flex flex-col lg:flex-row w-full gap-4 md:gap-6 items-start">
                  {/* Bank details */}
                  <div className="w-full lg:w-[36%] lg:pr-6">
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-5">
                      <img
                        src={BankIcon}
                        alt="Bank"
                        className={`w-5 h-5 md:w-6 md:h-6 ${
                          !isDark ? "filter brightness-0" : ""
                        }`}
                      />
                      <h3
                        className={`text-lg md:text-xl font-extrabold tracking-wide ${theme.text}`}
                      >
                        Bank Details
                      </h3>
                    </div>

                    <div className="space-y-2 md:space-y-3 mb-6 md:mb-8 text-xs md:text-sm">
                      {[
                        {
                          label: "Bank name",
                          value: "Federal Bank PVT",
                          label2: "Amount before event",
                          value2: "10,000",
                        },
                        {
                          label: "Account no",
                          value: "1234567890012",
                          label2: "Amount after event",
                          value2: "90,0000",
                        },
                        {
                          label: "IFSC code",
                          value: "FORDL0001147",
                          label2: "Total Profit",
                          value2: "8,90,000",
                        },
                      ].map((row, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <p className={`text-xs ${theme.subText}`}>
                              {row.label} :
                            </p>
                            <p
                              className={`text-xs md:text-sm font-semibold ${theme.text}`}
                            >
                              {row.value}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className={`text-xs ${theme.subText}`}>
                              {row.label2} :
                            </p>
                            <p
                              className={`text-xs md:text-sm font-semibold ${theme.text}`}
                            >
                              {row.value2}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Download button */}
                    <div className="w-full flex justify-center mt-4">
                      <div className="relative flex items-center w-full md:w-[250px]">
                        <div
                          className="absolute -left-5 md:-left-6 z-20 flex items-center justify-center rounded-full"
                          style={{
                            width: 56,
                            height: 56,
                            background: isDark ? "#0f1112" : "#e5e7eb",
                            boxShadow: theme.buttonShadow,
                          }}
                        >
                          <div
                            className="flex items-center justify-center rounded-full"
                            style={{
                              width: 32,
                              height: 32,
                              background: isDark ? "#0b0d0e" : "#d1d5db",
                              boxShadow: theme.insetShadow,
                            }}
                          >
                            <img
                              src={DownloadIcon}
                              alt="download"
                              className={`w-5 h-5 ${
                                !isDark ? "filter brightness-0" : ""
                              }`}
                            />
                          </div>
                        </div>

                        <button
                          className={`w-full h-10 md:h-11 rounded-full flex items-center justify-center font-semibold text-sm md:text-base ${theme.text}`}
                          style={{
                            backgroundColor: theme.innerCardBg.replace("bg-", ""),
                            boxShadow: theme.buttonShadow,
                            paddingLeft: 48,
                            paddingRight: 20,
                          }}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Divider - Hidden on mobile */}
                  <div
                    className={`hidden lg:block w-px bg-opacity-50 ${
                      isDark ? "bg-[#151618]" : "bg-[#f1f1f1]"
                    }`}
                  />

                  {/* Quarters */}
                  <div className="relative flex-1 w-full">
                    {/* Scrollbar on left */}
                    <div className="absolute top-0 left-0 h-full w-2 bg-transparent z-10"></div>

                    <div className="lg:pl-4 lg:pr-2 max-h-full lg:max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#4b5563] scrollbar-track-transparent [direction:rtl]">
                      <div className="[direction:ltr] space-y-3 ml-2 py-4">
                        {quarters.map((q, idx) => {
                          const pct = Math.max(4, Math.min(100, q.percentage));

                          return (
                            <div
                              key={idx}
                              className={`rounded-xl p-3 w-full`}
                              style={{
                                minHeight: 85,
                                background: isDark
                                  ? "linear-gradient(92.38deg, rgba(255,255,255,0.1) 0.43%, rgba(153,153,153,0.1) 99.63%)"
                                  : "linear-gradient(92.38deg, rgba(200,200,200,0.3) 0.43%, rgba(220,220,220,0.3) 99.63%)",
                                boxShadow: theme.smallCardShadow,
                              }}
                            >
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-2">
                                <div className="flex items-center gap-2 md:gap-3">
                                  <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-purple-500 inline-block flex-shrink-0" />

                                  <h4
                                    className={`text-sm md:text-base lg:text-lg font-semibold tracking-tight ${theme.text}`}
                                  >
                                    {q.period}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                  <div className="flex-1 md:flex-none flex justify-center">
                                    <div
                                      className="rounded-full"
                                      style={{
                                        width: 100,
                                        height: 10,
                                        background:
                                          "linear-gradient(90deg, rgba(139,92,246,1) 0%, rgba(99,102,241,1) 100%)",
                                      }}
                                    />
                                  </div>

                                  <div
                                    className={`text-sm md:text-base font-semibold ${theme.text}`}
                                  >
                                    {q.percentage}%
                                  </div>
                                </div>
                              </div>

                              <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-3 md:gap-4">
                                  <div className={`text-xs ${theme.subText}`}>
                                    Total Bookings
                                  </div>
                                  <div className="text-base md:text-lg font-bold text-emerald-400">
                                    {q.bookings}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 md:gap-4">
                                  <div className={`text-xs ${theme.subText}`}>
                                    Total earnings
                                  </div>
                                  <div className="text-base md:text-lg font-bold text-emerald-400">
                                    {q.earnings}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Divider - Hidden on mobile */}
                  <div
                    className={`hidden lg:block w-px bg-opacity-50 ${
                      isDark ? "bg-[#151618]" : "bg-gray-300"
                    }`}
                  />

                  {/* Donut chart (bigger + responsive inner text) */}
                  <div className="w-full lg:w-[22%] lg:pl-6 flex flex-col items-center justify-center mt-6 lg:mt-0">
                    {/* control visual size with Tailwind widths; SVG scales inside */}
                    <div className="relative w-48 md:w-56 lg:w-64 overflow-visible">
                      {(() => {
                        const R = 80; // radius inside viewBox (bigger)
                        const stroke = 16; // stroke width (bigger)
                        const progress = 0.85; // 85%
                        const C = 2 * Math.PI * R;
                        return (
                          <svg
                            viewBox="0 0 240 240"
                            preserveAspectRatio="xMidYMid meet"
                            className="w-full h-auto transform -rotate-90"
                            aria-hidden="true"
                          >
                            {/* background ring */}
                            <circle
                              cx="120"
                              cy="120"
                              r={R}
                              stroke={isDark ? "#2a2d35" : "#d1d5db"}
                              strokeWidth={stroke}
                              fill="none"
                            />
                            {/* progress ring */}
                            <circle
                              cx="120"
                              cy="120"
                              r={R}
                              stroke="url(#gradient2)"
                              strokeWidth={stroke}
                              fill="none"
                              strokeDasharray={`${C * progress} ${C}`}
                              strokeLinecap="round"
                              style={{
                                transition: "stroke-dasharray .4s ease",
                              }}
                            />
                            <defs>
                              <linearGradient
                                id="gradient2"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                              >
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#6366f1" />
                              </linearGradient>
                            </defs>
                          </svg>
                        );
                      })()}

                      {/* center labels (smaller label so it never overlaps) */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span
                          className={`${theme.text} font-extrabold`}
                          style={{
                            lineHeight: 1,
                            // main percent — keep it readable but slightly smaller if needed
                            fontSize: "clamp(18px, 3.4vw, 32px)",
                          }}
                        >
                          85%
                        </span>
                        <span
                          className={`${theme.subText}`}
                          style={{
                            marginTop: 6,
                            fontSize: "clamp(9px, 1.2vw, 12px)",
                            maxWidth: "70%",
                            textAlign: "center",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title="Total Tickets Sold"
                        >
                          Total Tickets Sold
                        </span>
                      </div>
                    </div>

                    <p
                      className={`text-center text-xs md:text-sm font-medium ${theme.subText}`}
                    >
                      Total earnings
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Navigation - Mobile only */}
        <div className="md:hidden">
          <BottomNavigation theme={theme} user={user} />
        </div>
      </div>
    </>
  );
};

export default PreviousEventView;
