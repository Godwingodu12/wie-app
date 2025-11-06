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
  LiveEventBankDetails,
} from "../../services/ticketService";
import GroupViewModal from "../../components/CreateGroup/GroupViewModal";
import BottomNavigation from "../../components/HomePage/BottomNavigation.jsx";
import PlusIcon from "../../assets/HomePage/PlusIcon.svg";
import FilterButton from "../../components/HomePage/FilterButton.jsx";
import ShowArrow from "../../assets/Event/ShowArrow.png";
import HideArrow from "../../assets/Event/HideArrow.png";
import ViewConfirm from "../../assets/Event/ViewConfirm.png";
import { ChevronDown, PartyPopper, Radio, Search, Landmark } from "lucide-react";
import ProfileImage from "../../assets/PROFILEPAGE/ProfileImage.png";
import { getImageUrl } from "../../utils/imageUtils";
const getNeumorphicShadows = (isDark) =>
  isDark
    ? "shadow-[inset_5px_5px_10px_#1a1b1e,inset_-5px_-5px_10px_#3c3f44]"
    : "shadow-[inset_5px_5px_10px_#a4a4a4,inset_-5px_-5px_10px_#ffffff]";
const MyGroupsCard = ({ theme, groups, isDark }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupEventCount, setGroupEventCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);

  const handleGroupClick = async (group) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
    setLoadingCount(true);
    
    // Fetch event count for this specific group
    try {
      const eventsRes = await getMyEvents();
      
      // Handle different response structures
      let eventsArray = [];
      if (Array.isArray(eventsRes)) {
        eventsArray = eventsRes;
      } else if (eventsRes?.tickets) {
        eventsArray = Array.isArray(eventsRes.tickets) ? eventsRes.tickets : [];
      } else if (eventsRes?.data) {
        eventsArray = Array.isArray(eventsRes.data) ? eventsRes.data : [];
      }

      // Filter events that belong to this specific group
      const groupId = group._id || group.id;
      const filteredEvents = eventsArray.filter(event => 
        event.groupId === groupId || 
        event.group_id === groupId || 
        event.group === groupId ||
        event.group?._id === groupId ||
        event.group?.id === groupId
      );
      
      setGroupEventCount(filteredEvents.length);
    } catch (error) {
      console.error('Error fetching event count:', error);
      // Fallback to group's own count if available
      setGroupEventCount(group.totalEvents || group.events || 0);
    } finally {
      setLoadingCount(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGroup(null);
    setGroupEventCount(0);
  };

  const handleUpdateGroup = () => {
    console.log('Update group:', selectedGroup);
    // Add your update logic here
    // You might want to navigate to an edit page or open an edit modal
    // Example: navigate(`/group/edit/${selectedGroup._id}`);
    handleCloseModal();
  };

  return (
    <>
      <div className="h-full flex flex-col min-h-[180px]">
        <div className="flex items-center justify-between w-full mb-3 md:mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg md:text-xl font-semibold">My groups,</h3>
            <p className={`text-xs md:text-sm ${theme.subText}`}>
              {groups.length} groups
            </p>
          </div>
          {groups.length > 2 && (
            <button
              className={`text-xs md:text-sm ${theme.subText} hover:underline flex-shrink-0`}
            >
              See more
            </button>
          )}
        </div>
        <div className="flex flex-row items-center justify-start w-full gap-4 md:gap-6 flex-grow">
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
              <div 
                key={index} 
                className="flex flex-col items-center gap-2 cursor-pointer group"
                onClick={() => handleGroupClick(group)}
              >
                <div
                  className="relative w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-[58px] overflow-hidden flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                  style={{
                    boxShadow: isDark
                      ? "inset 6px 6px 12px 0px rgba(0,0,0,0.18), inset -6px -6px 12px 0px rgba(255,255,255,0.08)"
                      : "inset 6px 6px 12px 0px rgba(0,0,0,0.18), inset -6px -6px 12px 0px rgba(255,255,255,0.08)",
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={group.company_logo}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = ProfileImage;
                    }}
                  />
                </div>
                <p
                  className={`font-medium text-xs md:text-sm ${theme.text} text-center max-w-[100px] truncate group-hover:underline`}
                >
                  {group.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      {/* Group View Modal */}
      <GroupViewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        group={selectedGroup}
        isDark={isDark}
        theme={theme}
        onUpdate={handleUpdateGroup}
        totalEvents={groupEventCount}
        loadingCount={loadingCount}
      />
    </>
  );
};
const StatsCard = ({ count, title, isDark, theme, className, icon, isMobile = false }) => {
  if (isMobile) {
    return (
      <div
        style={{
          width: "48%", // Takes 48% of container width
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
        width: "48%", // Takes 48% of container width
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
      <p className={`text-2xl lg:text-3xl font-semibold ${theme.text}`}>
        {count}
      </p>
      <p className={`text-[10px] lg:text-xs text-center leading-tight ${theme.subText}`}>
        {title}
      </p>
    </div>
  );
};
function BankAccountDetailsCard({ isDark, theme }) {
  const [bankDetails, setBankDetails] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        setLoading(true);
        const response = await LiveEventBankDetails();
        if (response?.bankDetails && response.bankDetails.length > 0) {
          setBankDetails(response.bankDetails);
        }
      } catch (error) {
        console.error("Error fetching bank details:", error);
        setBankDetails([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBankDetails();
  }, []);

  const currentAccount = bankDetails[currentIndex];
  const handleSeeAll = () => {
    navigate(`/ticket/bank-details`);
  };
  const handleNext = () => {
    if (currentIndex < bankDetails.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <div
        className={`w-full rounded-[50px] p-4 sm:p-6 font-sans ${
          theme.cardBg
        } ${getNeumorphicShadows(isDark)} flex items-center justify-center`}
        style={{ minHeight: "200px" }}
      >
        <p className={`${theme.subText}`}>Loading bank details...</p>
      </div>
    );
  }

  if (!currentAccount || bankDetails.length === 0) {
    return (
      <div
        className={`w-full rounded-[50px] p-4 sm:p-6 font-sans ${
          theme.cardBg
        } ${getNeumorphicShadows(isDark)} flex items-center justify-center`}
        style={{ minHeight: "200px" }}
      >
        <p className={`${theme.subText}`}>No Live Event bank account details available</p>
      </div>
    );
  }

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
              ({currentAccount.event_name})
            </span>
          </h1>
        </div>
        {bankDetails.length > 1 && (
          <button
            onClick={handleSeeAll}
            className="whitespace-nowrap text-xs sm:text-sm font-semibold text-purple-600 border border-purple-300 rounded-full px-4 py-1.5 sm:px-5 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors duration-300"
          >
            see all
          </button>
        )}
      </header>

      {/* Card Body with Details */}
      <main className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium ${theme.subText}`}>
            Account holder :
          </p>
          <p
            className={`text-sm ${theme.text} ${
              isDark ? "bg-gray-700" : "bg-gray-500"
            } text-white rounded-md px-3 py-1 shadow-sm truncate max-w-[200px]`}
          >
            {currentAccount.bank_acc_holder || "N/A"}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium ${theme.subText}`}>
            Account type :
          </p>
          <p
            className={`text-sm ${theme.text} ${
              isDark ? "bg-gray-700" : "bg-gray-500"
            } text-white rounded-md px-3 py-1 shadow-sm truncate max-w-[200px]`}
          >
            {currentAccount.bank_acc_type || "N/A"}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium ${theme.subText}`}>IFSC code :</p>
          <p
            className={`text-sm ${theme.text} ${
              isDark ? "bg-gray-700" : "bg-gray-500"
            } text-white rounded-md px-3 py-1 shadow-sm truncate max-w-[200px]`}
          >
            {currentAccount.bank_ifsc || "N/A"}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium ${theme.subText}`}>
            Account number :
          </p>
          <p
            className={`text-sm ${theme.text} ${
              isDark ? "bg-gray-700" : "bg-gray-500"
            } text-white rounded-md px-3 py-1 shadow-sm truncate max-w-[200px]`}
          >
            {currentAccount.bank_acc_no || "N/A"}
          </p>
        </div>
      </main>

      {/* Card Footer/Pagination indicator */}
      <footer className="flex justify-center items-center gap-3 mt-6">
        {bankDetails.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`text-xs ${
                currentIndex === 0
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:opacity-80 cursor-pointer"
              } ${theme.text}`}
            >
              ←
            </button>
            <div className="flex gap-2">
              {bankDetails.map((_, index) => (
                <div
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-colors ${
                    index === currentIndex
                      ? isDark
                        ? "bg-purple-500"
                        : "bg-purple-600"
                      : isDark
                      ? "bg-gray-600"
                      : "bg-gray-400"
                  }`}
                ></div>
              ))}
            </div>
            <button
              onClick={handleNext}
              disabled={currentIndex === bankDetails.length - 1}
              className={`text-xs ${
                currentIndex === bankDetails.length - 1
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:opacity-80 cursor-pointer"
              } ${theme.text}`}
            >
              →
            </button>
          </>
        )}
        {bankDetails.length === 1 && (
          <div
            className={`w-2.5 h-2.5 ${
              isDark ? "bg-purple-500" : "bg-purple-600"
            } rounded-full`}
          ></div>
        )}
      </footer>
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
    setExpandedRows(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const filteredEvents = useMemo(() => {
    let filtered = events || [];

    if (activeFilter === "Paid") {
      filtered = filtered.filter(
        (event) => event.ticket_types && event.ticket_types.length > 0
      );
    } else if (activeFilter === "Free") {
      filtered = filtered.filter(
        (event) => !event.ticket_types || event.ticket_types.length === 0
      );
    }

    if (selectedCategory && selectedCategory !== "All") {
      filtered = filtered.filter(
        (event) => event.event_category === selectedCategory
      );
    }

    if (searchTerm) {
      filtered = filtered.filter((event) =>
        event.event_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [events, activeFilter, searchTerm, selectedCategory]);

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
      <div className="flex-1 lg:overflow-auto lg:[&::-webkit-scrollbar]:w-2 lg:[&::-webkit-scrollbar-track]:bg-transparent lg:[&::-webkit-scrollbar-thumb]:rounded-full lg:[&::-webkit-scrollbar-thumb]:bg-gray-300 lg:hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:lg:[&::-webkit-scrollbar-thumb]:bg-gray-600 dark:lg:hover:[&::-webkit-scrollbar-thumb]:bg-gray-500">
        {/* Mobile Only View */}
        <div className="flex flex-col sm:hidden">
          <div className="relative mb-6 mt-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`w-[31px] h-[31px] rounded-[17.1px] flex items-center justify-center flex-shrink-0 ${
                  isDark ? 'bg-[#232426]' : 'bg-[#f1f1f1]'
                }`}
                style={{
                  boxShadow: isDark
                    ? '3.21px 3.21px 6.41px 0px #0000002E inset, -3.21px -3.21px 6.41px 0px #FFFFFF14 inset'
                    : '3.21px 3.21px 6.41px 0px #0000002E inset, -3.21px -3.21px 6.41px 0px #FFFFFF14 inset'
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
              <div
                className={`flex-1 flex items-center gap-2 ${
                  isDark ? 'bg-[#232426]' : 'bg-[#f1f1f1]'
                }`}
                style={{
                  maxWidth: '300px',
                  height: '31px',
                  borderRadius: '17.1px',
                  padding: '8.55px',
                  boxShadow: isDark
                    ? '3.21px 3.21px 6.41px 0px #0000002E inset, -3.21px -3.21px 6.41px 0px #FFFFFF14 inset'
                    : '3.21px 3.21px 6.41px 0px #0000002E inset, -3.21px -3.21px 6.41px 0px #FFFFFF14 inset'
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
                    isDark ? 'placeholder-gray-500' : 'placeholder-gray-400'
                  }`}
                />
              </div>
            </div>

            {showFilter && (
              <div className="absolute top-14 left-0 z-50">
                <FilterButton />
              </div>
            )}
          </div>

          <div
            className={`${isDark ? 'bg-[#232426]' : 'bg-[#f1f1f1]'}`}
            style={{
              width: '100%',
              maxWidth: '344px',
              minHeight: filteredEvents.length === 0 ? 'auto' : '200px',
              borderRadius: '24px',
              padding: '32px 24px',
              boxShadow: isDark
                ? '6px 6px 12px 0px #0000002E inset, -6px -6px 12px 0px #FFFFFF14 inset'
                : '6px 6px 12px 0px #0000002E inset, -6px -6px 12px 0px #FFFFFF14 inset'
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
                    No live events found
                  </p>
                  <p className="text-sm">Your live events will appear here</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {paginatedEvents.map((event, index) => {
                  const isExpanded = expandedRows[event._id];
                  
                  return (
                    <div key={event._id || index} className="flex flex-col gap-4">
                      <div
                        className="flex items-center justify-between"
                        style={{
                          width: '100%',
                          maxWidth: '294px',
                          height: '30px'
                        }}
                      >
                        <p className={`${theme.text} font-medium text-sm truncate flex-1`}>
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

                      {isExpanded && (
                        <div
                          className="flex flex-col gap-5"
                          style={{
                            width: '100%',
                            maxWidth: '294px',
                            minHeight: '202px'
                          }}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <span className={`text-xs ${theme.subText}`}>Category:</span>
                              <span className={`text-xs ${theme.text} font-medium`}>
                                {event.event_category || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-xs ${theme.subText}`}>Sub Category:</span>
                              <span className={`text-xs ${theme.text} font-medium`}>
                                {event.event_subcategory || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-xs ${theme.subText}`}>Start Date:</span>
                              <span className={`text-xs ${theme.text} font-medium`}>
                                {formatDate(event)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-xs ${theme.subText}`}>Location:</span>
                              <span className={`text-xs ${theme.text} font-medium truncate max-w-[150px]`}>
                                {event.venue || event.location_type || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-xs ${theme.subText}`}>Status:</span>
                              <span className={`text-xs text-red-500 font-medium flex items-center gap-1`}>
                                <Radio className="w-3 h-3" />
                                LIVE
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 justify-start">
                            <button className="bg-[#00DEA3] text-black font-semibold text-xs px-4 py-2 rounded-full shadow-md hover:bg-[#00c591] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#00DEA3] focus:ring-opacity-50">
                              Manage
                            </button>
                            <button onClick={() =>
                        navigate(`/ticket/live-event-view/${event._id}`)
                      } className="bg-[#7D7D7D] w-10 h-10 flex items-center justify-center rounded-full shadow-md hover:bg-gray-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50">
                              <img
                                src={ViewConfirm}
                                alt="ViewConfirm"
                                className="w-4 h-4 object-contain"
                              />
                            </button>
                          </div>
                        </div>
                      )}

                      {index < paginatedEvents.length - 1 && (
                        <div className={`h-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tablet/Desktop View */}
        <div className="hidden sm:block">
          <div className="flex lg:hidden mb-4">
            <div className="flex items-center justify-between w-full">
              {!isSearchActive ? (
                <button 
                  className={`flex items-center gap-2 px-4 py-3 rounded-[32px] ${
                    isDark ? theme.cardBg : "bg-[#f1f1f1]"
                  } ${getNeumorphicShadows(isDark)}`}
                  onClick={() => setIsSearchActive(true)}
                >
                  <Search className={`w-4 h-4 ${theme.subText}`} />
                  <span className={`text-sm font-bold ${theme.text}`}>Event</span>
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
              <span className={`text-sm font-bold ${theme.text} mr-1`}>Actions</span>
            </div>
          </div>

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
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-3 flex-[3] min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex-shrink-0 bg-red-500/20 flex items-center justify-center text-red-500`}
                      >
                        <Radio className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`${theme.text} truncate font-semibold text-sm`}>
                          {event.event_name}
                        </span>
                        <span className={`text-xs text-red-500 truncate flex items-center gap-1`}>
                          <Radio className="w-3 h-3" />
                          LIVE
                        </span>
                      </div>
                    </div>
                    <div className="flex-[1.5] min-w-0 flex justify-center">
                      <span
                        className={`${theme.text} truncate text-sm block`}
                        style={{ marginLeft: "-150px" }} 
                      >
                        {event.event_category || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                      <button
                        className={`px-3 sm:px-4 py-1.5 border border-[#6549B8] rounded-full text-xs sm:text-sm transition-colors whitespace-nowrap ${
                          isDark
                            ? "text-white hover:bg-[#6549B8]"
                            : "text-[#6549B8] hover:bg-[#6549B8] hover:text-white"
                        }`}
                      >
                        Manage
                      </button>
                      <button
                      onClick={() =>
                        navigate(`/ticket/live-event-view/${event._id}`)
                      }
                        className={`px-3 sm:px-4 py-1.5 border border-[#6549B8] rounded-full text-xs sm:text-sm transition-colors whitespace-nowrap ${
                          isDark
                            ? "text-white hover:bg-[#6549B8]"
                            : "text-[#6549B8] hover:bg-[#6549B8] hover:text-white"
                        }`}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <table className="hidden lg:table w-full table-auto text-left">
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
                      onClick={() => setCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="flex items-center justify-between w-full"
                    >
                      <span>{selectedCategory === "All" ? "Category" : selectedCategory}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {isCategoryDropdownOpen && (
                      <div className={`absolute z-50 mt-2 w-56 rounded-2xl p-2 ring-1 ring-opacity-5 top-full left-0 ${
                        isDark ? "bg-[#232426] ring-gray-600" : "bg-slate-100 ring-gray-400"
                      }`} style={{
                        boxShadow: isDark
                          ? "8px 8px 12px rgba(0,0,0,0.4), -8px -8px 12px rgba(255,255,255,0.05)"
                          : "8px 8px 12px #00000029, -8px -8px 12px #FFFFFF0A"
                      }}>
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
                                  ? isDark ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-900"
                                  : isDark ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-200"
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
                    <span>Live Status</span>
                    <Radio className="w-4 h-4 text-red-500" />
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
                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                          <Radio className="w-4 h-4" />
                        </div>
                        <span className={`${theme.text} text-sm truncate`}>
                          {event.event_name}
                        </span>
                      </div>
                    </td>
                    <td className={`py-3 px-4 ${theme.text} text-sm truncate`}>
                      {event.event_category ? event.event_category : "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-red-500 text-sm font-medium flex items-center gap-2">
                        <Radio className="w-4 h-4" />
                        LIVE
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        className={`px-4 py-1.5 border border-[#6549B8] rounded-full text-sm transition-colors ${
                          isDark
                            ? "text-white hover:bg-[#6549B8]"
                            : "text-[#6549B8] hover:bg-[#6549B8] hover:text-white"
                        }`}
                      >
                        Manage
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                      onClick={() =>
                        navigate(`/ticket/live-event-view/${event._id}`)
                      }
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

const LiveEvent = () => {
  const { user } = useSelector((state) => state.auth);
  const [isDark, setIsDark] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [liveEvents, setLiveEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [confirmedEventsCount, setConfirmedEventsCount] = useState(0);

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
          (event) => event.event_status === "confirmed"
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

const liveEventsCount = liveEvents.length;

return (
  <>
    <style>{`
      /* Scrollbar styling */
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
      {/* Sidebar (Desktop only) */}
      <div className={`hidden md:flex flex-col flex-shrink-0 nest-hub-sidebar ${theme.bg}`}>
        <div className="flex items-center justify-center" style={{ height: 72 }}>
          <img src={WieLogo} alt="Wie Logo" className="w-12 h-12" />
        </div>
        <div className="flex-1 sidebar-content">
          <SideBar user={user} theme={theme} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-full overflow-hidden md:ml-4">
        <header
          className="flex items-center justify-between px-4 md:px-6 flex-shrink-0"
          style={{ height: 72 }}
        >
          {/* Mobile Header */}
          <div className="flex md:hidden items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <img src={WieLogo} alt="WIE Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
            </div>
          </div>

          {/* Desktop Header */}
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-32 md:pb-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
            <div>
              <h1 className={`text-3xl sm:text-4xl font-bold ${theme.text} flex items-center gap-3`}>
                <Radio className="w-8 h-8 text-red-500" />
                Live Events
              </h1>
              <p className={`${theme.subText} mt-2 text-base sm:text-lg`}>
                Manage and monitor your live events in real-time.
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
              className={`hidden md:flex flex-1 md:flex-none items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition h-12 ${theme.bg} ${theme.text} ${
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

          {/* Stats + Table Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 md:items-start gap-6 lg:gap-8 mb-8">
            <div className="md:col-span-1 w-full p-4">
              <MyGroupsCard theme={theme} groups={groups} isDark={isDark} />
            </div>

            <div className="w-full flex items-center justify-center">
              {/* Mobile Stats */}
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
                    count={liveEventsCount}
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

              {/* Desktop Stats */}
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
                    title="Confirmed events"
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
                    count={liveEventsCount}
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

            <div className="md:col-span-2">
              <BankAccountDetailsCard isDark={isDark} theme={theme} />
            </div>
          </div>

          <EventsList
            isDark={isDark}
            theme={theme}
            events={liveEvents}
            groups={groups}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
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
export default LiveEvent;