import React, { useState, useEffect, useRef } from "react";
import { getMe } from "../../services/userService";
import { findAllActiveUsers,followUser, unfollowUser,getOtherProfile ,getFollowers,getFollowing,checkIsFollowing } from "../../services/authService";
import { useNavigate, Link } from 'react-router-dom';
import { getGroups, getMyEvents, getMyLiveEvents, getMyPastEvents} from "../../services/ticketService";
import { useDispatch } from 'react-redux';
import { logoutSuccess } from '../../features/auth/authSlice'; 
import { logout } from '../../services/authService';
import SideBar from "../../components/HomePage/SideBar.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import BottomNavigation from "../../components/HomePage/BottomNavigation.jsx";
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
import ProfileImage from "../../assets/PROFILEPAGE/ProfileImage.png";
// Bottom Nav Icons
import HomeIcon from "../../assets/HomePage/HomeIcon.svg";
import TicketIcon from "../../assets/HomePage/TicketIcon.svg";
import SpeakerIcon from "../../assets/HomePage/SpeakerIcon.svg";

const HEADER_HEIGHT = 72;

const CustomScrollbarStyles = () => (
  <style>{`
    /* Hide scrollbar globally */
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
    
    /* Nest Hub (1024x600) specific adjustments */
    @media (min-width: 1024px) and (max-width: 1024px) and (min-height: 600px) and (max-height: 600px) {
      html {
        font-size: 12px;
      }
      .nest-hub-sidebar {
        width: 70px !important;
      }
      .nest-hub-content {
        padding: 0.5rem !important;
        margin-left: 70px !important;
      }
      .nest-hub-card {
        padding: 0.75rem !important;
        border-radius: 1.5rem !important;
      }
      .nest-hub-spacing {
        gap: 0.75rem !important;
      }
    }
    
    /* Nest Hub Max (1280x800) */
    @media (min-width: 1280px) and (max-width: 1280px) and (min-height: 800px) and (max-height: 800px) {
      html {
        font-size: 14px;
      }
    }
    
    /* Medium devices scaling */
    @media (min-width: 768px) and (max-width: 1023px) {
      html {
        font-size: 13px;
      }
      .tablet-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 1rem !important;
      }
    }
    
    /* Large screens */
    @media (min-width: 1440px) {
      html {
        font-size: 16px;
      }
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
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [followingMap, setFollowingMap] = useState({});
  const [followingStates, setFollowingStates] = useState({});
  const [profileUser, setProfileUser] = useState(null);
  const [userId, setUserId] = useState(null);
  // Active tab state: 'all', 'live', 'past'
  const [activeTab, setActiveTab] = useState('all');
  
  // State for hamburger menu dropdown
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const hamburgerRef = useRef(null);

  // Helper function to parse API response and extract tickets/events
  const parseApiResponse = (response= 'events') => {    
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
  const checkFollowStatuses = async () => {
    if (users.length === 0) return;
    
    const statuses = {};
    for (const suggestUser of users) {
      try {
        const userId = suggestUser._id || suggestUser.id;
        const response = await checkIsFollowing(userId);
        statuses[userId] = response.isFollowing || false;
      } catch (err) {
        console.error(`Error checking follow status for ${suggestUser._id}:`, err);
        statuses[suggestUser._id || suggestUser.id] = false;
      }
    }
    setFollowingMap(statuses);
  };
  
  checkFollowStatuses();
}, [users]);

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
  // Update arrow visibility
    useEffect(() => {
      const checkScrollArrows = () => {
        const container = document.getElementById("suggestions-scroll");
        if (container && users.length > 0) {
          const { scrollLeft, clientWidth, scrollWidth } = container;
          setShowLeftArrow(scrollLeft > 0);
          setShowRightArrow(scrollLeft + clientWidth < scrollWidth);
        } else {
          setShowLeftArrow(false);
          setShowRightArrow(false);
        }
      };
  
      setTimeout(checkScrollArrows, 100);
    }, [users]);

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

   const handleScroll = (e) => {
    const container = e.target;
    const { scrollLeft, clientWidth, scrollWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth);
  };

  const scrollLeft = () => {
    const container = document.getElementById("suggestions-scroll");
    if (container) {
      container.scrollBy({ left: -250, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById("suggestions-scroll");
    if (container) {
      container.scrollBy({ left: 250, behavior: "smooth" });
    }
  };
const handleSuggestionFollowToggle = async (suggestedUserId) => {
  if (!suggestedUserId || !user) return;
  
  const key = suggestedUserId;
  
  // Set loading state for this specific user
  setFollowingStates(prev => ({ ...prev, [key]: true }));
  
  const isCurrentlyFollowing = followingMap[key] || false;
  
  try {
    if (isCurrentlyFollowing) {
      // UNFOLLOW FLOW
      const response = await unfollowUser(suggestedUserId);
      console.log("Unfollow response:", response);
      
      // Update state AFTER successful API call
      setFollowingMap(prev => ({ ...prev, [key]: false }));
      
      // Update users list - decrement follower count
      setUsers(prev => prev.map(u => {
        if ((u._id || u.id) === suggestedUserId) {
          const currentCount = parseInt(u.followers || u.followersCount || 0);
          return {
            ...u,
            followersCount: Math.max(0, currentCount - 1),
            followers: Math.max(0, currentCount - 1).toString()
          };
        }
        return u;
      }));
      
      // Update current user's following count from API response
      if (response?.following) {
        setUser(prev => ({
          ...prev,
          following: response.following,
          followingCount: parseInt(response.following)
        }));
      } else {
        setUser(prev => ({
          ...prev,
          following: Math.max(0, parseInt(prev.following || 0) - 1).toString(),
          followingCount: Math.max(0, (prev.followingCount || 0) - 1)
        }));
      }
      
    } else {
      // FOLLOW FLOW
      const response = await followUser(suggestedUserId);
      console.log("Follow response:", response);
      
      // Update state AFTER successful API call
      setFollowingMap(prev => ({ ...prev, [key]: true }));
      
      // Update users list - increment follower count
      setUsers(prev => prev.map(u => {
        if ((u._id || u.id) === suggestedUserId) {
          const currentCount = parseInt(u.followers || u.followersCount || 0);
          return {
            ...u,
            followersCount: currentCount + 1,
            followers: (currentCount + 1).toString()
          };
        }
        return u;
      }));
      
      // Update current user's following count from API response
      if (response?.following) {
        setUser(prev => ({
          ...prev,
          following: response.following,
          followingCount: parseInt(response.following)
        }));
      } else {
        setUser(prev => ({
          ...prev,
          following: (parseInt(prev.following || 0) + 1).toString(),
          followingCount: (parseInt(prev.followingCount || 0) + 1)
        }));
      }
    }
  } catch (err) {
    console.error('Error toggling follow status:', err);
    
    // Show error alert
    alert(err.response?.data?.message || 'Failed to update follow status');
  } finally {
    // Clear loading state for this user
    setFollowingStates(prev => ({ ...prev, [key]: false }));
  }
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
      sessionStorage.removeItem('userData');
      sessionStorage.removeItem('userImage');
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
      {/* Sidebar - Fixed like HomePage */}
      <div 
  className={`hidden md:flex flex-col flex-shrink-0 ${theme.bg} transition-colors duration-300`}
  style={{ 
    position: 'fixed', 
    left: 0, 
    top: 0, 
    bottom: 0, 
    width: '80px',
    zIndex: 40,
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
    <main className="flex-1 p-3 md:p-4 lg:p-6 overflow-y-auto overflow-x-hidden pb-32 md:pb-4 nest-hub-content max-w-full">
  <div className="max-w-7xl mx-auto space-y-3 md:space-y-4 lg:space-y-6 nest-hub-spacing w-full px-0 md:px-2 lg:px-4">
              {user && (
                <>
{/* Profile Card */}
<div className={`rounded-2xl md:rounded-3xl lg:rounded-[3rem] p-3 md:p-4 lg:p-6 mt-2 md:mt-4 lg:mt-8 ${theme.cardBg} nest-hub-card transition-all duration-300 w-full overflow-hidden`} style={{boxShadow: theme.cardShadow}}>
                    <div className="flex md:hidden flex-col space-y-4">
                      <div className="flex flex-col gap-4">
  {/* Top Row: Profile image + Name/Username */}
  <div className="flex items-center gap-4">
    {/* Profile Image */}
    <img 
      src={user.image ? `${import.meta.env.VITE_AUTH_API_BASE_URL}/uploads/${user.image}` : ProfileImage}
      alt="Profile"
      className={`w-24 h-24 rounded-full object-cover border-2 flex-shrink-0 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
    />

    {/* Name + Username */}
    <div className="flex flex-col justify-center">
      <div className="flex items-center gap-1.5">
        <h1 className={`text-lg font-bold ${theme.text}`}>{user.name}</h1>
        <img src={VerifiedIcon} alt="Verified" className="w-4 h-4" />
      </div>
      <p className={`text-sm ${theme.subText}`}>{user.username}</p>
      <p className={`text-base leading-6 font-bold ${theme.subText} whitespace-pre-line`}>
        {user.role}
      </p>
    </div>
  </div>

    {/* Bio Section (full width below image and name) */}
    <div className="w-full">
      <p className={`text-xs leading-5 ${theme.subText} whitespace-pre-line`}>
        {user.bio} 
      </p>
      <p className={`text-xs leading-5 ${theme.subText} whitespace-pre-line`}>
        {user.website} 
      </p>
    </div>
  </div>      
                      {/* Stats */}
                      <div className="flex justify-start gap-4">
                        <div className="text-left">
                          <p className={` ${theme.subText}`}>
                            <span className="text-md font-semibold text-white">{allEvents.length}</span>
                            <span className="text-md  ml-1">Event created</span>
                          </p>
                        </div>
                        <div className="text-left">
                          <p className={` ${theme.subText}`}>
                            <span className="text-md font-semibold text-white">{user.followers || 0}</span>
                            <span className="text-md  ml-1">Followers</span>
                          </p>
                        </div>
                        <div className="text-left">
                          <p className={` ${theme.subText}`}>
                             <span className="text-md font-semibold text-white">{user.following || 0}</span>
                             <span className="text-md  ml-1">Following</span>
                          </p>
                        </div>
                      </div>
                      {/* Buttons */}
                      <div className="flex gap-2 justify-start items-center flex-nowrap">
                        {['Edit profile', 'Share profile', 'Insight profile'].map((label, index) => (
                          <button
                            key={index}
                            onClick={label === 'Edit profile' ? () => navigate('/settings/editprofile') : undefined}
                            className={`whitespace-nowrap flex-shrink-0 px-3 py-2 rounded-full text-sm font-normal transition-all duration-200 ${
                              isDark
                                ? 'text-white bg-gradient-to-b from-[#3a3b3f] to-[#2c2d30] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:brightness-110'
                                : 'text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 shadow-md hover:shadow-lg hover:from-gray-200 hover:to-gray-300'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Desktop Layout - Keep original exactly as it was */}
                    <div className="hidden md:flex justify-between items-center gap-6">
                      {/* Left side */}
                      <div className="flex items-start gap-6">
                        <img 
                          src={user.image? `${import.meta.env.VITE_AUTH_API_BASE_URL}/uploads/${user.image}`: ProfileImage}
                          alt="Profile"
  className={`w-32 h-32 md:w-36 md:h-36 lg:w-48 lg:h-48 rounded-full object-cover border-4 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                        />
                        
                        <div className="space-y-1 md:space-y-2 flex-1">
  <h1 className={`text-xl md:text-xl lg:text-2xl font-bold ${theme.text}`}>{user.name}</h1>
  <p className={`text-xs md:text-sm ${theme.subText}`}>{user.username}</p>
  <p className={`text-base leading-6 font-bold ${theme.subText} whitespace-pre-line`}>
    {user.organisation_type}
  </p>
  <p className={`whitespace-pre-line text-left text-xs md:text-sm leading-5 md:leading-6 break-words ${theme.subText}`}>
    {user.bio }
  </p>
  <p className={`text-xs leading-5 ${theme.subText} whitespace-pre-line`}>
        {user.website} 
      </p>
<div className="flex gap-2 md:gap-3 pt-2 md:pt-3 flex-wrap">
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
<div
  className={`w-[457px] h-[161px] flex justify-between items-center 
  rounded-[24px] px-[39px] pr-[42px] py-[25px]
  transition-all duration-300 ${theme.cardBg}`}
  style={{
    boxShadow:
      "-2px -2px 10px 0px rgba(99,99,99,0.21), 5px 6px 9px 0px rgba(0,0,0,0.46)",
  }}
>
  {/* Event Created */}
  <div className="text-center flex flex-col items-center gap-1">
    <img
      src={EventIcon}
      alt="Event"
      className={`w-[24px] h-[24px] ${!isDark ? "filter brightness-0" : ""}`}
    />
    <p className={`text-2xl font-bold ${theme.text}`}>{allEvents.length}</p>
    <p className={`text-xs ${theme.subText}`}>Event created</p>
  </div>

  {/* Followers */}
  <div className="text-center flex flex-col items-center gap-1">
    <img
      src={FollowersIcon}
      alt="Followers"
      className={`w-[24px] h-[24px] ${!isDark ? "filter brightness-0" : ""}`}
    />
    <p className={`text-2xl font-bold ${theme.text}`}>{user.followers || 0}</p>
    <p className={`text-xs ${theme.subText}`}>Follower</p>
  </div>

  {/* Following */}
  <div className="text-center flex flex-col items-center gap-1">
    <img
      src={FollowingIcon}
      alt="Following"
      className={`w-[24px] h-[24px] ${!isDark ? "filter brightness-0" : ""}`}
    />
    <p className={`text-2xl font-bold ${theme.text}`}>{user.following || 0}</p>
    <p className={`text-xs ${theme.subText}`}>Following</p>
  </div>
</div>
                      </div>
                    </div>
                  </div>

                  {/* Groups Section */}
<div className={`rounded-2xl md:rounded-3xl p-3 md:p-4 lg:p-6 ${theme.cardBg} nest-hub-card transition-all duration-300 w-full overflow-hidden`} style={{ boxShadow: theme.cardShadow }}>
  <div className="flex items-center gap-4 mb-2 md:mb-0">
    <h2 className={`text-lg font-semibold ${theme.text}`}>My groups</h2>
    
    {/* Mobile: Horizontal scroll */}
    <div className="md:hidden flex gap-2 overflow-x-auto scrollbar-hide pb-1 flex-1">
      {groupsLoading ? (
        <div className={`text-sm ${theme.subText}`}>Loading groups...</div>
      ) : (
        <>
          {groups.length > 0 && groups.map((group, idx) => (
            <div key={group._id || idx} className="flex flex-col items-center flex-shrink-0">
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
              <span className={`text-xs mt-1 w-16 text-center truncate ${theme.text}`}>
                {group.name || group.groupName || 'Group'}
              </span>
            </div>
          ))}
          <div className="flex flex-col items-center flex-shrink-0">
            <button 
              onClick={() => navigate("/ticket/create-group")}
              className={`w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center ${
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
<div className={`rounded-xl md:rounded-2xl p-3 md:p-4 lg:p-6 nest-hub-card transition-all duration-300 w-full overflow-hidden`}>
   <div className="flex justify-between items-center mb-4 md:mb-6">
     <h2 className={`text-base md:text-lg font-semibold ${theme.text}`}>Suggestions</h2>
     <button
       className={`text-xs md:text-sm px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-[#6549B8] hover:bg-[#6549B8] hover:text-white transition-all duration-200 ${
         isDark ? "text-[#FFFFFF]" : "text-[#000000]"
       }`}
       onClick={() => navigate('/suggestions')}
     >
       see all
     </button>
   </div>

   {/* Desktop: Scrollable Container with Arrows */}
   <div className="hidden md:block relative">
     {showLeftArrow && users.length > 0 && (
       <button
         onClick={scrollLeft}
         className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2"
       >
         <img src={RightArrowIcon} alt="Scroll Left" className="w-6 h-6 rotate-180 invert" />
       </button>
     )}

     <div
       id="suggestions-scroll"
       className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
       onScroll={handleScroll}
     >
       {users.length > 0 ? (
         users.slice(0, 8).map((suggestedUser) => (
           <div
             key={suggestedUser._id}
             className="w-[246px] h-[363px] flex-shrink-0 rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 hover:scale-105 cursor-pointer"
             style={{
               backgroundColor: isDark ? "#212426" : "#ffffff",
               boxShadow: theme.smallCardShadow,
             }}
             onClick={() => navigate(`/profile/${suggestedUser._id || suggestedUser.id}`)}
           >
             <div className="flex flex-col">
               <div className="relative mb-4">
                 <img
                   src={suggestedUser.image? `${import.meta.env.VITE_AUTH_API_BASE_URL}/uploads/${suggestedUser.image}`: ProfileImage}
                   alt={suggestedUser.name}
                   className="w-full h-[160px] object-cover rounded-2xl"
                 />
               </div>
               <div className="px-1" style={{ marginTop: "2rem" }}>
                 <div className="flex items-center gap-2 mb-1 justify-center">
                   <h3 className={`text-base font-semibold ${theme.text} truncate`}>{suggestedUser.name}</h3>
                   <img src={VerifiedIcon} alt="Verified" className="w-4 h-4 flex-shrink-0"/>
                 </div>
                 <p className={`text-sm ${theme.subText} capitalize text-center`}>{suggestedUser.organisation_type || suggestedUser.role}</p>
               </div>
             </div>

             <div className="flex justify-between items-center px-1" style={{ marginBottom: "1rem" }}>
               <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1">
                   <img src={FollowersIcon} alt="Followers" className={`w-4 h-4 ${!isDark ? "filter brightness-0" : ""}`}/>
                   <span className={`text-sm font-medium ${theme.text}`}>
                     {suggestedUser.followersCount || suggestedUser.followers || 0}
                   </span>
                 </div>
                 <div className="flex items-center gap-1">
                   <img src={EventIcon} alt="Events" className={`w-4 h-4 ${!isDark ? "filter brightness-0" : ""}`}/>
                   <span className={`text-sm font-medium ${theme.text}`}>{suggestedUser.eventsCount || 0}</span>
                 </div>
               </div>
                <button 
                onClick={(e) => {
                e.stopPropagation();
                handleSuggestionFollowToggle(suggestedUser._id || suggestedUser.id);
                }}
                disabled={followingStates[suggestedUser._id || suggestedUser.id]}
                className={`px-3 py-1 rounded-full text-white text-xs font-medium transition-all duration-200 ${
                followingMap[suggestedUser._id || suggestedUser.id]
                ? 'bg-[#44444D] shadow-[0px_3px_6px_rgba(0,0,0,0.25)] hover:bg-[#50505A]'
                : 'bg-blue-500 hover:bg-blue-600'
                } ${followingStates[suggestedUser._id || suggestedUser.id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                {followingStates[suggestedUser._id || suggestedUser.id] ? (
                followingMap[suggestedUser._id || suggestedUser.id] ? 'Unfollowing...' : 'Following...'
                ) : (
                followingMap[suggestedUser._id || suggestedUser.id] ? 'Unfollow' : 'Follow +'
                )}
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

     {showRightArrow && users.length > 0 && (
       <button
         onClick={scrollRight}
         className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full"
       >
         <img src={RightArrowIcon} alt="Scroll Right" className="w-6 h-6 invert" />
       </button>
     )}
   </div>

   {/* Mobile: Grid of 2 Cards */}
   <div className="md:hidden grid grid-cols-2 gap-3">
     {users.length > 0 ? (
       users.slice(0, 2).map((suggestedUser) => (
         <div
           key={suggestedUser._id}
           className="rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 cursor-pointer"
           style={{
             backgroundColor: isDark ? "#212426" : "#ffffff",
             boxShadow: theme.smallCardShadow,
           }}
           onClick={() => navigate(`/profile/${suggestedUser._id || suggestedUser.id}`)}
         >
           <div className="flex flex-col">
             <div className="relative mb-3">
               <img
                 src={suggestedUser.image? `${import.meta.env.VITE_AUTH_API_BASE_URL}/uploads/${suggestedUser.image}`: ProfileImage}
                 alt={suggestedUser.name}
                 className="w-full h-[100px] object-cover rounded-xl"
               />
             </div>
             <div className="px-1 mb-3">
               <div className="flex items-center gap-1 mb-1 justify-center">
                 <h3 className={`text-sm font-semibold ${theme.text} truncate`}>{suggestedUser.name}</h3>
                 <img src={VerifiedIcon} alt="Verified" className="w-3 h-3 flex-shrink-0"/>
               </div>
               <p className={`text-xs ${theme.subText} capitalize text-center`}>{suggestedUser.organisation_type || suggestedUser.role}</p>
             </div>
           </div>

           <div className="flex flex-col gap-2">
             <div className="flex justify-center items-center gap-3">
               <div className="flex items-center gap-1">
                 <img src={FollowersIcon} alt="Followers" className={`w-3 h-3 ${!isDark ? "filter brightness-0" : ""}`}/>
                 <span className={`text-xs font-medium ${theme.text}`}>
                   {suggestedUser.followersCount || suggestedUser.followers || 0}
                 </span>
               </div>
               <div className="flex items-center gap-1">
                 <img src={EventIcon} alt="Events" className={`w-3 h-3 ${!isDark ? "filter brightness-0" : ""}`}/>
                 <span className={`text-xs font-medium ${theme.text}`}>{suggestedUser.eventsCount || 0}</span>
               </div>
             </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleSuggestionFollowToggle(suggestedUser._id || suggestedUser.id);
              }}
              disabled={followingStates[suggestedUser._id || suggestedUser.id]}
              className={`w-full px-3 py-1.5 rounded-full text-white text-xs font-medium transition-all duration-200 ${
                followingMap[suggestedUser._id || suggestedUser.id]
                  ? 'bg-[#44444D] shadow-[0px_5px_10px_0px_rgba(0,0,0,0.3)] hover:bg-[#50505A]'
                  : 'bg-blue-500 hover:bg-blue-600'
              } ${followingStates[suggestedUser._id || suggestedUser.id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {followingStates[suggestedUser._id || suggestedUser.id] ? (
                followingMap[suggestedUser._id || suggestedUser.id] ? 'Unfollowing...' : 'Following...'
              ) : (
                followingMap[suggestedUser._id || suggestedUser.id] ? 'Unfollow' : 'Follow +'
              )}
            </button>
           </div>
         </div>
       ))
     ) : (
       <div className={`col-span-2 text-center py-8 ${theme.subText}`}>
         <p className="text-sm">No suggestions available</p>
       </div>
     )}
   </div>
 </div>

                  {/* Events Section with Tabs */}
<div
  className={`rounded-2xl md:rounded-[2.5rem] p-3 md:p-4 lg:p-6 ${theme.cardBg} md:bg-transparent nest-hub-card transition-all duration-300 w-full overflow-hidden`}
  style={{ boxShadow: window.innerWidth >= 768 ? theme.cardShadow : 'none' }}
>
  {/* Tabs */}
  <div className="flex items-center justify-between mb-4 md:mb-6 px-2 md:px-4">
   {/* Mobile Tabs */}
<div 
  className="flex md:hidden items-center rounded-2xl transition-shadow duration-200"
  style={{
    backgroundColor: isDark ? "#212426" : "#ffffff",
    boxShadow: theme.smallCardShadow,
    padding: "16px 8px",
    width: "calc(100% + 16px)", // Increased width
    marginLeft: "-8px", // Center the wider container
  }}
>
  <div className="flex items-center w-full relative gap-2" style={{ minHeight: '44px' }}>
    {/* My Events - Left */}
    <div
      className="flex items-center gap-1 cursor-pointer rounded-xl transition-all duration-200 z-10"
      style={{
        boxShadow: activeTab === 'all'
          ? isDark
            ? "inset -17px -17px 34px #1c1f20, inset 17px 17px 34px #26292c"
            : "inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)"
          : 'none',
        backgroundColor: activeTab === 'all' ? (isDark ? "#1a1d20" : "#f0f2f5") : 'transparent',
        padding: "8px 10px",
      }}
      onClick={() => setActiveTab('all')}
    >
      <img src={AllEventsIcon} alt="My events" className={`w-4 h-4 ${!isDark ? "filter brightness-0" : ""}`} />
      <span className={`text-xs font-medium ${theme.text} whitespace-nowrap`}>My events</span>
    </div>

    {/* Live Events - Absolutely centered */}
    <div
      className="flex items-center gap-1 cursor-pointer rounded-xl transition-all duration-200 absolute left-1/2 z-20"
      style={{
        boxShadow: activeTab === 'live'
          ? isDark
            ? "inset -17px -17px 34px #1c1f20, inset 17px 17px 34px #26292c"
            : "inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)"
          : 'none',
        backgroundColor: activeTab === 'live' ? (isDark ? "#1a1d20" : "#f0f2f5") : 'transparent',
        padding: "8px 10px",
        transform: 'translateX(-50%)',
      }}
      onClick={() => setActiveTab('live')}
    >
      <img src={LiveEventIcon} alt="Live events" className={`w-4 h-4 ${!isDark ? "filter brightness-0" : ""}`} />
      <span className={`text-xs font-medium ${theme.text} whitespace-nowrap`}>Live events</span>
    </div>

    {/* Past Events - Right */}
    <div
      className="flex items-center gap-1 cursor-pointer rounded-xl transition-all duration-200 ml-auto z-10"
      style={{
        boxShadow: activeTab === 'past'
          ? isDark
            ? "inset -17px -17px 34px #1c1f20, inset 17px 17px 34px #26292c"
            : "inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)"
          : 'none',
        backgroundColor: activeTab === 'past' ? (isDark ? "#1a1d20" : "#f0f2f5") : 'transparent',
        padding: "8px 10px",
      }}
      onClick={() => setActiveTab('past')}
    >
      <img src={PastEventIcon} alt="Past events" className={`w-4 h-4 ${!isDark ? "filter brightness-0" : ""}`} />
      <span className={`text-xs font-medium ${theme.text} whitespace-nowrap`}>Past events</span>
    </div>
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
            ? "inset -17px -17px 34px #1c1f20,inset 17px 17px 34px #26292c"
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
            ? "inset -17px -17px 34px #1c1f20,inset 17px 17px 34px #26292c"
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
    <div>
      {/* Desktop: 3 column grid */}
<div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-10 xl:gap-14 tablet-grid w-full">
        {getCurrentEvents().map((event, index) => (
          <div
            key={event._id || `event-${index}`}
            className="rounded-3xl overflow-hidden flex flex-col"
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
                  {event.event_category || "Event Type"}
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
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => {
                    const eventId = event._id || event.id;
                    if (eventId) {
                      navigate(`/ticket/event/${eventId}`);
                    } else {
                      console.warn("No event ID found for navigation");
                    }
                  }}
                  className="px-10 py-2 rounded-full text-white text-sm font-medium ml-4"
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

      {/* Mobile: 2 column grid */}
      <div className="md:hidden grid grid-cols-2 gap-3">
        {getCurrentEvents().map((event, index) => (
          <div
            key={event._id || `event-${index}`}
            className="rounded-2xl overflow-hidden flex flex-col h-[240px]"
            style={{
              backgroundColor: isDark ? "#212426" : "#ffffff",
              boxShadow: theme.smallCardShadow,
            }}
          >
            {/* Event Image */}
            <div className="p-2">
              <img
                src={
                  event.event_banner ||
                  event.event_logo ||
                  event.event_image ||
                  "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2"
                }
                alt={event.event_name || "Event"}
                className="rounded-xl h-[100px] w-full object-cover"
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2";
                }}
              />
            </div>

            {/* Event Info */}
            <div className="flex flex-col flex-1 p-2 justify-between">
              <div className="text-center mb-2">
                <h3 className={`font-bold text-sm ${theme.text} truncate`}>
                  {event.event_name ||"Event"}
                </h3>
                <p className={`text-xs ${theme.subText} mt-1 truncate`}>
                  {event.event_category || "Event Type"}
                </p>
              </div>

              {/* Stats */}
              <div className="flex justify-center items-center gap-3 text-xs">
                <div className="flex flex-col items-center">
                  <img
                    src={LikeIcon}
                    alt="Likes"
                    className={`w-3 h-3 ${!isDark ? "filter brightness-0" : ""}`}
                  />
                  <span className={theme.subText}>
                    {event.likes || event.likesCount || "0"}
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <img
                    src={TicketIcon}
                    alt="Tickets"
                    className={`w-3 h-3 ${!isDark ? "filter brightness-0" : ""}`}
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
                    className={`w-3 h-3 ${!isDark ? "filter brightness-0" : ""}`}
                  />
                  <span className={theme.subText}>
                    {event.shares || event.sharesCount || "0"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
</div>
                </>
              )}
            </div>
          </main>

        </div>
        {/* Group Selection Modal */}
        <GroupSelectionModal />
      </div>
      <div >
      <BottomNavigation 
        theme={theme}
        user={user}
      />
      </div>
    </>
  );
};
export default ProfilePage;
