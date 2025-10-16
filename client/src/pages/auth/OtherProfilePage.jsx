import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMe } from "../../services/userService";
import { getOtherProfile, findAllActiveUsers, followUser, unfollowUser, checkIsFollowing} from "../../services/authService";
import { getOthersEvents } from "../../services/ticketService";

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
import VerifiedIcon from "../../assets/PROFILEPAGE/VerifiedIcon.svg"
import AllEventsIcon from "../../assets/PROFILEPAGE/AllEventsIcon.svg";
import LiveEventIcon from "../../assets/PROFILEPAGE/LiveEventIcon.svg";
import LikeIcon from "../../assets/PROFILEPAGE/LikeIcon.svg";
import SendIcon from "../../assets/PROFILEPAGE/SendIcon.svg";
import RightArrowIcon from "../../assets/PROFILEPAGE/RightArrowIcon.svg"
import HandBurgerIcon from "../../assets/PROFILEPAGE/HandburgerIcon.svg"
import ProfileImage from "../../assets/PROFILEPAGE/ProfileImage.png";
import GroupIcon from "../../assets/PROFILEPAGE/GroupIcon.svg";


// Bottom Nav Icons
import HomeIcon from "../../assets/HomePage/HomeIcon.svg";
import TicketIcon from "../../assets/HomePage/TicketIcon.svg";
import SpeakerIcon from "../../assets/HomePage/SpeakerIcon.svg";

const HEADER_HEIGHT = 72;

// Custom scrollbar styles
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

const OtherProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [profileUserEvents, setProfileUserEvents] = useState([]);
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [followingMap, setFollowingMap] = useState({});
  const [followingStates, setFollowingStates] = useState({});

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  // Fetch current user (logged-in user)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await getMe();
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Failed to fetch current user", err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch profile user using the real API
  useEffect(() => {
    const fetchProfileUser = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const response = await getOtherProfile(userId);
        console.log("Other profile API response:", response);
        console.log("User data:", response?.user);
        
        if (response?.user) {
          const userData = Array.isArray(response.user) ? response.user[0] : response.user;
          console.log("Setting profile user:", userData);
          console.log("IsFollowing value:", userData.isFollowing);
          
          setProfileUser(userData);
          setIsFollowing(userData.isFollowing === true);
        } else {
          console.error("User not found in response");
          navigate("/profile");
        }
      } catch (err) {
        console.error("Failed to fetch profile user", err);
        navigate("/profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileUser();
  }, [userId, navigate]);

  useEffect(() => {
    const fetchProfileUserEvents = async () => {
      if (!userId) return;

      setEventsLoading(true);
      try {
        const response = await getOthersEvents(userId);
        console.log("Events API Response:", response);
        console.log("Tickets array:", response?.tickets);
        
        let events = [];
        
        if (response?.tickets && Array.isArray(response.tickets)) {
          events = response.tickets;
          console.log(`Found ${events.length} events for user ${userId}`);
        } else if (response?.data?.tickets && Array.isArray(response.data.tickets)) {
          events = response.data.tickets;
        } else if (response?.events && Array.isArray(response.events)) {
          events = response.events;
        } else if (response?.data?.events && Array.isArray(response.data.events)) {
          events = response.data.events;
        } else if (Array.isArray(response?.data)) {
          events = response.data;
        } else if (Array.isArray(response)) {
          events = response;
        }

        console.log("Setting events:", events);
        setProfileUserEvents(events);
      } catch (err) {
        console.error("Error fetching events:", err);
        console.error("Error details:", err.response?.data);
        setProfileUserEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchProfileUserEvents();
  }, [userId]);

  // Fetch suggestions
  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await findAllActiveUsers();
        let allUsers = [];
        
        if (response?.data?.users) {
          allUsers = response.data.users;
        } else if (response?.users) {
          allUsers = response.users;
        } else if (Array.isArray(response?.data)) {
          allUsers = response.data;
        } else if (Array.isArray(response)) {
          allUsers = response;
        }
        
        const filteredUsers = allUsers.filter(user => {
          const userIdToCheck = user._id || user.id;
          const currentUserIdToCheck = currentUser?._id || currentUser?.id;
          
          return userIdToCheck !== userId && 
                userIdToCheck !== currentUserIdToCheck;
        });
        
        setUsers(filteredUsers);
      } catch (err) {
        console.error("Failed to fetch active users:", err);
        setUsers([]);
      }
    };
    
    if (currentUser && userId) {
      fetchActiveUsers();
    }
  }, [userId, currentUser]);

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
  useEffect(() => {
    const checkFollowStatuses = async () => {
      if (!users || !Array.isArray(users) || users.length === 0) {
        console.log('No users to check follow status for');
        return;
      }
      
      const statuses = {};
      
      for (const suggestUser of users) {
        try {
          // Make sure suggestUser has an _id or id
          const userId = suggestUser._id || suggestUser.id;
          if (!userId) {
            console.warn('User without ID found:', suggestUser);
            continue;
          }
          
          const response = await checkIsFollowing(userId);
          statuses[userId] = response.isFollowing || false;
        } catch (err) {
          console.error(`Error checking follow status:`, err);
          const userId = suggestUser._id || suggestUser.id;
          if (userId) {
            statuses[userId] = false;
          }
        }
      }
      
      setFollowingMap(statuses);
    };
    
    checkFollowStatuses();
  }, [users]);

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !profileUser) return;
    
    setFollowLoading(true);
    
    const originalIsFollowing = isFollowing;
    const originalCount = parseInt(profileUser.followersCount || profileUser.followers || 0);

    try {
      if (isFollowing) {
        // Optimistic update for unfollow
        setIsFollowing(false);
        setProfileUser(prev => ({
          ...prev,
          followers: Math.max(0, originalCount - 1).toString(),
          followersCount: Math.max(0, originalCount - 1),
        }));

        const response = await unfollowUser(userId);
        console.log("Unfollow response", response);
      } else {
        // Optimistic update for follow
        setIsFollowing(true);
        setProfileUser(prev => ({
          ...prev,
          followers: (originalCount + 1).toString(),
          followersCount: originalCount + 1,
        }));

        const response = await followUser(userId);
        console.log("Follow response", response);
      }

      // Refresh profile data
      setTimeout(async () => {
        try {
          const refreshed = await getOtherProfile(userId);
          if (refreshed?.user) {
            const userData = Array.isArray(refreshed.user) ? refreshed.user[0] : refreshed.user;
            setProfileUser(userData);
            setIsFollowing(userData.isFollowing === true);
            console.log("Refreshed - isFollowing:", userData.isFollowing);
          }
        } catch (refreshErr) {
          console.error("Failed to refresh profile", refreshErr);
        }
      }, 500);
    } catch (err) {
      console.error("Failed to toggle follow status", err);
      
      // Handle "already following" error - just sync with server
      if (err.response?.data?.message?.includes('already following')) {
        console.log("Already following - syncing state");
        setIsFollowing(true);
        // Don't show alert, just refresh
        setTimeout(async () => {
          const refreshed = await getOtherProfile(userId);
          if (refreshed?.user) {
            const userData = Array.isArray(refreshed.user) ? refreshed.user[0] : refreshed.user;
            setProfileUser(userData);
            setIsFollowing(userData.isFollowing === true);
          }
        }, 100);
      } else if (err.response?.data?.message?.includes('not following')) {
        console.log("Not following - syncing state");
        setIsFollowing(false);
        // Refresh without alert
        setTimeout(async () => {
          const refreshed = await getOtherProfile(userId);
          if (refreshed?.user) {
            const userData = Array.isArray(refreshed.user) ? refreshed.user[0] : refreshed.user;
            setProfileUser(userData);
            setIsFollowing(userData.isFollowing === true);
          }
        }, 100);
      } else {
        // Rollback on other errors
        setIsFollowing(originalIsFollowing);
        setProfileUser(prev => ({
          ...prev,
          followers: originalCount.toString(),
          followersCount: originalCount,
        }));
        alert(err.response?.data?.message || "Failed to update follow status");
      }
    } finally {
      setFollowLoading(false);
    }
  };
  const handleSuggestionFollowToggle = async (suggestedUserId) => {
    if (!suggestedUserId || !users || users.length === 0) return;
    const key = suggestedUserId;
    setFollowingStates(prev => ({ ...prev, [key]: true }));
    const isCurrentlyFollowing = followingMap[key] || false;
    const originalFollowState = isCurrentlyFollowing;
    
    try {
      if (isCurrentlyFollowing) {
        // UNFOLLOW FLOW
        // Optimistic update - update UI immediately
        setFollowingMap(prev => ({ ...prev, [key]: false }));
        
        // Update users list - decrement follower count BUT DON'T REMOVE USER
        setUsers(prev => prev.map(u => {
          if ((u._id || u.id) === suggestedUserId) {
            const currentCount = parseInt(u.followersCount || u.followers || 0);
            return {
              ...u,
              followersCount: Math.max(0, currentCount - 1),
              followers: Math.max(0, currentCount - 1).toString()
            };
          }
          return u;
        }));
        
        // Make API call
        const response = await unfollowUser(suggestedUserId);
        console.log("Unfollow response:", response);
        
      } else {
        // FOLLOW FLOW
        // Optimistic update - update UI immediately
        setFollowingMap(prev => ({ ...prev, [key]: true }));
        
        // Update users list - increment follower count
        setUsers(prev => prev.map(u => {
          if ((u._id || u.id) === suggestedUserId) {
            const currentCount = parseInt(u.followersCount || u.followers || 0);
            return {
              ...u,
              followersCount: currentCount + 1,
              followers: (currentCount + 1).toString()
            };
          }
          return u;
        }));
        
        // Make API call
        const response = await followUser(suggestedUserId);
        console.log("Follow response:", response);
      }
    } catch (err) {
      console.error('Error toggling follow status:', err);
      
      // ROLLBACK on error - revert all changes
      setFollowingMap(prev => ({ ...prev, [key]: originalFollowState }));
      
      if (isCurrentlyFollowing) {
        // Was unfollowing, revert back to following
        setUsers(prev => prev.map(u => {
          if ((u._id || u.id) === suggestedUserId) {
            const currentCount = parseInt(u.followersCount || u.followers || 0);
            return {
              ...u,
              followersCount: currentCount + 1,
              followers: (currentCount + 1).toString()
            };
          }
          return u;
        }));
      } else {
        // Was following, revert back to not following
        setUsers(prev => prev.map(u => {
          if ((u._id || u.id) === suggestedUserId) {
            const currentCount = parseInt(u.followersCount || u.followers || 0);
            return {
              ...u,
              followersCount: Math.max(0, currentCount - 1),
              followers: Math.max(0, currentCount - 1).toString()
            };
          }
          return u;
        }));
      }
      
      // Show error alert
      alert(err.response?.data?.message || 'Failed to update follow status');
    } finally {
      // Clear loading state for this user
      setFollowingStates(prev => ({ ...prev, [key]: false }));
    }
  };
  const handleHandburgerClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleBlock = () => {
    alert("Block user feature coming soon!");
    handleCloseModal();
  };

  const handleRestrict = () => {
    alert("Restrict user feature coming soon!");
    handleCloseModal();
  };

  const handleReport = () => {
    alert("Report user feature coming soon!");
    handleCloseModal();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profileUser.name}'s Profile`,
        text: `Check out ${profileUser.name}'s profile on WIE`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Profile link copied to clipboard!');
      });
    }
    handleCloseModal();
  };

  const handleSendMessage = () => {
    alert("Send message feature coming soon!");
    handleCloseModal();
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profileUser.name}'s Profile`,
        text: `Check out ${profileUser.name}'s profile on WIE`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Profile link copied to clipboard!');
      });
    }
  };

  const handleInviteToGroup = () => {
    console.log(`Inviting ${profileUser.name} to group`);
    alert(`Invite to group feature will be implemented soon!`);
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

  // Helper function to categorize events based on dates
  const categorizeEvents = (tickets) => {
    const now = new Date();
    const all = [];
    const live = [];
    const past = [];

    tickets.forEach(ticket => {
      all.push(ticket);

      const eventDate = ticket.event_date || ticket.eventDate || ticket.date;
      const eventEndDate = ticket.event_end_date || ticket.eventEndDate || ticket.endDate;
      const eventStatus = ticket.status || ticket.eventStatus;

      if (eventDate) {
        const startDate = new Date(eventDate);
        const endDate = eventEndDate ? new Date(eventEndDate) : startDate;

        if (startDate <= now && endDate >= now) {
          live.push(ticket);
        } else if (endDate < now) {
          past.push(ticket);
        }
      } else if (eventStatus) {
        if (eventStatus.toLowerCase() === 'live' || eventStatus.toLowerCase() === 'active') {
          live.push(ticket);
        } else if (eventStatus.toLowerCase() === 'completed' || eventStatus.toLowerCase() === 'ended') {
          past.push(ticket);
        }
      }
    });

    return { all, live, past };
  };

  // Get filtered events based on active tab
  const getFilteredEvents = () => {
    const { all, live, past } = categorizeEvents(profileUserEvents);
    
    switch (activeTab) {
      case 'live':
        return live;
      case 'past':
        return past;
      default:
        return all;
    }
  };

  const filteredEvents = getFilteredEvents();

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

  const displayName = currentUser?.name || "User";

  const BottomNavigation = () => (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[95%] md:hidden">
      <div className={`flex justify-around items-center py-3 px-4 rounded-full ${theme.cardBg} ${theme.border} ${isDark ? 'shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(60,60,60,0.3)]' : 'shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.8)]'}`}>
        {[
          { to: "/home", icon: HomeIcon, label: "Home" }, 
          { to: "/ticket/events", icon: TicketIcon, label: "Tickets" }, 
          { to: "/ticket/create-event", icon: PlusIcon, label: "Create", special: true }, 
          { to: "/ticket/live-events", icon: SpeakerIcon, label: "Live Events" }, 
          { to: "/profile", label: "Profile", profile: true },
        ].map(({ to, icon, label, special, profile }) => 
          special ? (
            <div key={label} className="relative">
              <Link to={to}>
                <button 
                  style={{ 
                    boxShadow: isDark ? "-2px -2px 4px rgba(60,60,60,0.3), 2px 2px 4px rgba(0,0,0,0.6)" : "-2px -2px 4px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.15)", 
                  }} 
                  className="w-8 h-8 rounded-full bg-[#21d18b] flex items-center justify-center transition hover:scale-105"
                >
                  <img src={icon} alt="Create" className="w-6 h-6 invert brightness-0" />
                </button>
              </Link>
            </div>
          ) : (
            <Link key={label} to={to} className="flex items-center justify-center p-2">
              {profile ? (
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#6a47fa] flex items-center justify-center text-white font-bold">
                  {displayName.charAt(0).toUpperCase()}
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

  if (loading || !profileUser) {
    return (
      <div className={`${theme.bg} ${theme.text} min-h-screen flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`text-lg ${theme.text}`}>Loading profile...</p>
        </div>
      </div>
    );
  }

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
            <img src={WieLogo} alt="Wie Logo" className="w-10 h-10 lg:w-12 lg:h-12" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <SideBar user={currentUser} theme={theme} />
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

          <main className="flex-1 p-3 md:p-4 lg:p-6 overflow-y-auto overflow-x-hidden pb-24 md:pb-4 nest-hub-content max-w-full">
            <div className="max-w-7xl mx-auto space-y-3 md:space-y-4 lg:space-y-6 nest-hub-spacing w-full px-0 md:px-2 lg:px-4">
              {/* Profile Card */}
              <div className={`rounded-2xl md:rounded-3xl lg:rounded-[3rem] p-4 md:p-4 lg:p-6 mt-2 md:mt-4 lg:mt-8 ${theme.cardBg} nest-hub-card transition-all duration-300 w-full overflow-hidden`} style={{boxShadow: theme.cardShadow}}>
                {/* Mobile Layout */}
                <div className="flex md:hidden flex-col space-y-4">
                  {/* Profile Image and Name - Horizontal */}
                  <div className="flex items-start gap-4">
                    <img 
                      src={profileUser.image ? `${import.meta.env.VITE_AUTH_API_BASE_URL}/uploads/${profileUser.image}` : ProfileImage}
                      alt="Profile"
                      className={`w-20 h-20 rounded-full object-cover border-2 flex-shrink-0 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h1 className={`text-lg font-bold ${theme.text}`}>{profileUser.name}</h1>
                        <img src={VerifiedIcon} alt="Verified" className="w-4 h-4 flex-shrink-0" />
                      </div>
                      <p className={`text-sm ${theme.subText} mb-2`}>{profileUser.username}</p>
                    </div>
                  </div>
                  {/* Bio */}
                  <div className="w-full">
                    <p className={`text-xs leading-5 ${theme.subText} whitespace-pre-line`}>
                      {profileUser.bio}</p>
                  </div>
                  {/* Stats Row */}
                  <div className="flex items-center gap-6">
                    <div className="text-left">
                      <p className={`${theme.text}`}>
                        <span className="text-base font-bold">{profileUser.eventsCount || profileUserEvents.length || 0}</span>
                        <span className={`text-sm ml-1 ${theme.subText}`}>Event created</span>
                      </p>
                    </div>
                    <div className="text-left">
                      <p className={`${theme.text}`}>
                        <span className="text-base font-bold">{profileUser.followersCount || profileUser.followers || 0}</span>
                        <span className={`text-sm ml-1 ${theme.subText}`}>Followers</span>
                      </p>
                    </div>
                    <div className="text-left">
                      <p className={`${theme.text}`}>
                        <span className="text-base font-bold">{profileUser.following || 0}</span>
                        <span className={`text-sm ml-1 ${theme.subText}`}>Following</span>
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 items-stretch">
                    <button 
                      onClick={handleFollowToggle} 
                      disabled={followLoading}
                      className={`flex-1 min-w-0 py-2.5 px-2 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                        followLoading ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        isFollowing
                          ? 'text-white bg-gradient-to-b from-gray-600 to-gray-700 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:brightness-110'
                          : 'text-white bg-gradient-to-b from-indigo-500 to-blue-500 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:brightness-110'
                      }`}
                    >
                      <span className="block truncate">
                        {followLoading ? (
                          <span className="flex items-center justify-center gap-1">
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span className="truncate">{isFollowing ? "Unfollowing" : "Following"}</span>
                          </span>
                        ) : (
                          isFollowing ? "Unfollow" : "Follow +"
                        )}
                      </span>
                    </button>
                    <button
                      onClick={handleInviteToGroup}
                      className={`flex-1 min-w-0 py-2.5 px-2 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                        isDark
                          ? 'text-white bg-gradient-to-b from-[#3a3b3f] to-[#2c2d30] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:brightness-110'
                          : 'text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 shadow-md hover:shadow-lg hover:from-gray-200 hover:to-gray-300'
                      }`}
                    >
                      <span className="block truncate">Invite to group</span>
                    </button>
                    <button
                      onClick={handleShareProfile}
                      className={`flex-1 min-w-0 py-2.5 px-2 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                        isDark
                          ? 'text-white bg-gradient-to-b from-[#3a3b3f] to-[#2c2d30] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:brightness-110'
                          : 'text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 shadow-md hover:shadow-lg hover:from-gray-200 hover:to-gray-300'
                      }`}
                    >
                      <span className="block truncate">Insight profile</span>
                    </button>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:flex justify-between items-center gap-6">
                  {/* Left side */}
                  <div className="flex items-start gap-6">
                    <img 
                      src={profileUser.image ? `${import.meta.env.VITE_AUTH_API_BASE_URL}/uploads/${profileUser.image}` : ProfileImage}
                      alt="Profile"
                      className={`w-32 h-32 md:w-36 md:h-36 lg:w-48 lg:h-48 rounded-full object-cover border-4 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                    />
                    
                    <div className="space-y-1 md:space-y-2 flex-1">
                      <h1 className={`text-xl md:text-xl lg:text-2xl font-bold ${theme.text}`}>{profileUser.name}</h1>
                      <p className={`text-xs md:text-sm ${theme.subText}`}>{profileUser.username}</p>
                      <p className={`whitespace-pre-line text-left text-xs md:text-sm leading-5 md:leading-6 break-words ${theme.subText}`}>
                        {profileUser.bio}</p>
                      <div className="flex gap-2 md:gap-3 pt-2 md:pt-3 flex-wrap">
                        <button 
                          onClick={handleFollowToggle} 
                          disabled={followLoading}
                          className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            followLoading ? 'opacity-50 cursor-not-allowed' : ''
                          } ${
                            isFollowing
                              ? 'text-white bg-gradient-to-b from-gray-600 to-gray-700 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:brightness-110'
                              : 'text-white bg-gradient-to-b from-indigo-500 to-blue-500 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:brightness-110'
                          }`}
                        >
                          {followLoading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              {isFollowing ? "Unfollowing..." : "Following..."}
                            </span>
                          ) : (
                            isFollowing ? "Unfollow" : "Follow +"
                          )}
                        </button>
                        <button 
                          onClick={handleShareProfile}
                          className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            isDark 
                              ? 'text-white bg-gradient-to-b from-[#3a3b3f] to-[#2c2d30] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:brightness-110' 
                              : 'text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 shadow-md hover:shadow-lg hover:from-gray-200 hover:to-gray-300'
                          }`}
                        >
                          Share profile
                        </button>
                        <button 
                          onClick={handleInviteToGroup}
                          className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            isDark 
                              ? 'text-white bg-gradient-to-b from-[#3a3b3f] to-[#2c2d30] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:brightness-110' 
                              : 'text-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 shadow-md hover:shadow-lg hover:from-gray-200 hover:to-gray-300'
                          }`}
                        >
                          Invite to group
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side */}
                  <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div style={{ boxShadow: theme.notificationShadow }} className={`w-12 h-12 rounded-full flex items-center justify-center ${theme.bg}`}>
                          <img src={NotificationIcon} alt="Notification" className={`w-5 h-5 ${isDark ? 'filter brightness-0 invert' : 'filter brightness-0'}`} />
                        </div>
                      </div>
                      <button 
                        onClick={handleHandburgerClick}
                        className={`w-10 h-10 flex items-center justify-center ${theme.bg}`}
                      >
                        <img src={HandBurgerIcon} alt="Menu" className={`w-10 h-10 ${isDark ? 'filter brightness-0 invert' : 'filter brightness-0'}`} />
                      </button>
                    </div>
                    
                    {/* Stats */}
                    <div className={`rounded-[2rem] md:rounded-[2.5rem] px-6 md:px-8 lg:px-10 py-3 md:py-3.5 lg:py-4 flex gap-4 md:gap-6 lg:gap-8 transition-all duration-300 ${theme.cardBg}`} style={{boxShadow: theme.smallCardShadow}}>
                      <div className="text-center flex flex-col items-center gap-1 md:gap-1.5">
                        <img src={EventIcon} alt="Event" className={`w-5 h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 ${!isDark ? "filter brightness-0" : ""}`} />
                        <p className={`text-2xl md:text-2xl lg:text-3xl font-bold ${theme.text}`}>{profileUser.eventsCount || profileUserEvents.length || 0}</p>
                        <p className={`text-xs md:text-xs lg:text-sm ${theme.subText}`}>Event created</p>
                      </div>
                      <div className="text-center flex flex-col items-center gap-1 md:gap-1.5">
                        <img src={FollowersIcon} alt="Followers" className={`w-5 h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 ${!isDark ? "filter brightness-0" : ""}`} />
                        <p className={`text-2xl md:text-2xl lg:text-3xl font-bold ${theme.text}`}>{profileUser.followersCount || profileUser.followers || 0}</p>
                        <p className={`text-xs md:text-xs lg:text-sm ${theme.subText}`}>Follower</p>
                      </div>
                      <div className="text-center flex flex-col items-center gap-1 md:gap-1.5">
                        <img src={FollowingIcon} alt="Following" className={`w-5 h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 ${!isDark ? "filter brightness-0" : ""}`} />
                        <p className={`text-2xl md:text-2xl lg:text-3xl font-bold ${theme.text}`}>{profileUser.following || 0}</p>
                        <p className={`text-xs md:text-xs lg:text-sm ${theme.subText}`}>Following</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Modal */}
                {isModalOpen && (
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
                    onClick={handleCloseModal}
                  >
                    <div
                      className="bg-[#212426] rounded-xl w-[400px] max-w-[90%] overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button className="w-full py-3.5 text-[#ed4956] font-semibold hover:bg-[#232526] transition text-center border-b border-[#363636]" onClick={handleBlock}>Block</button>
                      <button className="w-full py-3.5 text-[#ed4956] font-semibold hover:bg-[#232526] transition text-center border-b border-[#363636]" onClick={handleRestrict}>Restrict</button>
                      <button className="w-full py-3.5 text-[#ed4956] font-semibold hover:bg-[#232526] transition text-center border-b border-[#363636]" onClick={handleReport}>Report</button>
                      <button className="w-full py-3.5 text-white font-normal hover:bg-[#232526] transition text-center border-b border-[#363636]" onClick={handleShare}>Share to...</button>
                      <button className="w-full py-3.5 text-white font-normal hover:bg-[#232526] transition text-center border-b border-[#363636]" onClick={handleSendMessage}>Send message</button>
                      <button className="w-full py-3.5 text-white font-normal hover:bg-[#232526] transition text-center" onClick={handleCloseModal}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div className={`rounded-xl md:rounded-2xl p-3 md:p-4 lg:p-6 nest-hub-card transition-all duration-300 w-full overflow-hidden`}>
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
                  {showLeftArrow && users.length > 0 && (
                    <button
                      onClick={scrollLeft}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full"
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
                          className="w-[200px] md:w-[246px] h-[280px] md:h-[363px] flex-shrink-0 rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 hover:scale-105 cursor-pointer"
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
                                className="w-full h-[120px] md:h-[160px] object-cover rounded-2xl"
                              />
                            </div>
                            <div className="px-1" style={{ marginTop: "2rem" }}>
                              <div className="flex items-center gap-2 mb-1 justify-center">
                                <h3 className={`text-base font-semibold ${theme.text} truncate`}>{suggestedUser.name}</h3>
                                <img src={VerifiedIcon} alt="Verified" className="w-4 h-4 flex-shrink-0"/>
                              </div>
                              <p className={`text-sm ${theme.subText} capitalize text-center`}>{suggestedUser.role || "User"}</p>
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
                      width: "100%",
                    }}
                  >
                    <div className="flex items-center w-full relative gap-2" style={{ minHeight: '44px' }}>
                      {/* All Events - Left */}
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
                        <img src={AllEventsIcon} alt="All events" className={`w-4 h-4 ${!isDark ? "filter brightness-0" : ""}`} />
                        <span className={`text-xs font-medium ${theme.text} whitespace-nowrap`}>All events</span>
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
                        onClick={() => setActiveTab('group')}
                      >
                        <img src={GroupIcon} alt="Past events" className={`w-4 h-4 ${!isDark ? "filter brightness-0" : ""}`} />
                        <span className={`text-xs font-medium ${theme.text} whitespace-nowrap`}>Groups</span>
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
                      className={`flex items-center gap-2 cursor-pointer mx-auto p-3 rounded-xl transition-all duration-200 ${activeTab === 'live' ? '' : 'opacity-60'}`}
                      style={{
                        boxShadow: activeTab === 'live' ? (isDark
                          ? "inset 2px 2px 4px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(255,255,255,0.1)"
                          : "inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)") : 'none',
                        backgroundColor: activeTab === 'live' ? (isDark ? "#1a1d20" : "#f0f2f5") : 'transparent',
                      }}
                      onClick={() => setActiveTab('live')}
                    >
                      <img src={LiveEventIcon} alt="Live events" className={`w-8 h-8 ${!isDark ? "filter brightness-0" : ""}`}/>
                      <span className={`text-sm font-medium ${theme.text}`}>Live Events</span>
                    </div>

                    <div 
                      className={`flex items-center gap-2 cursor-pointer -mr-2 p-4 rounded-xl transition-all duration-200 ${activeTab === 'past' ? '' : 'opacity-60'}`}
                      style={{
                        boxShadow: activeTab === 'past' ? (isDark
                          ? "inset 2px 2px 4px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(255,255,255,0.1)"
                          : "inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)") : 'none',
                        backgroundColor: activeTab === 'past' ? (isDark ? "#1a1d20" : "#f0f2f5") : 'transparent',
                      }}
                      onClick={() => setActiveTab('past')}
                    >
                      <img src={GroupIcon} alt="Groups" className={`w-7 h-7 ${!isDark ? "filter brightness-0" : ""}`}/>
                      <span className={`text-sm font-medium ${theme.text}`}>Groups</span>
                    </div>
                  </div>
                </div>

                {/* Events Content */}
                {eventsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className={`text-sm ${theme.subText}`}>Loading events...</p>
                  </div>
                ) : filteredEvents.length > 0 ? (
                  <div>
                    {/* Desktop: 3 column grid */}
                    <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-10 xl:gap-14 tablet-grid w-full">
                      {filteredEvents.map((event, index) => (                       
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
                              src={event.event_banner || event.event_logo || event.event_image || event.banner || event.image || "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2"}
                              alt={event.event_name || event.name || "Event"}
                              className="rounded-[1rem] h-70 w-full object-cover border-2 border-white border-opacity-50"
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2";
                              }}
                            />
                          </div>

                          {/* Event Info */}
                          <div className="flex flex-col flex-1 p-4">
                            <div className="text-center mb-6">
                              <h3 className={`font-bold text-base ${theme.text}`}>{event.event_name || event.name || "Event"}</h3>
                              <p className={`text-sm ${theme.subText} mt-1`}>{event.event_category || event.category || "Event Type"}</p>
                            </div>

                            {/* Stats */}
                            <div className="flex justify-center items-center gap-20 text-sm mb-3">
                              <div className="flex flex-col items-center">
                                <img src={LikeIcon} alt="Likes" className={`w-5 h-5 ${!isDark ? "filter brightness-0" : ""}`}/>
                                <span className={theme.subText}>{event.likes || event.likesCount || "0"}</span>
                              </div>

                              <div className="flex flex-col items-center">
                                <img src={TicketIcon} alt="Tickets" className={`w-5 h-5 ${!isDark ? "filter brightness-0" : ""}`}/>
                                <span className={theme.subText}>{event.ticketsSold || event.registrations || event.attendeesCount || event.ticket_count || event.ticketCount || "0"}</span>
                              </div>

                              <div className="flex flex-col items-center">
                                <img src={SendIcon} alt="Shares" className={`w-5 h-5 ${!isDark ? "filter brightness-0" : ""}`}/>
                                <span className={theme.subText}>{event.shares || event.sharesCount || "0"}</span>
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
                      {filteredEvents.map((event, index) => (
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
                                event.banner ||
                                event.image ||
                                "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2"
                              }
                              alt={event.event_name || event.name || "Event"}
                              className="rounded-xl h-[100px] w-full object-cover"
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2";
                              }}
                            />
                          </div>

                          {/* Event Info */}
                          <div className="flex flex-col flex-1 p-2 justify-between">
                            <div className="text-center mb-2">
                              <h3 className={`font-bold text-sm ${theme.text} truncate`}>
                                {event.event_name || event.name || "Event"}
                              </h3>
                              <p className={`text-xs ${theme.subText} mt-1 truncate`}>
                                {event.event_category || event.category || "Event Type"}
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
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 md:py-24">
                    <div className={`w-24 h-24 rounded-full ${theme.cardBg} flex items-center justify-center mb-6`} style={{boxShadow: theme.smallCardShadow}}>
                      <img src={EventIcon} alt="No Events" className={`w-12 h-12 opacity-50 ${!isDark ? 'filter brightness-0' : ''}`} />
                    </div>
                    <h3 className={`text-xl font-medium ${theme.text} mb-4`}>No {activeTab !== 'all' ? activeTab : ''} events found</h3>
                    <p className={`text-sm ${theme.subText} text-center max-w-md`}>{profileUser.name} hasn't created any {activeTab !== 'all' ? activeTab : ''} events yet.</p>
                  </div>
                )}
              </div>
            </div>
          </main>
          <BottomNavigation />
        </div>
      </div>
    </>
  );
};
export default OtherProfilePage;
