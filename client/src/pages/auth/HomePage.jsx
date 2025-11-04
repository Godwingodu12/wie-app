// src/pages/HomePage/HomePage.jsx
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  getGroups,
  getMyLiveEvents,
  getMyEvents,
  groupEventCount,
} from "../../services/ticketService";
import GroupSelectionModal from "../../components/modals/GroupSelectionModal";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import SideBar from "../../components/HomePage/SideBar.jsx";
import NotificationModal from "../../components/Event/NotificationModal";
import { getNotifications } from "../../services/notificationService";
// ICONS
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import HomeIcon from "../../assets/HomePage/HomeIcon.svg";
import TicketIcon from "../../assets/HomePage/TicketIcon.svg";
import LinkIcon from "../../assets/HomePage/LiveIcon.svg";
import SpeakerIcon from "../../assets/HomePage/SpeakerIcon.svg";
import ChatIcon from "../../assets/HomePage/ChatIcon.svg";
import NotificationIcon from "../../assets/HomePage/NotificationIcon.svg";
import SettingIcon from "../../assets/HomePage/SettingIcon.svg";
import CalenderIcon from "../../assets/HomePage/CalenderIcon.svg";
import EventCalenderIcon from "../../assets/HomePage/EventCalenderIcon.svg";
import MoneyIcon from "../../assets/HomePage/MoneyIcon.svg";
import MovieIcon from "../../assets/HomePage/MovieIcon.svg";
import LiveIcon from "../../assets/HomePage/LiveIcon.svg";
import GroupIcon from "../../assets/HomePage/GroupIcon.svg";
import PlusIcon from "../../assets/HomePage/PlusIcon.svg";
import WieText from "../../assets/HomePage/WieText.svg";
import RevenueICon from "../../assets/HomePage/RevenueICon.svg";
import PathIcon from "../../assets/HomePage/PathIcon.svg";
import no_event from "../../assets/ViewGroup/no_event.png";
import BottomNavigation from "../../components/HomePage/BottomNavigation.jsx";
import ProfileImage from "../../assets/PROFILEPAGE/ProfileImage.png";

const API_BASE_URL = import.meta.env.VITE_TICKET_API_BASE_URL;
const getImageUrl = (path) => {
  if (!path) return null;
  if (typeof path === "object") {
    path = path.path || path.url || null;
  }
  if (typeof path !== "string") {
    console.warn("Invalid path type:", typeof path, path);
    return null;
  }
  let cleanPath = path.replace(/\\/g, "/");
  cleanPath = cleanPath.replace(/^src\//, "");
  cleanPath = cleanPath.replace(/^\//, "");
  const fullUrl = `${API_BASE_URL}/${cleanPath}`;
  return fullUrl;
};
const CustomScrollbarStyles = () => (
  <style>{`
    /* Vertical Scrollbar */
    .main-scrollbar::-webkit-scrollbar { width: 8px; }
    .main-scrollbar::-webkit-scrollbar-track { background: #212426; }
    .main-scrollbar::-webkit-scrollbar-thumb {
      background-color: #4f4f4f;
      border-radius: 10px;
      border: 2px solid #212426;
    }
    .main-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #4f4f4f #212426;
    }

    /* Horizontal Scrollbar */
    .horizontal-scrollbar::-webkit-scrollbar { height: 8px; }
    .horizontal-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .horizontal-scrollbar::-webkit-scrollbar-thumb {
      background-color: #4f4f4f;
      border-radius: 10px;
    }
    .horizontal-scrollbar {
       scrollbar-width: thin;
       scrollbar-color: #4f4f4f transparent;
    }

    /* UI Scaling for larger screens */
    @media (min-width: 1280px) {
      html {
        /* Default is 16px. Increasing this scales up all rem-based units. */
        font-size: 18px;
      }
    }
  `}</style>
);

const dashboardStats = [
  {
    icon: EventCalenderIcon,
    title: "Total Event Created",
    temp: "🎈",
    value: "Nothing's Happening... Yet!",
    isEventStat: true,
  },
  {
    icon: MoneyIcon,
    title: "Today's Revenue",
    temp: "💸",
    value: "No Coins in the Jar Yet!",
  },
  {
    icon: MovieIcon,
    title: "Today's Booking",
    temp: "📭",
    value: "No Bookings Today!",
  },
];

const HEADER_HEIGHT = 72;

const HomePage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);
  const [confirmedEventsCount, setConfirmedEventsCount] = useState(0);
  const [groupsWithCount, setGroupsWithCount] = useState([]);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const totalEvents = groupsWithCount.reduce(
    (acc, group) => acc + (group.events_count || 0),
    0,
  );
  const [eventStats, setEventStats] = useState({
    totalCount: 0,
    groupStats: [],
    currentGroupIndex: 0,
  });
  const [loadingEventStats, setLoadingEventStats] = useState(false);
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [liveEventsData, groupsData, allEventsData] = await Promise.all([
          getMyLiveEvents(),
          getGroups(),
          getMyEvents(),
        ]);
        const liveEventsArray = liveEventsData?.tickets
          ? [].concat(liveEventsData.tickets)
          : [];
        setLiveEvents(liveEventsArray);

        const groupsArray = Array.isArray(groupsData) ? groupsData : [];
        setGroups(groupsArray);

        // Get confirmed events count from getMyEvents
        const allEventsArray = allEventsData?.tickets
          ? [].concat(allEventsData.tickets)
          : [];
        const confirmedCount = allEventsArray.filter(
          (event) => event.event_status === "confirmed",
        ).length;
        setConfirmedEventsCount(confirmedCount);
      } catch (e) {
        console.error("Error fetching data:", e);
        setLiveEvents([]);
        setGroups([]);
        setConfirmedEventsCount(0);
      }
    };
    fetchData();
  }, [user]);
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!user) return;
      try {
        const data = await getNotifications("all", 1, 0);
        setNotificationCount(data.unreadCount || 0);
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };

    fetchNotificationCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNotificationModalClose = async () => {
    setIsNotificationModalOpen(false);
    // Refresh count after closing modal
    if (user) {
      try {
        const data = await getNotifications("all", 1, 0);
        setNotificationCount(data.unreadCount || 0);
      } catch (error) {
        console.error("Error refreshing notification count:", error);
      }
    }
  };
  useEffect(() => {
    const fetchEventStats = async () => {
      if (!user) return;

      setLoadingEventStats(true);
      try {
        const [allEventsData, groupsData] = await Promise.all([
          getMyEvents(),
          getGroups(),
        ]);

        const allEventsArray = allEventsData?.tickets
          ? [].concat(allEventsData.tickets)
          : [];
        const groupsArray = Array.isArray(groupsData) ? groupsData : [];

        // Calculate group-wise event count
        const groupEventCount = {};
        allEventsArray.forEach((event) => {
          if (event.groupId) {
            groupEventCount[event.groupId] =
              (groupEventCount[event.groupId] || 0) + 1;
          }
        });

        // Create group stats with names
        const groupStats = Object.entries(groupEventCount).map(
          ([groupId, count]) => {
            const group = groupsArray.find((g) => g._id === groupId);
            return {
              groupId,
              groupName: group?.name || "Unknown Group",
              count,
            };
          },
        );

        setEventStats({
          totalCount: allEventsArray.length,
          groupStats: groupStats,
          currentGroupIndex: 0,
        });
      } catch (error) {
        console.error("Error fetching event statistics:", error);
      } finally {
        setLoadingEventStats(false);
      }
    };

    fetchEventStats();
  }, [user]);
  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };
  useEffect(() => {
    const fetchEventCounts = async () => {
      if (!groups || groups.length === 0) {
        setGroupsWithCount([]);
        return;
      }

      try {
        const response = await groupEventCount();

        if (response && response.groups) {
          const updatedGroups = groups.map((group) => {
            const groupWithCount = response.groups.find(
              (g) => g._id === group._id,
            );
            return {
              ...group,
              events_count: groupWithCount ? groupWithCount.events_count : 0,
            };
          });
          setGroupsWithCount(updatedGroups);
        } else {
          setGroupsWithCount(groups);
        }
      } catch (error) {
        console.error("Error fetching event counts:", error);
        setGroupsWithCount(groups);
      }
    };

    fetchEventCounts();
  }, [groups]);
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
  const handlePrevGroup = () => {
    setEventStats((prev) => ({
      ...prev,
      currentGroupIndex:
        prev.currentGroupIndex > 0 ? prev.currentGroupIndex - 1 : 0,
    }));
  };
  const handleNextGroup = () => {
    setEventStats((prev) => ({
      ...prev,
      currentGroupIndex:
        prev.currentGroupIndex < prev.groupStats.length
          ? prev.currentGroupIndex + 1
          : prev.currentGroupIndex,
    }));
  };
  const displayName = user?.name || "User";
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
        bg: "bg-[#f0f2f5]",
        text: "text-gray-900",
        subText: "text-gray-600",
        cardBg: "bg-[#f0f2f5]",
        border: "border-[#e4e6ea]",
        inputBg: "bg-[#ffffff]",
      };
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
          background: ${isDark ? "#1f2937" : "#f1f1f1"};
        }

        body::-webkit-scrollbar-thumb,
        html::-webkit-scrollbar-thumb,
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: ${isDark ? "#4b5563" : "#cbd5e1"};
          border-radius: 10px;
        }

        body::-webkit-scrollbar-thumb:hover,
        html::-webkit-scrollbar-thumb:hover,
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? "#6b7280" : "#94a3b8"};
        }
      `}</style>
      <CustomScrollbarStyles isDark={isDark} />
      <div
        className={`${theme.bg} ${theme.text} min-h-screen flex overflow-hidden transition-colors duration-300`}
      >
        {/* Desktop Sidebar */}
        <div
          className={`hidden md:flex flex-col flex-shrink-0 nest-hub-sidebar ${theme.bg} border-r ${theme.border}`}
        >
          <div
            className="flex items-center justify-center"
            style={{ height: HEADER_HEIGHT }}
          >
            <img
              src={WieLogo}
              alt="Wie Logo"
              className="w-10 h-10 lg:w-12 lg:h-12"
            />
          </div>
          <div className="flex-1 sidebar-content overflow-y-auto">
            <SideBar user={user} theme={theme} isDark={isDark} />
          </div>
        </div>

        <div className="flex flex-col flex-1 relative overflow-hidden">
          <header
            className="flex items-center justify-between px-4 md:px-6 flex-shrink-0"
            style={{ height: HEADER_HEIGHT }}
          >
            <div className="flex md:hidden items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <img
                  src={WieLogo}
                  alt="WIE Logo"
                  className="w-8 h-8 object-contain"
                />
                <img src={WieText} alt="WIE" className="h-5 object-contain" />
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    onClick={() => setIsNotificationModalOpen(true)}
                    style={{
                      boxShadow: isDark
                        ? "inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)"
                        : "inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)",
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer ${theme.bg}`}
                  >
                    <img
                      src={NotificationIcon}
                      alt="Notification"
                      className={`w-4 h-4 ${isDark ? "filter brightness-0 invert" : "filter brightness-0"}`}
                    />
                  </div>
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                      {notificationCount}
                    </span>
                  )}
                </div>
                <button
                  style={{
                    boxShadow: isDark
                      ? "inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)"
                      : "inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)",
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.bg}`}
                >
                  <img
                    src={ChatIcon}
                    alt="chats"
                    className={`w-6 h-6 ${isDark ? "filter brightness-0 invert" : "filter brightness-0"}`}
                  />
                </button>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4 w-full">
              <div className="flex-1 min-w-0">
                <SearchBar
                  theme={theme}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onTuneClick={() => console.log("Tune clicked")}
                  user={user}
                />
              </div>
              <div className="flex items-center gap-4 ml-auto flex-shrink-0">
                <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
              </div>
            </div>
          </header>
          <main
            className={`main-scrollbar flex flex-col flex-1 p-4 md:px-6 md:pt-6 overflow-y-auto pb-32 md:pb-4 ${theme.cardBg}`}
          >
            <div className="w-full flex flex-col flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 flex-shrink-0">
                <div className="mb-4 md:mb-0">
                  <h1
                    className={`text-xl md:text-2xl font-semibold ${theme.text}`}
                  >
                    Good day, {displayName}!
                  </h1>
                  <p className={`text-sm ${theme.subText}`}>Let's Rock This!</p>
                </div>
                <div className="mb-4 md:hidden">
                  <SearchBar
                    theme={theme}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onTuneClick={() => console.log("Tune clicked")}
                    user={user}
                  />
                </div>
                <div className="flex items-center gap-3">
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
                      <img src={PlusIcon} alt="Add" className="w-6 h-6" style={{ filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)' }}/>
                    </span>
                    {loading ? "Checking..." : "Create event"}
                  </button>
                  <div
                    style={{
                      boxShadow: isDark
                        ? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)"
                        : "-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)",
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full h-12 ${theme.bg} mx-auto sm:mx-0`}
                  >
                    <span className="bg-[#249EFF] rounded-full w-8 h-8 flex items-center justify-center -ml-2">
                      <img
                        src={CalenderIcon}
                        alt="Calendar"
                        className="w-5 h-5"
                      />
                    </span>
                    <span className={`text-sm ${theme.text}`}>
                      {new Date().toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                {/* Left Column */}
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {dashboardStats.map((stat) => {
                      // Determine what to display for event stat
                      const isShowingTotal =
                        stat.isEventStat && eventStats.currentGroupIndex === 0;
                      const currentGroupStat =
                        stat.isEventStat && eventStats.currentGroupIndex > 0
                          ? eventStats.groupStats[
                              eventStats.currentGroupIndex - 1
                            ]
                          : null;

                      const displayCount = stat.isEventStat
                        ? isShowingTotal
                          ? eventStats.totalCount
                          : currentGroupStat?.count || 0
                        : null;

                      const displayLabel = stat.isEventStat
                        ? isShowingTotal
                          ? "Total Events"
                          : currentGroupStat?.groupName || ""
                        : null;

                      return (
                        <div
                          key={stat.title}
                          style={{
                            boxShadow: isDark
                              ? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)"
                              : "-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)",
                          }}
                          className={`${theme.bg} rounded-[2.5rem] relative p-6 flex flex-col items-center justify-center gap-3 h-full transition-all duration-300`}
                        >
                          <div
                            style={{
                              boxShadow: isDark
                                ? "inset 4px 4px 8px 0px rgba(0,0,0,0.30), inset -4px -4px 8px 0px rgba(255,255,255,0.09)"
                                : "inset 4px 4px 8px 0px rgba(0,0,0,0.10), inset -4px -4px 8px 0px rgba(255,255,255,0.22)",
                            }}
                            className={`absolute top-0 left-1/2 -translate-x-1/2 w-14 h-6 rounded-b-xl z-10 ${theme.bg}`}
                          ></div>
                          <img
                            src={stat.icon}
                            alt={stat.title}
                            className="w-5 h-5 absolute left-5 top-3 z-20"
                          />

                          <div className="flex flex-col items-center w-full mt-4">
                            <div
                              className={`font-semibold text-center mb-2 text-sm ${theme.text}`}
                              style={{ letterSpacing: "0.05em" }}
                            >
                              {stat.title.toUpperCase()}
                            </div>

                            {stat.isEventStat ? (
                              <>
                                {loadingEventStats ? (
                                  <div
                                    className={`${theme.subText} text-base text-center mt-4`}
                                  >
                                    Loading...
                                  </div>
                                ) : eventStats.totalCount === 0 ? (
                                  <>
                                    <div className="text-center mt-2 text-2xl">
                                      {stat.temp}
                                    </div>
                                    <div
                                      className={`${theme.subText} text-base text-center mt-4 px-1`}
                                    >
                                      {stat.value}
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center w-full">
                                    <div
                                      className={`text-4xl font-bold ${theme.text} mt-2`}
                                    >
                                      {displayCount}
                                    </div>
                                    <div
                                      className={`${theme.subText} text-xs text-center mt-2 px-1`}
                                    >
                                      {displayLabel}
                                    </div>

                                    {/* Navigation arrows - only show when there are groups to navigate */}
                                    {eventStats.groupStats.length > 0 && (
                                      <div className="flex items-center gap-3 mt-4">
                                        <button
                                          onClick={handlePrevGroup}
                                          disabled={
                                            eventStats.currentGroupIndex === 0
                                          }
                                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                            eventStats.currentGroupIndex === 0
                                              ? "opacity-30 cursor-not-allowed"
                                              : "hover:scale-110"
                                          }`}
                                          style={{
                                            boxShadow: isDark
                                              ? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)"
                                              : "-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)",
                                          }}
                                        >
                                          <span
                                            className={`${theme.text} text-lg`}
                                          >
                                            ←
                                          </span>
                                        </button>

                                        <div className="flex gap-1">
                                          {[
                                            ...Array(
                                              eventStats.groupStats.length + 1,
                                            ),
                                          ].map((_, idx) => (
                                            <div
                                              key={idx}
                                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                                eventStats.currentGroupIndex ===
                                                idx
                                                  ? "bg-[#3EB489] w-3"
                                                  : isDark
                                                    ? "bg-gray-600"
                                                    : "bg-gray-400"
                                              }`}
                                            ></div>
                                          ))}
                                        </div>

                                        <button
                                          onClick={handleNextGroup}
                                          disabled={
                                            eventStats.currentGroupIndex >=
                                            eventStats.groupStats.length
                                          }
                                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                            eventStats.currentGroupIndex >=
                                            eventStats.groupStats.length
                                              ? "opacity-30 cursor-not-allowed"
                                              : "hover:scale-110"
                                          }`}
                                          style={{
                                            boxShadow: isDark
                                              ? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)"
                                              : "-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)",
                                          }}
                                        >
                                          <span
                                            className={`${theme.text} text-lg`}
                                          >
                                            →
                                          </span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="text-center mt-2 text-2xl">
                                  {stat.temp}
                                </div>
                                <div
                                  className={`${theme.subText} text-base text-center mt-4 px-1`}
                                >
                                  {stat.value}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      boxShadow: isDark
                        ? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)"
                        : "-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)",
                    }}
                    className={`${theme.bg} rounded-[2.5rem] p-6 flex flex-col transition-all duration-300 min-h-[450px] max-h-[550px]`}
                  >
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <img
                          src={RevenueICon}
                          alt="Earnings Statistics"
                          className="w-5 h-5 "
                        />
                        <div
                          className={`font-semibold text-base ${theme.text}`}
                        >
                          LIVE EVENTS EARNING STATISTICS
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`${theme.subText}`}>(JAN-AUG)</span>
                        <select
                          className={`bg-transparent border-none ${theme.text} outline-none cursor-pointer`}
                        >
                          <option
                            className="bg-[#212426] text-white"
                            value="months"
                          >
                            Months
                          </option>
                          <option
                            className="bg-[#212426] text-white"
                            value="weeks"
                          >
                            Weeks
                          </option>
                          <option
                            className="bg-[#212426] text-white"
                            value="days"
                          >
                            Days
                          </option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-start justify-between mb-2">
                      {" "}
                      <div className="flex flex-col">
                        <div className={`text-xl font-bold ${theme.text}`}>
                          Bellie Eilish Concert
                        </div>
                        <div
                          className={`text-3xl font-extrabold text-[#21d18b] mt-1`}
                        >
                          $66,672.61
                        </div>
                        <div className={`text-sm ${theme.subText}`}>
                          Total amount
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <img
                          src={PathIcon}
                          alt="Growth Trend"
                          className="w-16 h-8"
                        />
                        <div className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center">
                          <span className={`text-sm font-bold ${theme.text}`}>
                            14%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-end justify-around py-2 mt-4">
                      {" "}
                      {[
                        "JAN",
                        "FEB",
                        "MAR",
                        "APR",
                        "MAY",
                        "JUN",
                        "JUL",
                        "AUG",
                      ].map((month, index) => (
                        <div key={month} className="flex flex-col items-center">
                          <div className={`text-xs ${theme.subText} mb-1`}>
                            320k
                          </div>
                          <div
                            className="w-4 rounded-xl bg-[#21d18b]"
                            style={{ height: `${(index + 1) * 8 + 15}px` }}
                          ></div>
                          <div className={`text-xs mt-1 ${theme.subText}`}>
                            {month}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col items-center mt-4 pt-2">
                      {" "}
                      <div className="w-full flex justify-between items-center text-xs">
                        <span className={`${theme.subText}`}>
                          Coldpaly concert : $666.27k
                        </span>
                        <span className={`${theme.subText}`}>
                          Total booking (Coldpaly concert) : 22k
                        </span>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <div
                          className={`w-2 h-2 rounded-full ${isDark ? "bg-gray-600" : "bg-gray-400"}`}
                        ></div>
                        <div
                          className={`w-2 h-2 rounded-full ${isDark ? "bg-white" : "bg-gray-800"}`}
                        ></div>
                        <div
                          className={`w-2 h-2 rounded-full ${isDark ? "bg-gray-600" : "bg-gray-400"}`}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-4">
                  <div
                    style={{
                      boxShadow: isDark
                        ? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)"
                        : "-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)",
                    }}
                    className={`${theme.bg} rounded-[2.5rem] p-6 flex flex-col transition-all duration-300 min-h-[350px] max-h-[450px]`}
                  >
                    <div className="flex items-center justify-between gap-3 flex-shrink-0 mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={LiveIcon}
                          alt="Live Events"
                          className="w-5 h-5"
                        />
                        <div
                          className={`font-semibold text-base ${theme.text}`}
                        >
                          LIVE EVENTS
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/ticket/live-events")}
                        className="bg-[#6a47fa] text-white rounded-full px-6 py-2 text-sm font-light tracking-wider hover:bg-blue-500 transition-colors"
                      >
                        see all
                      </button>
                    </div>
                    <div className="flex-1 pr-2">
                      {liveEvents.length > 0 ? (
                        liveEvents.slice(0, 3).map((event) => {
                          const isSelected = selectedEvent === event._id;
                          const eventDates = event.event_dates[0];
                          const eventDate = new Date(
                            eventDates.start_date,
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          });

                          // Get banner image URL
                          const bannerUrl = event.event_banner
                            ? getImageUrl(event.event_banner)
                            : "https://via.placeholder.com/40?text=Event";

                          return (
                            <div
                              key={event._id}
                              onClick={() =>
                                navigate(`/ticket/live-event-view/${event._id}`)
                              }
                              className={`flex items-center justify-between p-3 mb-2 rounded-2xl cursor-pointer transition-all duration-300`}
                              style={{
                                boxShadow: isSelected
                                  ? isDark
                                    ? "inset 3px 3px 6px rgba(0,0,0,0.6), inset -3px -3px 6px rgba(60,60,60,0.3)"
                                    : "inset 3px 3px 6px rgba(0,0,0,0.1), inset -3px -3px 6px rgba(255,255,255,0.8)"
                                  : "none",
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={bannerUrl}
                                  alt={event.event_name}
                                  className="w-10 h-10 rounded-md object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = ProfileImage;
                                  }}
                                />
                                <div>
                                  <p
                                    className={`${theme.text} text-sm font-medium`}
                                  >
                                    {event.event_name}
                                  </p>
                                  <p className={`${theme.subText} text-xs`}>
                                    {eventDate}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="flex items-center gap-3 text-gray-400">
                                  <img
                                    src={TicketIcon}
                                    alt="Ticket"
                                    className={`w-5 h-5 ${isDark ? "" : "filter brightness-0"}`}
                                  />
                                  <img
                                    src={LinkIcon}
                                    alt="Link"
                                    className={`w-5 h-5`}
                                  />
                                  <div
                                    className={`h-4 w-px ${isDark ? "bg-gray-600" : "bg-gray-400"}`}
                                  ></div>
                                  <img
                                    src={SettingIcon}
                                    alt="More"
                                    className={`w-5 h-5 ${isDark ? "" : "filter brightness-0"}`}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 py-4 h-full w-full">
                          <img
                            src={no_event}
                            alt="No live event"
                            className="w-auto h-24 md:h-28 object-contain"
                          />
                          <div className="text-center md:text-left">
                            <h3
                              className={`text-lg font-semibold ${theme.text}`}
                            >
                              No Live Event
                            </h3>
                            <p className={`text-sm ${theme.subText}`}>
                              There are no current live events.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      boxShadow: isDark
                        ? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)"
                        : "-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)",
                    }}
                    className={`${theme.bg} rounded-[2.5rem] p-6 flex flex-col transition-all duration-300 min-h-[350px] max-h-[450px]`}
                  >
                    <div className="flex items-center justify-between gap-3 flex-shrink-0 mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={GroupIcon}
                          alt="My Groups"
                          className="w-5 h-5"
                        />
                        <div
                          className={`font-semibold text-base ${theme.text}`}
                        >
                          MY GROUPS
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/ticket/groups")}
                        className={`border border-[rgba(101,73,184,1)] rounded-full px-6 py-2 text-sm font-light tracking-wider transition-colors hover:bg-blue-500 hover:text-white ${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        see all
                      </button>
                    </div>

                    {groupsWithCount.length > 0 ? (
                      <div className="flex gap-4 overflow-x-auto horizontal-scrollbar">
                        {groupsWithCount.slice(0, 6).map((group) => {
                          const groupImageUrl = group.company_logo
                            ? getImageUrl(group.company_logo) || ProfileImage
                            : ProfileImage;
                          const totalEvents =
                            group.total_events || group.events_count || 0;
                          return (
                            <div
                              key={group._id}
                              className="p-4 flex flex-col items-center gap-2 rounded-3xl flex-shrink-0 w-40"
                              style={{
                                boxShadow: isDark
                                  ? "inset 3px 3px 6px rgba(0,0,0,0.5), inset -3px -3px 6px rgba(60,60,60,0.25)"
                                  : "inset 3px 3px 6px rgba(0,0,0,0.1), inset -3px -3px 6px rgba(255,255,255,0.5)",
                              }}
                            >
                              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                                <img
                                  src={groupImageUrl}
                                  alt={group.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = ProfileImage;
                                  }}
                                />
                              </div>
                              <p
                                className={`${theme.text} text-sm font-medium text-center`}
                              >
                                {group.name}
                              </p>
                              <p
                                className={`${theme.subText} text-xs text-center`}
                              >
                                {totalEvents}{" "}
                                {totalEvents === 1 ? "event" : "events"} created
                              </p>
                              <button
                                onClick={() =>
                                  navigate(`/ticket/group/${group._id}`)
                                }
                                className={`w-full mt-2 border border-[rgba(101,73,184,1)] rounded-full py-1.5 text-xs font-light tracking-wider ${isDark ? "text-gray-300" : "text-gray-700"}`}
                              >
                                view
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <button
                          onClick={() => navigate("/ticket/create-group")}
                          className="w-[54px] h-[54px] rounded-full flex items-center justify-center border border-[#00000014] p-[15px] transition-all hover:scale-105"
                          style={{
                            boxShadow: isDark
                              ? "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A"
                              : "8px 8px 12px 0px #00000029, -8px -8px 12px 0px #FFFFFF0A",
                          }}
                        >
                          <img
                            src={PlusIcon}
                            alt="Create Group"
                            className="w-6 h-6"
                            style={{ filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)' }}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
          <NotificationModal
            isOpen={isNotificationModalOpen}
            onClose={handleNotificationModalClose}
            isDark={isDark}
          />
          <BottomNavigation theme={theme} user={user} />
        </div>
        <GroupSelectionModal
          groups={groups}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelectGroup={handleSelectGroup}
          isDark={isDark}
        />
      </div>
    </>
  );
};
export default HomePage;
