import React, { useState, useEffect, useRef } from "react";
import { getMe } from "../../services/userService";
import { findAllActiveUsers } from "../../services/authService";
import { useNavigate, Link } from 'react-router-dom';
import { getGroups, getMyEvents, getMyLiveEvents, getMyPastEvents } from "../../services/ticketService";
import { useDispatch } from 'react-redux';
import { logoutSuccess } from '../../features/auth/authSlice'; 
import { logout } from '../../services/authService';

import SideBar from "../../components/HomePage/SideBar.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";

import WieLogo from "../../assets/HomePage/WieLogo.svg";
import WieText from "../../assets/HomePage/WieText.svg";
import NotificationIcon from "../../assets/HomePage/NotificationIcon.svg";
import ChatIcon from "../../assets/HomePage/ChatIcon.svg";

import PlusIcon from "../../assets/PROFILEPAGE/PlusIcon.svg";
import EventIcon from "../../assets/PROFILEPAGE/EventIcon.svg";
import FollowersIcon from "../../assets/PROFILEPAGE/FollowersIcon.svg";
import FollowingIcon from "../../assets/PROFILEPAGE/FollowingIcon.svg";
import HandburgerIcon from "../../assets/PROFILEPAGE/HandburgerIcon.svg";
import VerifiedIcon from "../../assets/PROFILEPAGE/VerifiedIcon.svg"
import AllEventsIcon from "../../assets/PROFILEPAGE/AllEventsIcon.svg";
import LiveEventIcon from "../../assets/PROFILEPAGE/LiveEventIcon.svg";
import PastEventIcon from "../../assets/PROFILEPAGE/PastEventIcon.svg";
import LikeIcon from "../../assets/PROFILEPAGE/LikeIcon.svg";
import SendIcon from "../../assets/PROFILEPAGE/SendIcon.svg";
import CameraICon from "../../assets/PROFILEPAGE/CameraIcon.svg";
import RightArrowIcon from "../../assets/PROFILEPAGE/RightArrowIcon.svg";
// Bottom Nav Icons
import HomeIcon from "../../assets/HomePage/HomeIcon.svg";
import TicketIcon from "../../assets/HomePage/TicketIcon.svg";
import SpeakerIcon from "../../assets/HomePage/SpeakerIcon.svg";

const HEADER_HEIGHT = 72;

// Custom scrollbar styles
const CustomScrollbarStyles = () => (
  <style>{`
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
  `}</style>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  
  // Separate state for different event types
  const [allEvents, setAllEvents] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Active tab state: 'all', 'live', 'past'
  const [activeTab, setActiveTab] = useState('all');
  
  // State for hamburger menu dropdown
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const hamburgerRef = useRef(null);

  // Helper function to parse API response and extract tickets/events
  const parseApiResponse = (response, dataType = 'events') => {    
    let data = [];
    // Try different response structures
    if (response?.data?.tickets) {
      data = response.data.tickets;
    } else if (response?.tickets) {
      data = response.tickets;
    } else if (response?.data?.events) {
      data = response.data.events;
    } else if (response?.events) {
      data = response.events;
    } else if (Array.isArray(response?.data)) {
      data = response.data;
    } else if (Array.isArray(response)) {
      data = response;
    } else if (response?.data && typeof response.data === 'object') {
      // If response.data is an object, try to extract events from it
      const dataKeys = Object.keys(response.data);
      const eventKey = dataKeys.find(key => 
        Array.isArray(response.data[key]) || 
        key.toLowerCase().includes('event') ||
        key.toLowerCase().includes('ticket')
      );
      if (eventKey && Array.isArray(response.data[eventKey])) {
        data = response.data[eventKey];
      }
    }
    return Array.isArray(data) ? data : [];
  };
  // Helper function to categorize events based on dates and status
  const categorizeEvents = (tickets) => {
    const now = new Date();
    const all = [];
    const live = [];
    const past = [];

    tickets.forEach(ticket => {
      // Add to all events regardless
      all.push(ticket);

      // Check if event has date fields to categorize
      const eventDate = ticket.event_date || ticket.eventDate || ticket.date;
      const eventEndDate = ticket.event_end_date || ticket.eventEndDate || ticket.endDate;
      const eventStatus = ticket.status || ticket.eventStatus;

      if (eventDate) {
        const startDate = new Date(eventDate);
        const endDate = eventEndDate ? new Date(eventEndDate) : startDate;

        // Live events: currently happening (between start and end date)
        if (startDate <= now && endDate >= now) {
          live.push(ticket);
        }
        // Past events: end date has passed
        else if (endDate < now) {
          past.push(ticket);
        }
      } else if (eventStatus) {
        // Fallback: use status if no dates
        if (eventStatus.toLowerCase() === 'live' || eventStatus.toLowerCase() === 'active') {
          live.push(ticket);
        } else if (eventStatus.toLowerCase() === 'completed' || eventStatus.toLowerCase() === 'ended') {
          past.push(ticket);
        }
      }
    });

    return { all, live, past };
  };

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

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await findAllActiveUsers();        
        if (response?.data?.users) {
          setUsers(response.data.users);
        } else if (response?.users) {
          setUsers(response.users);
        } else if (Array.isArray(response?.data)) {
          setUsers(response.data);
        } else if (Array.isArray(response)) {
          setUsers(response);
        } else {
          console.log("Unexpected response format:", response);
          setUsers([]);
        }
      } catch (err) {
        console.error("Failed to fetch active users:", err);
        setUsers([]);
      }
    };
    fetchActiveUsers();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      setGroupsLoading(true);
      try {
        const response = await getGroups();        
        if (response?.data) {
          setGroups(Array.isArray(response.data) ? response.data : []);
        } else if (Array.isArray(response)) {
          setGroups(response);
        } else {
          console.log("Unexpected groups response format:", response);
          setGroups([]);
        }
      } catch (err) {
        console.error("Failed to fetch groups:", err);
        setGroups([]);
      } finally {
        setGroupsLoading(false);
      }
    };
    fetchGroups();
  }, []);

  // Fetch all events - Updated to handle tickets response
  useEffect(() => {
    const fetchAllEvents = async () => {
      setEventsLoading(true);
      try {
        const response = await getMyEvents();        
        const tickets = parseApiResponse(response, 'tickets');
        
        if (tickets.length > 0) {
          const { all, live, past } = categorizeEvents(tickets);
          setAllEvents(all);
          setLiveEvents(live);
          setPastEvents(past);
        } else {
          console.log("No tickets found in response");
          setAllEvents([]);
          setLiveEvents([]);
          setPastEvents([]);
        }
      } catch (err) {
        console.error("Failed to fetch all events:", err);
        setAllEvents([]);
        setLiveEvents([]);
        setPastEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchAllEvents();
  }, []);

  // Optional: Fetch live events separately if you have separate endpoints
  useEffect(() => {
    const fetchLiveEvents = async () => {
      try {
        const response = await getMyLiveEvents();        
        const events = parseApiResponse(response, 'live events');
        // Only update if this endpoint returns different data
        if (events.length > 0 && liveEvents.length === 0) {
          setLiveEvents(events);
        }
      } catch (err) {
        console.error("Failed to fetch live events:", err);
        // Don't reset liveEvents here as it might be populated from categorizeEvents
      }
    };
    
    // Only fetch if we don't have live events from the main fetch
    if (liveEvents.length === 0) {
      fetchLiveEvents();
    }
  }, [liveEvents.length]);

  // Optional: Fetch past events separately if you have separate endpoints
  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        const response = await getMyPastEvents();        
        const events = parseApiResponse(response, 'past events');
        if (events.length > 0 && pastEvents.length === 0) {
          setPastEvents(events);
        }
      } catch (err) {
        console.error("Failed to fetch past events:", err);
      }
    };
    
    // Only fetch if we don't have past events from the main fetch
    if (pastEvents.length === 0) {
      fetchPastEvents();
    }
  }, [pastEvents.length]);

  // Close hamburger menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (hamburgerRef.current && !hamburgerRef.current.contains(event.target)) {
        setShowHamburgerMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      dispatch(logoutSuccess());
      localStorage.clear();
      navigate("/login");
    }
  };

  const handleHamburgerClick = () => {
    setShowHamburgerMenu(!showHamburgerMenu);
  };

  // Get current events based on active tab
  const getCurrentEvents = () => {
    switch (activeTab) {
      case 'live':
        return liveEvents;
      case 'past':
        return pastEvents;
      default:
        return allEvents;
    }
  };

  const theme = isDark
    ? {
        bg: "bg-[#212426]",
        text: "text-white",
        subText: "text-[#c9c9cf]",
        cardBg: "bg-[#212426]",
        subCardBg: "bg-[#1c1e20]",
        border: "border-gray-700",
        buttonBg: "bg-gradient-to-b from-[#3a3b3f] to-[#2c2d30]",
        buttonShadow: "shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)]",
        cardShadow: "7px 7px 14px #1c1f20,-7px -7px 14px #26292c",
        smallCardShadow: "7px 7px 14px #1c1f20,-7px -7px 14px #26292c",
        buttonHoverBg: "hover:bg-gray-700",
        notificationShadow: "inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)",
      }
    : {
        bg: "#f9f9f9",
        text: "text-gray-900",
        subText: "text-gray-600",
        cardBg: "#f2f2f2",
        subCardBg: "#f2f2f2",
        border: "border-gray-300",
        buttonBg: "bg-gradient-to-b from-gray-100 to-gray-200",
        buttonShadow: "shadow-md hover:shadow-lg",
        cardShadow: "8px 8px 24px rgba(0,0,0,0.1), -8px -8px 24px rgba(255,255,255,0.8)",
        smallCardShadow: "6px 6px 12px #6a6a6a,-6px -6px 12px #ffffff",
        buttonHoverBg: "hover:bg-gray-100",
        notificationShadow: "inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)",
      };

  const displayName = user?.name || "User";

  // Group Selection Modal Component
  const GroupSelectionModal = () => (
    isModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`${theme.cardBg} rounded-2xl p-6 m-4 max-w-md w-full max-h-[80vh] overflow-y-auto`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>Select a Group</h3>
          <div className="space-y-3">
            {groups.map((group) => (
              <button
                key={group._id}
                onClick={() => {
                  setIsModalOpen(false);
                  navigate(`/ticket/create-event/${group._id}`);
                }}
                className={`w-full text-left p-3 rounded-lg border ${theme.border} ${theme.buttonHoverBg} transition-colors duration-200`}
              >
                <div className="flex items-center gap-3">
                  {group.image ? (
                    <img 
                      src={group.image}
                      alt={group.name || group.groupName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {(group.name || group.groupName || 'G')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className={`font-medium ${theme.text}`}>
                    {group.name || group.groupName || 'Group'}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className={`mt-4 w-full py-2 rounded-lg ${theme.border} border ${theme.text} ${theme.buttonHoverBg} transition-colors duration-200`}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  );

  const BottomNavigation = () => (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[95%] md:hidden">
      <div className={`flex justify-around items-center py-3 px-4 rounded-full ${theme.cardBg} ${theme.border} ${isDark ? 'shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(60,60,60,0.3)]' : 'shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.8)]'}`}>
        {[
          { to: "/home", icon: HomeIcon, label: "Home" }, 
          { to: "/ticket/events", icon: TicketIcon, label: "Tickets" }, 
          { icon: PlusIcon, label: "Create", special: true }, 
          { to: "/ticket/live-events", icon: SpeakerIcon, label: "Live Events" }, 
          { to: "/profile", label: "Profile", profile: true, isActive: true },
        ].map(({ to, icon, label, special, profile, isActive }) => 
          special ? (
            <div key={label} className="relative">
              <button 
                onClick={handleCreateEvent} 
                disabled={loading} 
                style={{ 
                  boxShadow: isDark ? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)" : "-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)", 
                }} 
                className="w-8 h-8 rounded-full bg-[#21d18b] flex items-center justify-center transition hover:scale-105"
              >
                <img src={icon} alt="Create" className="w-6 h-6 invert brightness-0" />
              </button>
            </div>
          ) : (
            <Link key={label} to={to} className="flex items-center justify-center p-2">
              {profile ? (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${isActive ? (isDark ? 'bg-[#212426] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.6),inset_-3px_-2px_6px_rgba(255,255,255,0.15)]' : 'bg-white border border-gray-300 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]') : 'bg-[#6a47fa]'}`}>
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#6a47fa] flex items-center justify-center text-white font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <div className="w-8 h-8 flex items-center justify-center">
                  <img src={icon} alt={label} className={`w-5 h-5 ${isDark ? 'filter brightness-0 invert' : 'filter brightness-0'}`} />
                </div>
              )}
            </Link>
          )
        )}
      </div>
    </nav>
  );

  // Hamburger Menu Component
  const HamburgerMenu = ({ isDesktop = false }) => (
    <div className="relative" ref={hamburgerRef}>
      <button 
        onClick={handleHamburgerClick}
        className={`${isDesktop ? 'p-2' : 'p-2'} rounded-full transition-colors duration-200 ${theme.buttonHoverBg}`}
      >
        <img 
          src={HandburgerIcon} 
          alt="Menu" 
          className={`${isDesktop ? 'w-8 h-8' : 'w-6 h-6'} ${!isDark ? 'filter brightness-0' : ''}`} 
        />
      </button>
      
      {showHamburgerMenu && (
        <div 
          className={`absolute ${isDesktop ? 'right-0 top-12' : 'right-0 top-10'} z-50 ${theme.cardBg} rounded-lg ${theme.border} min-w-[150px] py-2`}
          style={{ boxShadow: theme.smallCardShadow }}
        >
          <button
            onClick={handleLogout}
            className={`w-full text-left px-4 py-2 text-sm ${theme.text} hover:bg-red-50 hover:text-red-600 transition-colors duration-200 ${isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <CustomScrollbarStyles />
      <div className={`${theme.bg} ${theme.text} min-h-screen flex overflow-hidden transition-colors duration-300`}>
        {/* Sidebar */}
        <div className={`hidden md:flex flex-col flex-shrink-0 ${theme.bg} transition-colors duration-300`}>
          <div className="flex items-center justify-center" style={{ height: HEADER_HEIGHT }}>
            <img src={WieLogo} alt="Wie Logo" className="w-10 h-10 lg:w-12 lg:h-12" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <SideBar user={user} theme={theme} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1">
          {/* Top Header */}
          <header className="flex items-center justify-between px-4 md:px-6" style={{ height: HEADER_HEIGHT }}>
            {/* Mobile Header */}
            <div className="flex md:hidden items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <img src={WieLogo} alt="WIE Logo" className="w-8 h-8 object-contain" />
                <img src={WieText} alt="WIE" className="h-5 object-contain" />
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div 
                    style={{ 
                      boxShadow: isDark ? 'inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)' : 'inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)' 
                    }} 
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.bg}`}
                  >
                    <img src={NotificationIcon} alt="Notification" className={`w-4 h-4 ${isDark ? 'filter brightness-0 invert' : 'filter brightness-0'}`} />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">12</span>
                </div>
                <button 
                  style={{ 
                    boxShadow: isDark ? 'inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)' : 'inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)' 
                  }} 
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.bg}`}
                >
                  <img src={ChatIcon} alt="chats" className={`w-6 h-6 ${isDark ? 'filter brightness-0 invert' : 'filter brightness-0'}`} />
                </button>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:flex items-center gap-4 w-full">
              <div className="flex-1 min-w-0">
                <SearchBar 
                  theme={theme}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div 
                    style={{ boxShadow: theme.notificationShadow }} 
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${theme.bg} transition-colors duration-300`}
                  >
                    <img src={NotificationIcon} alt="Notification" className={`w-4 h-4 ${isDark ? 'filter brightness-0 invert' : 'filter brightness-0'}`} />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">12</span>
                </div>
                <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-y-auto pb-24 md:pb-4">
            <div className="max-w-6xl mx-auto space-y-6">
              {user && (
                <>
                  {/* Profile Card - Mobile: Stack vertically, Desktop: Keep original */}
                  <div className={`rounded-[3rem] p-6 mt-8 ${theme.cardBg} transition-all duration-300`} style={{boxShadow: theme.cardShadow}}>
                    {/* Mobile Layout */}
                    <div className="flex md:hidden flex-col items-center text-center space-y-4">
                      <img 
                        src={`${import.meta.env.VITE_AUTH_API_BASE_URL}/uploads/${user.image}`}
                        alt="Profile"
                        className={`w-24 h-24 rounded-full object-cover border-4 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                      />   
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <h1 className={`text-xl font-bold ${theme.text}`}>{user.name}</h1>
                          <img src={VerifiedIcon} alt="Verified" className="w-4 h-4" />
                        </div>
                        <p className={`text-sm ${theme.subText}`}>@{user.username}</p>
                      </div>
                      <p className={`text-sm leading-6 ${theme.subText} px-4 text-center`}>
                        {user.bio || "🌟 Exploring the world, one flight at a time ✈️\n📍 Currently: [Location]\n🎥 Capturing moments that matter"} 
                      </p>
                      {/* Stats for mobile */}
                      <div className={`rounded-[2rem] px-6 py-4 flex gap-6 transition-all duration-300 ${theme.cardBg}`} style={{boxShadow: theme.smallCardShadow}}>
                        <div className="text-center flex flex-col items-center gap-1.5">
                          <img src={EventIcon} alt="Event" className={`w-5 h-5 ${!isDark ? 'filter brightness-0' : ''}`} />
                          <p className={`text-2xl font-bold ${theme.text}`}>{allEvents.length}</p>
                          <p className={`text-xs ${theme.subText}`}>Events</p>
                        </div>
                        <div className="text-center flex flex-col items-center gap-1.5">
                          <img src={FollowersIcon} alt="Followers" className={`w-5 h-5 ${!isDark ? 'filter brightness-0' : ''}`} />
                          <p className={`text-2xl font-bold ${theme.text}`}>{user.followersCount || 0}</p>
                          <p className={`text-xs ${theme.subText}`}>Followers</p>
                        </div>
                        <div className="text-center flex flex-col items-center gap-1.5">
                          <img src={FollowingIcon} alt="Following" className={`w-5 h-5 ${!isDark ? 'filter brightness-0' : ''}`} />
                          <p className={`text-2xl font-bold ${theme.text}`}>{user.followingCount || 0}</p>
                          <p className={`text-xs ${theme.subText}`}>Following</p>
                        </div>
                      </div>
                      <div className="flex gap-3 w-full">
                        <button 
                          onClick={() => navigate('/settings/editprofile')}
                          className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            isDark 
                              ? 'text-white bg-gradient-to-b from-[#3a3b3f] to-[#2c2d30] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:brightness-110'  
                              : 'text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 shadow-md hover:shadow-lg hover:from-gray-200 hover:to-gray-300'
                          }`}
                        >
                          Edit profile
                        </button>
                        <button 
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${ 
                            isDark 
                              ? 'text-white bg-gradient-to-b from-[#3a3b3f] to-[#2c2d30] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:brightness-110' 
                              : 'text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 shadow-md hover:shadow-lg hover:from-gray-200 hover:to-gray-300'
                          }`}
                        > 
                          Share 
                        </button>
                        <HamburgerMenu />
                      </div>
                    </div>

                    {/* Desktop Layout - Keep original exactly as it was */}
                    <div className="hidden md:flex justify-between items-center gap-6">
                      {/* Left side */}
                      <div className="flex items-start gap-6">
                        <img 
                          src={`${import.meta.env.VITE_AUTH_API_BASE_URL}/uploads/${user.image}`}
                          alt="Profile"
                          className={`w-48 h-48 rounded-full object-cover border-4 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                        />
                        
                        <div className="space-y-2 flex-1">
                          <h1 className={`text-2xl font-bold ${theme.text}`}>{user.name}</h1>
                          <p className={`text-sm ${theme.subText}`}>@{user.username}</p>
                          <p className={`whitespace-pre-line text-left text-sm leading-6 break-words ${theme.subText}`}>
                            {user.bio || "🌟 Exploring the world, one flight at a time ✈️\n📍 Currently: [Location]\n🎥 Capturing moments that matter"}
                          </p>
                          <div className="flex gap-3 pt-3 flex-wrap">
                            <button 
                              onClick={() => navigate('/settings/editprofile')}
                              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                isDark 
                                  ? 'text-white bg-gradient-to-b from-[#3a3b3f] to-[#2c2d30] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:brightness-110' 
                                  : 'text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 shadow-md hover:shadow-lg hover:from-gray-200 hover:to-gray-300'
                              }`}
                            >
                              Edit profile 
                            </button>
                            <button 
                              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                isDark 
                                  ? 'text-white bg-gradient-to-b from-[#3a3b3f] to-[#2c2d30] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:brightness-110' 
                                  : 'text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 shadow-md hover:shadow-lg hover:from-gray-200 hover:to-gray-300'
                              }`}
                            >
                              Share profile
                            </button>
                            <button 
                              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                isDark 
                                  ? 'text-white bg-gradient-to-b from-[#3a3b3f] to-[#2c2d30] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:brightness-110' 
                                  : 'text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 shadow-md hover:shadow-lg hover:from-gray-200 hover:to-gray-300'
                              }`}
                            >
                              Insight profile
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right side */}
                      <div className="flex flex-col items-end gap-4">
                        {/* Create Event + Hamburger */}
                        <div className="flex items-center gap-3">
                          <button onClick={handleCreateEvent} 
                            disabled={loading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                              isDark ? 'text-white' : 'text-gray-800'
                            }`}
                            style={{boxShadow: theme.smallCardShadow}}
                          >
                            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#3EB489]">
                              <img src={PlusIcon} alt="Plus" className="w-6 h-6" />
                            </span>
                            <span className="font-medium" style={{ color: isDark ? "#FFFFFF66" : "#00000066" }}>
                              Create event
                            </span>
                          </button>
                          <HamburgerMenu isDesktop />
                        </div>
                        
                        {/* Stats */}
                        <div className={`rounded-[2.5rem] px-10 py-4 flex gap-8 transition-all duration-300 ${theme.cardBg}`} style={{boxShadow: theme.smallCardShadow}}> 
                          {/* Event Created */}
                          <div className="text-center flex flex-col items-center gap-1.5">
                            <img 
                              src={EventIcon} 
                              alt="Event"
                              className={`w-6 h-6 ${!isDark ? "filter brightness-0" : ""}`}
                            />
                            <p className={`text-3xl font-bold ${theme.text}`}>{allEvents.length}</p>
                            <p className={`text-sm ${theme.subText}`}>Event created</p>
                          </div>

                          {/* Followers */}
                          <div className="text-center flex flex-col items-center gap-1.5">
                            <img 
                              src={FollowersIcon} 
                              alt="Followers"
                              className={`w-6 h-6 ${!isDark ? "filter brightness-0" : ""}`}
                            />
                            <p className={`text-3xl font-bold ${theme.text}`}>{user.followersCount || 0}</p>
                            <p className={`text-sm ${theme.subText}`}>Follower</p>
                          </div>

                          {/* Following */}
                          <div className="text-center flex flex-col items-center gap-1.5">
                            <img 
                              src={FollowingIcon} 
                              alt="Following"
                              className={`w-6 h-6 ${!isDark ? "filter brightness-0" : ""}`}
                            />
                            <p className={`text-3xl font-bold ${theme.text}`}>{user.followingCount || 0}</p>
                            <p className={`text-sm ${theme.subText}`}>Following</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Groups Section */}
                  <div className={`rounded-3xl p-6 ${theme.cardBg} transition-all duration-300`} style={{ boxShadow: theme.cardShadow}}>
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                      <h2 className={`text-lg font-semibold ${theme.text}`}>My groups</h2>
                      
                      {/* Mobile: Horizontal scroll */}
                      <div className="md:hidden flex gap-3 overflow-x-auto scrollbar-hide pb-2 flex-1">
                        {groupsLoading ? (
                          <div className={`text-sm ${theme.subText}`}>Loading groups...</div>
                        ) : (
                          <>
                            {groups.length > 0 && groups.map((group, idx) => (
                              <div key={group._id || idx} className="flex flex-col items-center flex-shrink-0">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center" style={{ boxShadow: theme.smallCardShadow }}>
                                  {group.image ? (
                                    <img 
                                      src={group.image}
                                      alt={group.name || group.groupName}
                                      className="w-13 h-13 rounded-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-white text-xs font-bold">
                                      {(group.name || group.groupName || 'G')[0].toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span className={`text-xs mt-1 w-16 text-center truncate ${theme.text}`}>
                                  {group.name || group.groupName || 'Group'}
                                </span>
                              </div>
                            ))}
                            <div className="flex flex-col items-center flex-shrink-0">
                              <button 
                                onClick={() => navigate("/ticket/create-group")}
                                className={`w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center ${
                                  isDark ? "border-gray-600" : "border-gray-400"
                                }`} 
                                style={{ boxShadow: theme.smallCardShadow }}
                              >
                                <img src={PlusIcon} alt="Add Group" className={`w-5 h-5 ${!isDark ? 'filter brightness-0' : ''}`} />
                              </button>
                              <span className={`text-xs mt-1 w-16 text-center truncate ${theme.text}`}>New group</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Desktop: Original layout with real data */}
                      <div className="hidden md:flex flex-row items-end gap-2 flex-nowrap overflow-x-auto">
                        {groupsLoading ? (
                          <div className={`text-sm ${theme.subText}`}>Loading groups...</div>
                        ) : (
                          <>
                            {groups.length > 0 && groups.slice(0, 6).map((group, idx) => (
                              <div key={group._id || idx} className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center" style={{ boxShadow: theme.smallCardShadow }}>
                                  {group.image ? (
                                    <img 
                                      src={group.image}
                                      alt={group.name || group.groupName}
                                      className="w-11 h-11 rounded-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-white text-xs font-bold">
                                      {(group.name || group.groupName || 'G')[0].toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span className={`text-xs mt-2 w-20 text-center truncate whitespace-nowrap ${theme.text}`}>
                                  {group.name || group.groupName || 'Group'}
                                </span>
                              </div>
                            ))}
                            {/* Plus Button */}
                            <div className="flex flex-col items-center">
                              <button 
                                onClick={() => navigate("/ticket/create-group")}
                                className={`w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center ${
                                  isDark ? "border-gray-600" : "border-gray-400"
                                }`} 
                                style={{ boxShadow: theme.smallCardShadow }}
                              >
                                <img src={PlusIcon} alt="Add Group" className={`w-5 h-5 ${!isDark ? 'filter brightness-0' : ''}`} />
                              </button>
                              <span className={`text-xs mt-2 w-20 text-center truncate whitespace-nowrap ${theme.text}`}>New group</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className={`rounded-xl p-6 ${theme.cardBg} transition-all duration-300`}>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className={`text-lg font-semibold ${theme.text}`}>Suggestions</h2>
                      <button
                        className={`text-sm px-4 py-1.5 rounded-full border border-[#6549B8] hover:bg-[#6549B8] hover:text-white transition-all duration-200 ${
                          isDark ? "text-[#FFFFFF]" : "text-[#000000]"
                        }`}
                      >
                        see all
                      </button>
                    </div>

                    {/* Scrollable Container with Arrows */}
                    <div className="relative">
                      {/* Left Arrow */}
                      <button
                        onClick={() => {
                          document.getElementById("suggestions-scroll").scrollBy({
                            left: -250,
                            behavior: "smooth",
                          });
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full  transition hidden"
                        id="left-arrow"
                      >
                        <img src={RightArrowIcon} alt="Scroll Left" className="w-6 h-6 rotate-180 invert" />
                      </button>

                      {/* Scrollable Users */}
                      <div
                        id="suggestions-scroll"
                        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
                        onScroll={(e) => {
                          const container = e.target;
                          const leftArrow = document.getElementById("left-arrow");
                          const rightArrow = document.getElementById("right-arrow");

                          // Show/hide arrows based on scroll position
                          if (container.scrollLeft > 0) {
                            leftArrow.classList.remove("hidden");
                          } else {
                            leftArrow.classList.add("hidden");
                          }

                          if (container.scrollLeft + container.clientWidth < container.scrollWidth) {
                            rightArrow.classList.remove("hidden");
                          } else {
                            rightArrow.classList.add("hidden");
                          }
                        }}
                      >
                        {users.length > 0 ? (
                          users.slice(0, 8).map((suggestedUser) => (
                            <div
                              key={suggestedUser._id}
                              className="w-[200px] md:w-[246px] h-[280px] md:h-[363px] flex-shrink-0 rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 hover:scale-105"
                              style={{
                                backgroundColor: isDark ? "#212426" : "#ffffff",
                                boxShadow: theme.smallCardShadow,
                              }}
onClick={() => navigate(`/profile/${suggestedUser._id}`)}
                            >
                              <div className="flex flex-col">
                                <div className="relative mb-4">
                                  <img
                                    src={`${import.meta.env.VITE_AUTH_API_BASE_URL}/uploads/${suggestedUser.image}`}
                                    alt={suggestedUser.name}
                                    className="w-full h-[120px] md:h-[160px] object-cover rounded-2xl"
                                  />
                                </div>
                                <div className="px-1" style={{ marginTop: "2rem" }}>
                                  <div className="flex items-center gap-2 mb-1 justify-center">
                                    <h3 className={`text-base font-semibold ${theme.text} truncate`}>
                                      {suggestedUser.name}
                                    </h3>
                                    <img
                                      src={VerifiedIcon}
                                      alt="Verified"
                                      className="w-4 h-4 flex-shrink-0"
                                    />
                                  </div>
                                  <p
                                    className={`text-sm ${theme.subText} capitalize text-center`}
                                  >
                                    {suggestedUser.role || "User"}
                                  </p>
                                </div>
                              </div>

                              <div
                                className="flex justify-between items-center px-1"
                                style={{ marginBottom: "1rem" }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <img
                                      src={FollowersIcon}
                                      alt="Followers"
                                      className={`w-4 h-4 ${!isDark ? "filter brightness-0" : ""}`}
                                    />
                                    <span className={`text-sm font-medium ${theme.text}`}>
                                      {Math.floor(Math.random() * 500) + 100}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <img
                                      src={EventIcon}
                                      alt="Events"
                                      className={`w-4 h-4 ${!isDark ? "filter brightness-0" : ""}`}
                                    />
                                    <span className={`text-sm font-medium ${theme.text}`}>
                                      {Math.floor(Math.random() * 500) + 100}
                                    </span>
                                  </div>
                                </div>
                                <button className="px-4 py-1.5 rounded-full text-white text-sm font-medium bg-blue-500 hover:bg-blue-600 transition-colors duration-200"
                                onClick={(e) => {
            e.stopPropagation(); // Prevent card click when clicking follow button
            // Add your follow logic here
            console.log('Follow user:', suggestedUser._id);}}
            >
                                  Follow +
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className={`w-full text-center py-8 ${theme.subText}`}>
                            <p className="text-sm">No suggestions available</p>
                          </div>
                        )}
                      </div>

                      {/* Right Arrow */}
                      <button
                        onClick={() => {
                          document.getElementById("suggestions-scroll").scrollBy({
                            left: 250,
                            behavior: "smooth",
                          });
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/3 z-10   p-2 rounded-full  transition"
                        id="right-arrow"
                      >
                        <img src={RightArrowIcon} alt="Scroll Right" className="w-6 h-6 invert" />
                      </button>
                    </div>
                  </div>

                  {/* Events Section with Tabs */}
                  <div
                    className={`rounded-[2.5rem] p-6 ${theme.cardBg} transition-all duration-300`}
                    style={{ boxShadow: theme.cardShadow }}
                  >
                    {/* Tabs */}
                    <div className="flex items-center justify-between mb-6 px-4">
                      {/* Mobile Tabs */}
                      <div className="flex md:hidden items-center justify-center w-full gap-8 relative">
                        <div 
                          className={`flex flex-col items-center gap-2 cursor-pointer ${activeTab === 'all' ? '' : 'opacity-60'}`}
                          onClick={() => setActiveTab('all')}
                        >
                          <img
                            src={AllEventsIcon}
                            alt="My events"
                            className={`w-6 h-6 ${!isDark ? "filter brightness-0" : ""}`}
                          />
                          <span className={`text-sm font-medium ${theme.text}`}>
                            All Events
                          </span>
                          {activeTab === 'all' && <div className="w-full h-0.5 bg-blue-500"></div>}
                        </div>
                        <div 
                          className={`flex flex-col items-center gap-2 cursor-pointer ${activeTab === 'live' ? '' : 'opacity-60'}`}
                          onClick={() => setActiveTab('live')}
                        >
                          <img
                            src={LiveEventIcon}
                            alt="Live events"
                            className={`w-6 h-6 ${!isDark ? "filter brightness-0" : ""}`}
                          />
                          <span className={`text-sm font-medium ${theme.text}`}>
                            Live Events
                          </span>
                          {activeTab === 'live' && <div className="w-full h-0.5 bg-blue-500"></div>}
                        </div>
                        <div 
                          className={`flex flex-col items-center gap-2 cursor-pointer ${activeTab === 'past' ? '' : 'opacity-60'}`}
                          onClick={() => setActiveTab('past')}
                        >
                          <img
                            src={PastEventIcon}
                            alt="Past events"
                            className={`w-6 h-6 ${!isDark ? "filter brightness-0" : ""}`}
                          />
                          <span className={`text-sm font-medium ${theme.text}`}>
                            Past Events
                          </span>
                          {activeTab === 'past' && <div className="w-full h-0.5 bg-blue-500"></div>}
                        </div>
                      </div>

                      {/* Desktop Tabs */}
                      <div className="hidden md:flex items-center justify-between w-full">
                        <div
                          className={`flex items-center gap-2 cursor-pointer p-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'all' ? '' : 'opacity-60'
                          }`}
                          style={{
                            boxShadow: activeTab === 'all' ? (isDark
                              ? "inset -17px -17px 34px #1c1f20,inset 17px 17px 34px #26292c"
                              : "inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)") : 'none',
                            backgroundColor: activeTab === 'all' ? (isDark ? "#1a1d20" : "#f0f2f5") : 'transparent',
                          }}
                          onClick={() => setActiveTab('all')}
                        >
                          <img
                            src={AllEventsIcon}
                            alt="My events"
                            className={`w-8 h-8 ${!isDark ? "filter brightness-0" : ""}`}
                          />
                          <span className={`text-sm font-medium ${theme.text}`}>
                            All Events
                          </span>
                        </div>

                        <div 
                          className={`flex items-center gap-2 cursor-pointer mx-auto p-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'live' ? '' : 'opacity-60'
                          }`}
                          style={{
                            boxShadow: activeTab === 'live' ? (isDark
                              ? "inset 2px 2px 4px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(255,255,255,0.1)"
                              : "inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)") : 'none',
                            backgroundColor: activeTab === 'live' ? (isDark ? "#1a1d20" : "#f0f2f5") : 'transparent',
                          }}
                          onClick={() => setActiveTab('live')}
                        >
                          <img
                            src={LiveEventIcon}
                            alt="Live events"
                            className={`w-8 h-8 ${!isDark ? "filter brightness-0" : ""}`}
                          />
                          <span className={`text-sm font-medium ${theme.text}`}>
                            Live Events
                          </span>
                        </div>

                        <div 
                          className={`flex items-center gap-2 cursor-pointer -mr-2 p-4 rounded-xl transition-all duration-200 ${
                            activeTab === 'past' ? '' : 'opacity-60'
                          }`}
                          style={{
                            boxShadow: activeTab === 'past' ? (isDark
                              ? "inset 2px 2px 4px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(255,255,255,0.1)"
                              : "inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)") : 'none',
                            backgroundColor: activeTab === 'past' ? (isDark ? "#1a1d20" : "#f0f2f5") : 'transparent',
                          }}
                          onClick={() => setActiveTab('past')}
                        >
                          <img
                            src={PastEventIcon}
                            alt="PastEvent"
                            className={`w-7 h-7 ${!isDark ? "filter brightness-0" : ""}`}
                          />
                          <span className={`text-sm font-medium ${theme.text}`}>
                            Past Events
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Events Content */}
                    {eventsLoading ? (
                      <div className="flex justify-center items-center py-16">
                        <div className={`text-lg ${theme.subText}`}>Loading events...</div>
                      </div>
                    ) : getCurrentEvents().length === 0 ? (
                      /* Empty State */
                      <div className="flex flex-col items-center justify-center py-16 md:py-24">
                        <h3 className={`text-xl font-medium ${theme.text} mb-4`}>
                          {activeTab === 'all' ? 'Create your first Event' : 
                           activeTab === 'live' ? 'No live events yet' : 
                           'No past events yet'}
                        </h3>
                        {activeTab === 'all' && (
                          <button
                            onClick={handleCreateEvent}
                            disabled={loading}
                            className="px-8 md:px-14 py-2.5 rounded-full text-white text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-opacity duration-200"
                          >
                            {loading ? "Loading..." : "Create"}
                          </button>
                        )}
                      </div>
                    ) : (
                      /* Events Grid */
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-14">
                        {getCurrentEvents().map((event, index) => (
                          <div
                            key={event._id || `event-${index}`}
                            className="rounded-3xl overflow-hidden flex flex-col "
                            style={{
                              backgroundColor: isDark ? "#212426" : "#ffffff",
                              boxShadow: theme.smallCardShadow,
                            }}
                          >
                            {/* Event Image */}
                            <div className="p-4">

                            <img
                              src={
                                event.event_banner ||
                                event.event_logo ||
                                event.event_image ||
                                "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2"
                              }
                              alt={event.event_name || "Event"}
    className="rounded-[1rem] h-70 w-full object-cover border-2 border-white border-opacity-50"
                              onError={(e) => {
                                e.target.src =
                                  "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2";
                              }}
                            />
                            </div>


                            {/* Event Info */}
                            <div className="flex flex-col flex-1 p-4">
                              <div className="text-center mb-6">
                                <h3 className={`font-bold text-base ${theme.text}`}>
                                  {event.event_name ||"Event"}
                                </h3>
                                <p className={`text-sm ${theme.subText} mt-1`}>
                                  {event.event_category ||
                                   "Event Type"}
                                </p>
                              </div>

                              {/* Stats */}
<div className="flex justify-center items-center gap-20 text-sm mb-3">
  <div className="flex flex-col items-center">
    <img
      src={LikeIcon}
      alt="Likes"
      className={`w-5 h-5 ${!isDark ? "filter brightness-0" : ""}`}
    />
    <span className={theme.subText}>
      {event.likes || event.likesCount || "0"}
    </span>
  </div>

  <div className="flex flex-col items-center">
    <img
      src={TicketIcon}
      alt="Tickets"
      className={`w-5 h-5 ${!isDark ? "filter brightness-0" : ""}`}
    />
    <span className={theme.subText}>
      {event.ticketsSold ||
        event.registrations ||
        event.attendeesCount ||
        event.ticket_count ||
        event.ticketCount ||
        "0"}
    </span>
  </div>

  <div className="flex flex-col items-center">
    <img
      src={SendIcon}
      alt="Shares"
      className={`w-5 h-5 ${!isDark ? "filter brightness-0" : ""}`}
    />
    <span className={theme.subText}>
      {event.shares || event.sharesCount || "0"}
    </span>
  </div>
</div>


                              {/* View button */}
                              <div className="flex justify-center pt-4 "
                              >
                                <button
                                  onClick={() => {
                                    const eventId = event._id || event.id;
                                    if (eventId) {
                                      navigate(`/ticket/event/${eventId}`);
                                    } else {
                                      console.warn("No event ID found for navigation");
                                    }
                                  }}
                                  className="px-10 py-2 rounded-full text-white text-sm font-medium  ml-4"
                                  style={{
  background: "linear-gradient(180deg, #2e1745 0%, #7f53e7 100%)"
}}

                                >
                                  View
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </main>

          {/* Bottom Navigation */}
          <BottomNavigation />
        </div>

        {/* Group Selection Modal */}
        <GroupSelectionModal />
      </div>
    </>
  );
};
export default ProfilePage;
