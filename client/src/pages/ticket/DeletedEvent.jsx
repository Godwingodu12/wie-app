import React, { useState, useEffect, useMemo } from "react";
import { getMe } from "../../services/userService";
import { getAllDeletedEvents,getGroupView } from "../../services/ticketService.js";
import SideBar from "../../components/HomePage/SideBar.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import DeletedEventIcon from "../../assets/Event/DeletedEventIcon.svg";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import { Trash2, RotateCcw, Eye, Search, Trash } from "lucide-react";
import BottomNavigation from "../../components/HomePage/BottomNavigation.jsx";

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
  `}</style>
);

const DeletedEvent = () => {
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [deletedEvents, setDeletedEvents] = useState([]);
  const [groups, setGroups] = useState({}); // Store groups as an object with eventId as key
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

// Fetch group name for a specific event using ticketId
const fetchGroupName = async (ticketId) => {
  try {
    const response = await getGroupView(ticketId);
    console.log(`Group response for ticket ${ticketId}:`, response);
    return response?.group?.name || "N/A";
  } catch (error) {
    console.error(`Error fetching group for ticket ${ticketId}:`, error);
    return "N/A";
  }
};
const fetchDeletedEvents = async () => {
  setLoading(true);
  try {
    const response = await getAllDeletedEvents();
    console.log("Full API Response:", response);
    
    const eventsArray = response?.deletedEvents 
      || response?.data?.deletedEvents 
      || [];
    
    console.log("Extracted events array:", eventsArray);
    console.log("Number of events:", eventsArray.length);
    
    if (Array.isArray(eventsArray) && eventsArray.length > 0) {
      setDeletedEvents(eventsArray);
      
      // Fetch group names for all events using ticketId
      const groupPromises = eventsArray.map(async (event) => {
        console.log(`Fetching group for ticket: ${event._id}`);
        const groupName = await fetchGroupName(event._id);
        return { eventId: event._id, groupName };
      });
      
      const groupResults = await Promise.all(groupPromises);
      
      // Convert array to object for easy lookup
      const groupsObj = {};
      groupResults.forEach(({ eventId, groupName }) => {
        groupsObj[eventId] = groupName;
      });
      
      console.log("Final groups object:", groupsObj);
      setGroups(groupsObj);
    } else {
      setDeletedEvents([]);
    }
  } catch (error) {
    console.error("Error fetching deleted events:", error);
    
    if (error?.response?.status === 404) {
      console.log("No deleted events found (404)");
      setDeletedEvents([]);
    } else {
      setDeletedEvents([]);
    }
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchDeletedEvents();
  }, []);

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleDeleteAll = async () => {
    if (window.confirm("Are you sure you want to permanently delete ALL events? This action cannot be undone.")) {
      try {
        // Add your delete all API call here
        console.log("Deleting all events");
        // After successful delete, refresh the list
        await fetchDeletedEvents();
      } catch (error) {
        console.error("Error deleting all events:", error);
        alert("Failed to delete all events");
      }
    }
  };

  const handlePermanentDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to permanently delete this event? This action cannot be undone.")) {
      try {
        // Add your permanent delete API call here
        console.log("Permanently deleting event:", eventId);
        // After successful delete, refresh the list
        await fetchDeletedEvents();
      } catch (error) {
        console.error("Error permanently deleting event:", error);
        alert("Failed to delete event");
      }
    }
  };

  const handleRecover = async (eventId) => {
    if (window.confirm("Are you sure you want to recover this event?")) {
      try {
        // Add your recover API call here
        console.log("Recovering event:", eventId);
        // After successful recovery, refresh the list
        await fetchDeletedEvents();
      } catch (error) {
        console.error("Error recovering event:", error);
        alert("Failed to recover event");
      }
    }
  };

  const handleView = (eventId) => {
    // Navigate to event view page
    console.log("Viewing event:", eventId);
    window.location.href = `/ticket/previous-event/${eventId}`;
  };

const formatDate = (event) => {
  // Try multiple possible date field locations
  const dateString = event?.start_date 
    || event?.event_dates?.[0]?.start_date 
    || event?.createdAt;
  
  if (!dateString) {
    return "N/A";
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};

  const filteredEvents = useMemo(() => {
    if (!searchValue) return deletedEvents;
    return deletedEvents.filter((event) =>
      event.event_name?.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [deletedEvents, searchValue]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue]);

  const theme = isDark
    ? {
        bg: "bg-[#212426]",
        text: "text-white",
        subText: "text-[#c9c9cf]",
        cardBg: "bg-[#212426]",
        subCardBg: "bg-[#1c1e20]",
        border: "border-gray-700",
        notificationShadow: "inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)",
      }
    : {
        bg: "#f9f9f9",
        text: "text-gray-900",
        subText: "text-gray-600",
        cardBg: "#f2f2f2",
        subCardBg: "#f2f2f2",
        border: "border-gray-300",
        notificationShadow: "inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)",
      };

  return (
    <>
      <CustomScrollbarStyles />
      <div className={`${theme.bg} ${theme.text} min-h-screen flex overflow-hidden transition-colors duration-300`}>
        {/* Sidebar - Fixed */}
        <div 
          className="hidden md:flex flex-col flex-shrink-0 transition-colors duration-300"
          style={{ 
            position: 'fixed', 
            left: 0, 
            top: 0, 
            bottom: 0, 
            width: '80px',
            zIndex: 40,
            backgroundColor: isDark ? '#212426' : '#f9f9f9',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          <div className="flex items-center justify-center" style={{ height: HEADER_HEIGHT }}>
            <img src={WieLogo} alt="Wie Logo" className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <SideBar user={user} theme={theme} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 md:ml-20 lg:ml-20 overflow-x-hidden">
          {/* Top Header */}
          <header className="flex items-center justify-between px-3 md:px-4 lg:px-6 w-full overflow-hidden" style={{ height: HEADER_HEIGHT }}>
            <div className="flex items-center gap-4 w-full">
              <div className="flex-1 min-w-0">
                <SearchBar 
                  theme={theme}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-3 md:p-4 lg:p-6 overflow-y-auto overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              {/* Page Title and Delete All Button */}
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h1 className={`text-xl md:text-3xl font-bold ${theme.text}`}>
                  Deleted events
                </h1>
                {filteredEvents.length > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    className="px-4 py-2 rounded-full text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                    style={{
                      background: "linear-gradient(180deg, #991B1B 0%, #DC2626 100%)",
                    }}
                  >
                    <Trash className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete All</span>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center min-h-[500px]">
                  <div className="text-center">
                    <div className={`inline-block animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-purple-500' : 'border-purple-600'}`}></div>
                    <p className={`${theme.subText} mt-4`}>Loading deleted events...</p>
                  </div>
                </div>
              ) : filteredEvents.length === 0 ? (
                /* Empty State Card */
                <div 
                  className={`rounded-[2.5rem] p-8 md:p-16 flex flex-col items-center justify-center min-h-[500px] ${theme.cardBg}`}
                  style={{
                    boxShadow: isDark 
                      ? 'inset 5px 5px 10px #0d0e0f,inset -5px -5px 10px #353a3d'
                      : 'inset -5px -5px 10px #606060,inset 5px 5px 10px #ffffff'
                  }}
                >
                  <div className="relative mb-8 w-[140px] h-[160px]">
                    <img
                      src={DeletedEventIcon}
                      alt="DeletedEventIcon"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className={`${theme.text} text-center text-xl md:text-2xl`}>
                    {searchValue ? "No matching deleted events found" : "You have no deleted events"}
                  </p>
                </div>
              ) : (
                /* Events Table */
                <div
                  className={`rounded-[2.5rem] p-4 md:p-6 ${theme.cardBg}`}
                  style={{
                    boxShadow: isDark 
                      ? 'inset 5px 5px 10px #0d0e0f,inset -5px -5px 10px #353a3d'
                      : 'inset -5px -5px 10px #606060,inset 5px 5px 10px #ffffff'
                  }}
                >
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full table-fixed text-left">
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
                          <th className="py-4 px-4 font-bold text-sm md:text-base lg:text-lg w-[25%]">
                            <div className="flex items-center gap-2">
                              <span>Event Name</span>
                              <Search className="w-4 h-4" />
                            </div>
                          </th>
                          <th className="py-4 px-4 font-bold text-sm md:text-base lg:text-lg w-[15%]">
                            Group
                          </th>
                          <th className="py-4 px-4 font-bold text-sm md:text-base lg:text-lg w-[15%]">
                            Category
                          </th>
                          <th className="py-4 px-4 font-bold text-sm md:text-base lg:text-lg w-[12%]">
                            Date
                          </th>
                          <th className="py-4 px-4 font-bold text-sm md:text-base lg:text-lg w-[33%] text-center">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayEvents.map((event, index) => {
                          if (!event) {
                            return (
                              <tr key={`placeholder-${index}`}>
                                <td className="py-6 px-4 min-h-[78px]">&nbsp;</td>
                                <td className="py-6 px-4">&nbsp;</td>
                                <td className="py-6 px-4">&nbsp;</td>
                                <td className="py-6 px-4">&nbsp;</td>
                                <td className="py-6 px-4">&nbsp;</td>
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
                              } transition-colors min-h-[78px]`}
                            >
                              <td className={`py-6 px-4 ${theme.text} text-sm`}>
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-8 h-8 rounded-full flex-shrink-0 ${
                                      isDark ? "bg-red-500/20" : "bg-red-100"
                                    } flex items-center justify-center`}
                                  >
                                    <Trash2 className={`w-4 h-4 ${isDark ? "text-red-300" : "text-red-600"}`} />
                                  </div>
                                  <span className="truncate">{event.event_name || "N/A"}</span>
                                </div>
                              </td>
                              <td className={`py-6 px-4 ${theme.text} text-sm`}>
                                <div className="truncate">{groups[event._id] || "Loading..."}</div>
                              </td>
                              <td className={`py-6 px-4 ${theme.text} text-sm`}>
                                <div className="truncate">{event.event_category || event.event_type || "N/A"}</div>
                              </td>
                              <td className={`py-6 px-4 ${theme.text} text-sm`}>
                                <div className="truncate">{formatDate(event)}</div>
                              </td>
                              <td className="py-6 px-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleView(event._id)}
                                    className="px-4 py-2 rounded-full text-xs font-semibold text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1"
                                    style={{
                                      background: "linear-gradient(180deg, #1E40AF 0%, #3B82F6 100%)",
                                      minWidth: "70px",
                                    }}
                                    title="View Event"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleRecover(event._id)}
                                    className="px-4 py-2 rounded-full text-xs font-semibold text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1"
                                    style={{
                                      background: "linear-gradient(180deg, #15803D 0%, #22C55E 100%)",
                                      minWidth: "80px",
                                    }}
                                    title="Recover Event"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Recover
                                  </button>
                                  <button
                                    onClick={() => handlePermanentDelete(event._id)}
                                    className="px-4 py-2 rounded-full text-xs font-semibold text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1"
                                    style={{
                                      background: "linear-gradient(180deg, #991B1B 0%, #DC2626 100%)",
                                      minWidth: "70px",
                                    }}
                                    title="Permanently Delete"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {paginatedEvents.map((event, index) => (
                      <div
                        key={event._id || index}
                        className={`p-4 rounded-2xl ${
                          isDark ? "bg-gray-800/50" : "bg-white"
                        } shadow-md`}
                      >
                        <div className="flex items-start gap-3 mb-4">
                          <div
                            className={`w-10 h-10 rounded-full flex-shrink-0 ${
                              isDark ? "bg-red-500/20" : "bg-red-100"
                            } flex items-center justify-center`}
                          >
                            <Trash2 className={`w-5 h-5 ${isDark ? "text-red-300" : "text-red-600"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`${theme.text} font-semibold text-sm mb-2 truncate`}>
                              {event.event_name || "N/A"}
                            </h3>
                            <div className={`text-xs ${theme.subText} space-y-1`}>
                              <p className="truncate">
                                <span className="font-medium">Group:</span> {groups[event._id] || "Loading..."}
                              </p>
                              <p className="truncate">
                                <span className="font-medium">Category:</span> {event.event_category || event.event_type || "N/A"}
                              </p>
                              <p className="truncate">
                                <span className="font-medium">Date:</span> {formatDate(event)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => handleView(event._id)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold text-white shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-1"
                            style={{
                              background: "linear-gradient(180deg, #1E40AF 0%, #3B82F6 100%)",
                            }}
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleRecover(event._id)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold text-white shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-1"
                            style={{
                              background: "linear-gradient(180deg, #15803D 0%, #22C55E 100%)",
                            }}
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Recover</span>
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(event._id)}
                            className="px-3 py-2 rounded-lg text-xs font-semibold text-white shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-1"
                            style={{
                              background: "linear-gradient(180deg, #991B1B 0%, #DC2626 100%)",
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div 
                      className="flex justify-center mt-6 pt-4 border-t border-opacity-20" 
                      style={{ borderColor: isDark ? "#4a5568" : "#e2e8f0" }}
                    >
                      <div className="flex items-center gap-2">
                        {pages.map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-full text-sm font-medium transition-colors flex items-center justify-center ${
                              currentPage === page
                                ? "text-white shadow-lg"
                                : isDark
                                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                            style={
                              currentPage === page
                                ? { background: "linear-gradient(180deg, #1E1242 0%, #6942B8 100%)" }
                                : {}
                            }
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
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
export default DeletedEvent;