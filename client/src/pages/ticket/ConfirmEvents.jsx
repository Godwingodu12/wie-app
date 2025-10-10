import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import GroupSelectionModal from "../../components/modals/GroupSelectionModal";
import SideBar from "../../components/HomePage/SideBar";
import SearchBar from "../../components/HomePage/SearchBar";
import ThemeToggle from "../../components/HomePage/ThemeToggle";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import {
  getMyEvents,
  getGroups,
  getMyLiveEvents,
} from "../../services/ticketService";
import PlusIcon from "../../assets/HomePage/PlusIcon.svg";
import NotificationIcon from "../../assets/HomePage/NotificationIcon.svg";
import ContactIcon from '../../assets/Event/ContactIcon.svg';
import FileIcon from '../../assets/Event/FileIcon.svg';
import {
  ChevronDown,
  PartyPopper,
  Radio,
  Search,
  Landmark,
} from "lucide-react";

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
        <h3 className="text-xl font-semibold">My groups,</h3>
        <p className={`text-sm ${theme.subText}`}>{groups.length} groups</p>
      </div>
      {groups.length > 2 && (
        <button className={`text-sm ${theme.subText} hover:underline`}>
          See more
        </button>
      )}
    </div>
    <div className="flex flex-row flex-wrap items-center justify-start w-full gap-6 flex-grow">
      {groups.slice(0, 2).map((group, index) => (
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
              src={`${import.meta.env.VITE_AUTH_API_BASE_URL}/uploads/${group.image}`}
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
const StatsCard = ({ count, title, isDark, theme, className, icon }) => (
  <div
    style={{
      borderRadius: "24px",
      padding: "15px 27px",
      gap: "10px",
      background: isDark ? "#2a2d30" : "#F1F1F1",
      boxShadow: isDark
        ? "8px 8px 12px rgba(0,0,0,0.4), -8px -8px 12px rgba(255,255,255,0.05)"
        : "8px 8px 12px #00000029, -8px -8px 12px #FFFFFF0A",
    }}
    className={`flex flex-col items-center justify-around w-full ${className}`}
  >
    {icon}
    <p
      className={`text-2xl sm:text-3xl md:text-5xl font-semibold ${theme.text}`}
    >
      {count}
    </p>
    <p className={`text-xs ${theme.subText}`}>{title}</p>
  </div>
);

function BankAccountDetailsCard({ isDark, theme }) {
  const accountDetails = {
    eventName: "Coldplay concert",
    accountHolder: "Sangeeth Palliyal",
    bankName: "Union bank of India",
    ifscCode: "UBISBII2345",
    accountNumber: "1212121222143242",
  };

  return (
    <div
      className={`w-full rounded-[50px] p-4 sm:p-6 font-sans ${
        theme.cardBg
      } ${getNeumorphicShadows(isDark)}`}
    >
      {/* Card Header */}
      <header
        className={`flex items-center justify-between border-b ${
          isDark ? "border-gray-700" : "border-gray-200"
        } pb-4 mb-6 flex-wrap gap-4`}
      >
        <div className="flex items-center">
          <Landmark className="h-8 w-8 text-green-500" />
          <h1
            className={`ml-3 text-sm sm:text-base font-bold ${theme.text} tracking-wide`}
          >
            BANK ACCOUNT DETAILS
            <span className={`ml-2 font-normal ${theme.subText}`}>
              ({accountDetails.eventName})
            </span>
          </h1>
        </div>
        <button className="whitespace-nowrap text-xs sm:text-sm font-semibold text-purple-600 border border-purple-300 rounded-full px-4 py-1.5 sm:px-5 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors duration-300">
          see all
        </button>
      </header>

      {/* Card Body with Details */}
      <main className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium ${theme.subText}`}>
            Account holder :
          </p>
          {accountDetails.accountHolder && (
            <p
              className={`text-sm ${theme.text} ${
                isDark ? "bg-gray-700" : "bg-gray-500"
              } text-white rounded-md px-3 py-1 shadow-sm truncate`}
            >
              {accountDetails.accountHolder}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium ${theme.subText}`}>Bank name :</p>
          {accountDetails.bankName && (
            <p
              className={`text-sm ${theme.text} ${
                isDark ? "bg-gray-700" : "bg-gray-500"
              } text-white rounded-md px-3 py-1 shadow-sm truncate`}
            >
              {accountDetails.bankName}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium ${theme.subText}`}>IFSC code :</p>
          {accountDetails.ifscCode && (
            <p
              className={`text-sm ${theme.text} ${
                isDark ? "bg-gray-700" : "bg-gray-500"
              } text-white rounded-md px-3 py-1 shadow-sm truncate`}
            >
              {accountDetails.ifscCode}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium ${theme.subText}`}>
            Account number :
          </p>
          {accountDetails.accountNumber && (
            <p
              className={`text-sm ${theme.text} ${
                isDark ? "bg-gray-700" : "bg-gray-500"
              } text-white rounded-md px-3 py-1 shadow-sm truncate`}
            >
              {accountDetails.accountNumber}
            </p>
          )}
        </div>
      </main>

      {/* Card Footer/Pagination indicator */}
      <footer className="flex justify-center mt-6">
        <div
          className={`w-2.5 h-2.5 ${
            isDark ? "bg-gray-600" : "bg-gray-400"
          } rounded-full`}
        ></div>
      </footer>
    </div>
  );
}

const EventsList = ({ isDark, theme, events = [], groups = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef(null);
  const itemsPerPage = 6;

  useEffect(() => {
    if (isSearchActive) {
      searchInputRef.current?.focus();
    }
  }, [isSearchActive]);

  const filteredEvents = useMemo(() => {
    let filtered = events || [];

    if (searchTerm) {
      filtered = filtered.filter((event) =>
        event.event_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [events, searchTerm]);

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
    const dateString = event.event_start_date ?? event.start_date;
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date)) {
      return "Invalid Date";
    }
    return date.toLocaleDateString();
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
      className={`w-full rounded-[50px] p-4 sm:p-8 ${
        isDark ? theme.cardBg : "bg-[#f1f1f1]"
      } ${getNeumorphicShadows(isDark)}`}
    >
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile view */}
        <div className="flex flex-col lg:hidden">
          {displayEvents.map((event, index) => {
            if (!event) {
              return (
                <div key={`placeholder-${index}`} className="p-4 h-[80px]">
                  &nbsp;
                </div>
              );
            }
            const group = groups.find((g) => g._id === event.groupId);
            const groupName = group ? group.name : "N/A";
            return (
              <div
                key={event._id || index}
                className={`border-b ${
                  isDark ? "border-gray-700/50" : "border-gray-200"
                } p-4 flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full ${
                      isDark ? "bg-indigo-500/20" : "bg-indigo-100"
                    } flex-shrink-0 flex items-center justify-center ${
                      isDark ? "text-indigo-300" : "text-indigo-500"
                    }`}
                  >
                    <svg
                        className="w-6 h-6"
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
                  <div>
                    <p className={`${theme.text} font-semibold`}>{event.event_name}</p>
                    <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"} flex items-center gap-2`}>
                      <span>{groupName}</span>
                      <span>&bull;</span>
                      <span>{formatDate(event)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button className="bg-[#00DEA3] text-black font-semibold text-xs px-4 py-2 rounded-full shadow-md hover:bg-[#00c591] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#00DEA3] focus:ring-opacity-50">
                    Run
                  </button>
                  <div className="flex items-center gap-2">
                    <button className="bg-gray-500 w-10 h-10 flex items-center justify-center rounded-full shadow-md hover:bg-gray-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50">
                        <img src={ContactIcon} alt="Contact" className="w-6 h-6" />
                    </button>
                    <button className="bg-gray-500 w-10 h-10 flex items-center justify-center rounded-full shadow-md hover:bg-gray-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50">
                        <img src={FileIcon} alt="File" className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <table className="hidden lg:table w-full table-fixed text-left">
          <thead>
            <tr
              className={`${isDark ? "text-gray-400" : "text-black"} border-b ${
                isDark ? "border-gray-700" : "border-gray-200"
              } text-sm sticky top-0`}
              style={{
                background: isDark ? "#232426" : "#F1F1F1",
                zIndex: 10,
              }}
            >
              <th className="py-3 px-4 font-bold text-lg">
                <div className="flex items-center justify-start gap-2">
                  {isSearchActive ? (
                    <div className="flex items-center gap-2 w-full">
                      <Search className="w-4 h-4" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onBlur={() => {
                          setIsSearchActive(false);
                          setSearchTerm("");
                        }}
                        className="bg-transparent focus:outline-none w-full placeholder-gray-500"
                      />
                    </div>
                  ) : (
                    <>
                      <span>Events</span>
                      <Search
                        className="w-4 h-4 cursor-pointer"
                        onClick={() => setIsSearchActive(true)}
                      />
                    </>
                  )}
                </div>
              </th>
              <th className="py-3 px-4 font-bold text-lg">
                Group name
              </th>
              <th className="py-3 px-4 font-bold text-lg">
                Sub category
              </th>
              <th className="py-3 px-4 font-bold text-lg">
                Starting date
              </th>
              <th className="py-3 px-4 font-bold text-lg">Location</th>
              <th className="py-3 px-4 font-bold text-lg">Type</th>
              <th className="py-3 px-4 font-bold text-lg">Actions</th>
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
                    <td className="py-3 px-4">&nbsp;</td>
                    <td className="py-3 px-4">&nbsp;</td>
                    <td className="py-3 px-4">&nbsp;</td>
                  </tr>
                );
              }
              const group = groups.find((g) => g._id === event.groupId);
              const groupName = group ? group.name : "N/A";
              return (
                <tr
                  key={event._id || index}
                  className={`border-b ${
                    isDark ? "border-gray-700/50" : "border-gray-200"
                  } ${
                    isDark ? "hover:bg-gray-800/30" : "hover:bg-gray-100/50"
                  }`}
                >
                  <td className={`py-3 px-4 ${theme.text} text-sm truncate`}>
                    {event.event_name || "N/A"}
                  </td>
                  <td className={`py-3 px-4 ${theme.text} text-sm truncate`}>
                    {groupName}
                  </td>
                  <td className={`py-3 px-4 ${theme.text} text-sm truncate`}>
                    {event.event_subcategory || "N/A"}
                  </td>
                  <td className={`py-3 px-4 ${theme.text} text-sm truncate`}>
                    {formatDate(event)}
                  </td>
                  <td className={`py-3 px-4 ${theme.text} text-sm truncate`}>
                    {event.location || "N/A"}
                  </td>
                  <td className={`py-3 px-4 ${theme.text} text-sm truncate`}>
                    {event.event_type || "N/A"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button className="bg-[#00DEA3] text-black font-semibold text-sm px-8 py-2 rounded-full shadow-md hover:bg-[#00c591] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#00DEA3] focus:ring-opacity-50">
                        Run
                      </button>
                      <button className="bg-gray-500 w-12 h-12 flex items-center justify-center rounded-full shadow-md hover:bg-gray-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50">
                        <img src={ContactIcon} alt="Contact" className="w-8 h-8" />
                      </button>
                      <button className="bg-gray-500 w-12 h-12 flex items-center justify-center rounded-full shadow-md hover:bg-gray-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50">
                        <img src={FileIcon} alt="File" className="w-8 h-8" />
                      </button>
                    </div>
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

const ConfirmEvents = () => {
  const { user } = useSelector((state) => state.auth);
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [liveEventsCount, setLiveEventsCount] = useState(0);

  const handleCreateEvent = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const groupsData = await getGroups();
      const groupsArray = Array.isArray(groupsData) ? groupsData : [];
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, groupsData, liveEventsData] = await Promise.all([
          getMyEvents(),
          getGroups(),
          getMyLiveEvents(),
        ]);

        const eventsArray = eventsData?.tickets
          ? [].concat(eventsData.tickets)
          : [];
        setEvents(eventsArray);

        const groupsArray = Array.isArray(groupsData) ? groupsData : [];
        setGroups(groupsArray);

        setLiveEventsCount(liveEventsData?.tickets?.length || 0);
      } catch (e) {
        console.error("Error fetching data:", e);
        setEvents([]);
        setGroups([]);
        setLiveEventsCount(0);
      }
    };

    fetchData();
  }, []);

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

  const confirmedEventsCount = events.length;

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
              <div
                style={{
                  boxShadow: isDark
                    ? "inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)"
                    : "inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)",
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${theme.bg}`}
              >
                <img
                  src={NotificationIcon}
                  alt="Notification"
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

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
            <div>
              <h1 className={`text-3xl sm:text-4xl font-bold ${theme.text}`}>
                Confirm Events
              </h1>
              <p className={`${theme.subText} mt-2 text-base sm:text-lg`}>
                Review and manage everything related to events.
              </p>
            </div>
            <button
              onClick={handleCreateEvent}
              disabled={loading}
              style={{
                boxShadow: isDark
                  ? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)"
                  : "-4px -4px 8px rgba(255,255,255,0.9), 4px 4px 8px rgba(0,0,0,0.15)",
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 md:items-start gap-6 lg:gap-8 mb-8">
            <div className="md:col-span-1 w-full p-4">
              <MyGroupsCard theme={theme} groups={groups} isDark={isDark} />
            </div>
            <div
              style={{
                height: "240px",
                padding: "21px",
                gap: "20px",
              }}
              className={`w-full max-w-xs mx-auto xl:mr-0 grid grid-cols-2 items-center rounded-[50px] ${
                isDark ? theme.cardBg : "bg-[#f1f1f1]"
              } ${getNeumorphicShadows(isDark)}`}
            >
              <StatsCard
                isDark={isDark}
                theme={theme}
                className="w-full h-48"
                count={confirmedEventsCount}
                title="Total events"
                icon={<div className="text-yellow-400">
                  <PartyPopper className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
                </div>}
              />
              <StatsCard
                isDark={isDark}
                theme={theme}
                className="w-full h-48"
                count={liveEventsCount}
                title="Live events"
                icon={<div className="text-red-500 relative">
                  <Radio className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
                </div>}
              />
            </div>
            <div className="md:col-span-2">
              <BankAccountDetailsCard isDark={isDark} theme={theme} />
            </div>
          </div>

          <EventsList
            isDark={isDark}
            theme={theme}
            events={events}
            groups={groups}
          />
        </main>
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
export default ConfirmEvents;