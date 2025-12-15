import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserData } from "../../services/ticketService";
import { getOtherProfile, findAllActiveUsers, followUser, unfollowUser, checkIsFollowing, logout} from "../../services/authService";
import { getOthersEvents, totalEventsCreatedCount,getOthersPastEvents ,getOtherLiveEvents} from "../../services/ticketService";
import { getImageUrl } from "../../utils/imageUtils.js";
import BottomNavigation from "../../components/HomePage/BottomNavigation.jsx";
import SideBar from "../../components/HomePage/SideBar.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import { useDispatch } from "react-redux";
import { logoutSuccess } from "../../features/auth/authSlice.js";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import WieText from "../../assets/HomePage/WieText.svg";
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
import HandburgerIcon from "../../assets/PROFILEPAGE/HandburgerIcon.svg"
import ProfileImage from "../../assets/PROFILEPAGE/ProfileImage.png";
import GroupIcon from "../../assets/PROFILEPAGE/GroupIcon.svg";
import PastEventIcon from "../../assets/PROFILEPAGE/PastEventIcon.svg";



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
      /* FIX: Tablet buttons disappearing (ONLY tablets) */
@media (min-width: 768px) and (max-width: 1023px) {
  .profile-action-buttons {
    flex-wrap: nowrap !important;
    overflow-x: auto;
    overflow-y: hidden;
    gap: 0.75rem;
    padding-bottom: 6px;
  }

  /* 🔧 PREVENT BUTTONS FROM SHRINKING INTO CIRCLES */
  .profile-action-buttons > button {
    flex-shrink: 0;
    white-space: nowrap;
    min-height: 40px;
    border-radius: 9999px;
  }

  .profile-action-buttons::-webkit-scrollbar {
    display: none;
  }
}


  `}</style>
);

const OtherProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [userImage, setUserImage] = useState(null);
  const [profileUserEvents, setProfileUserEvents] = useState([]); // optional keep for backward compatibility
  const [allEvents, setAllEvents] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
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
  const [eventCountsMap, setEventCountsMap] = useState({});
  const [showMobileHamburgerMenu, setShowMobileHamburgerMenu] = useState(false);
  const mobileHamburgerRef = useRef(null);
  const parseApiResponse = (response) => {
  try {
    if (!response) {
      console.log("[parseApiResponse] No response provided");
      return [];
    }

    console.log("[parseApiResponse] Input:", response);

    // Handle axios-style responses
    let payload = response;
    if (response.data !== undefined) {
      payload = response.data;
      console.log("[parseApiResponse] Unwrapped response.data:", payload);
    }

    // If payload itself has a data property, unwrap again
    if (payload && payload.data !== undefined) {
      payload = payload.data;
      console.log("[parseApiResponse] Unwrapped payload.data:", payload);
    }

    // Direct array
    if (Array.isArray(payload)) {
      console.log("[parseApiResponse] Found array, length:", payload.length);
      return payload;
    }

    // Check for common event array keys
    const eventKeys = ['tickets', 'events', 'data'];
    for (const key of eventKeys) {
      if (payload?.[key] && Array.isArray(payload[key])) {
        console.log(`[parseApiResponse] Found array at payload.${key}, length:`, payload[key].length);
        return payload[key];
      }
    }

    // Check nested data.tickets or data.events
    if (payload?.data) {
      for (const key of eventKeys) {
        if (payload.data[key] && Array.isArray(payload.data[key])) {
          console.log(`[parseApiResponse] Found array at payload.data.${key}, length:`, payload.data[key].length);
          return payload.data[key];
        }
      }
    }

    // Last resort: find any array in the object
    if (typeof payload === "object" && payload !== null) {
      const keys = Object.keys(payload);
      for (const key of keys) {
        if (Array.isArray(payload[key]) && payload[key].length > 0) {
          console.log(`[parseApiResponse] Found array at payload.${key}, length:`, payload[key].length);
          return payload[key];
        }
      }
    }

    // Fallback: check if original response is an array
    if (Array.isArray(response)) {
      console.log("[parseApiResponse] Original response is array, length:", response.length);
      return response;
    }

    console.warn("[parseApiResponse] Could not find array in response");
    return [];
  } catch (err) {
    console.error("[parseApiResponse] Error:", err);
    return [];
  }
};


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
        const userData = await getUserData();
        setCurrentUser(userData);
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
        if (response?.user) {
          const userData = Array.isArray(response.user) ? response.user[0] : response.user;
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

//   useEffect(() => {
//   // fetch all events for the profile user and categorize them
//   const fetchAllEvents = async () => {
//     if (!userId) {
//       console.warn("[OtherProfilePage] fetchAllEvents: no userId, skipping");
//       setAllEvents([]);
//       setLiveEvents([]);
//       setPastEvents([]);
//       setEventsLoading(false);
//       return;
//     }

//     setEventsLoading(true);
//     try {
//       // pass userId to the service
//       const response = await getOthersEvents(userId);
//       console.log("[OtherProfilePage] getOthersEvents raw response:", response);

//       const tickets = parseApiResponse(response);
//       console.log("[OtherProfilePage] parsed tickets length:", Array.isArray(tickets) ? tickets.length : 0);

//       if (tickets && tickets.length > 0) {
//         const { all, live, past } = categorizeEvents(tickets);
//         setAllEvents(all);
//         setLiveEvents(live);
//         setPastEvents(past);
//       } else {
//         setAllEvents([]);
//         setLiveEvents([]);
//         setPastEvents([]);
//         console.warn("[OtherProfilePage] no tickets parsed from getOthersEvents");
//       }
//     } catch (err) {
//       console.error("Failed to fetch all events:", err?.response?.data || err.message || err);
//       setAllEvents([]);
//       setLiveEvents([]);
//       setPastEvents([]);
//     } finally {
//       setEventsLoading(false);
//     }
//   };

//   fetchAllEvents();
// // run when userId or profileUser changes (profileUser kept for safety)
// }, [userId, profileUser]);


//   // Optional: Fetch live events separately if you have separate endpoints
//     useEffect(() => {
//   const fetchLiveEvents = async () => {
//     if (!userId) {
//       console.warn("[OtherProfilePage] fetchLiveEvents: no userId, skipping");
//       return;
//     }
//     try {
//       const response = await getOtherLiveEvents(userId);
//       console.log("[OtherProfilePage] getOtherLiveEvents raw response:", response);
//       const events = parseApiResponse(response, "live events");
//       if (events && events.length > 0) {
//         // prefer the main fetch if it already populated liveEvents
//         setLiveEvents(prev => (prev && prev.length > 0 ? prev : events));
//       }
//     } catch (err) {
//       console.error("Failed to fetch live events:", err?.response?.data || err.message || err);
//       // don't clear liveEvents here (main fetch is authoritative)
//     }
//   };

//   // only call if we don't have liveEvents from the main fetch
//   if (liveEvents.length === 0) fetchLiveEvents();
// }, [userId, liveEvents.length]);


//     // Optional: Fetch past events separately if you have separate endpoints
//       useEffect(() => {
//   const fetchPastEvents = async () => {
//     if (!userId) {
//       console.warn("[OtherProfilePage] fetchPastEvents: no userId, skipping");
//       return;
//     }

//     try {
//       const response = await getOthersPastEvents(userId);
//       console.log("[OtherProfilePage] getOthersPastEvents raw response:", response);
//       const events = parseApiResponse(response, "past events");
//       if (events && events.length > 0) {
//         setPastEvents(prev => (prev && prev.length > 0 ? prev : events));
//       }
//     } catch (err) {
//       console.error("Failed to fetch past events:", err?.response?.data || err.message || err);
//       // don't clear pastEvents here
//     }
//   };

//   if (pastEvents.length === 0) fetchPastEvents();
// }, [userId, pastEvents.length]);
// Single consolidated effect to fetch and categorize all events
// Single consolidated effect to fetch and categorize all events
useEffect(() => {
  const fetchAndCategorizeEvents = async () => {
    if (!userId) {
      console.warn("[OtherProfilePage] fetchAndCategorizeEvents: no userId, skipping");
      setAllEvents([]);
      setLiveEvents([]);
      setPastEvents([]);
      setEventsLoading(false);
      return;
    }

    setEventsLoading(true);
    console.log("=== FETCHING EVENTS FOR USER:", userId, "===");
    
    try {
      // Fetch only the main events endpoint
      const response = await getOthersEvents(userId);
      console.log("API Response:", response);

      // Parse the response
      const allTickets = parseApiResponse(response);
      console.log("Parsed tickets:", allTickets.length, allTickets);

      if (allTickets && allTickets.length > 0) {
        // Categorize all events into all/live/past
        const categorized = categorizeEvents(allTickets);
        
        console.log("=== CATEGORIZATION RESULTS ===");
        console.log("All Events:", categorized.all.length);
        console.log("Live Events:", categorized.live.length, categorized.live);
        console.log("Past Events:", categorized.past.length, categorized.past);

        // Set the state
        setAllEvents(categorized.all);
        setLiveEvents(categorized.live);
        setPastEvents(categorized.past);
      } else {
        console.warn("No events found");
        setAllEvents([]);
        setLiveEvents([]);
        setPastEvents([]);
      }

    } catch (err) {
      console.error("Failed to fetch events:", err?.response?.data || err.message || err);
      setAllEvents([]);
      setLiveEvents([]);
      setPastEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  fetchAndCategorizeEvents();
}, [userId]);// Only re-run when userId changes


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
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserData(); // Now this is the user object directly
        setUser(userData);
        if (userData.image) {
          const imageUrl = getImageUrl(userData.image, "auth");
          setUserImage(imageUrl);
          sessionStorage.setItem("userImage", imageUrl);
        } else {
          setUserImage(null);
          sessionStorage.removeItem("userImage");
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
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
  useEffect(() => {
    const checkFollowStatuses = async () => {
      if (!users || !Array.isArray(users) || users.length === 0) {
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
  useEffect(() => {
    const fetchEventCounts = async () => {
      try {
        const response = await totalEventsCreatedCount();
        
        if (response?.userEventCounts) {
          const countsMap = {};
          response.userEventCounts.forEach(item => {
            countsMap[item.userId] = item.eventsCount;
          });
          setEventCountsMap(countsMap);
        }
      } catch (err) {
        console.error("Failed to fetch event counts:", err);
        setEventCountsMap({});
      }
    };
    
    fetchEventCounts();
  }, []);
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
      } else {
        // Optimistic update for follow
        setIsFollowing(true);
        setProfileUser(prev => ({
          ...prev,
          followers: (originalCount + 1).toString(),
          followersCount: originalCount + 1,
        }));
        const response = await followUser(userId);
      }
      // Refresh profile data
      setTimeout(async () => {
        try {
          const refreshed = await getOtherProfile(userId);
          if (refreshed?.user) {
            const userData = Array.isArray(refreshed.user) ? refreshed.user[0] : refreshed.user;
            setProfileUser(userData);
            setIsFollowing(userData.isFollowing === true);
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

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem("userData");
      sessionStorage.removeItem("userImage");
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      dispatch(logoutSuccess());
      localStorage.clear();
      navigate("/login");
    }
  };

  const handleMobileHamburgerClick = () => {
    setShowMobileHamburgerMenu(!showMobileHamburgerMenu);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileHamburgerRef.current &&
        !mobileHamburgerRef.current.contains(event.target)
      ) {
        setShowMobileHamburgerMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const HamburgerMenu = ({
    isDesktop = false,
    showMenu,
    handleToggle,
    menuRef,
  }) => (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleToggle}
        className={`${
          isDesktop ? "p-2" : "p-2"
        } rounded-full transition-colors duration-200 ${theme.buttonHoverBg}`}
      >
        <img
          src={HandburgerIcon}
          alt="Menu"
          className={`${isDesktop ? "w-8 h-8" : "w-6 h-6"} ${
            !isDark ? "filter brightness-0" : ""
          }`}
        />
      </button>

      {showMenu && (
        <div
          className={`absolute ${
            isDesktop ? "right-0 top-12" : "right-0 top-10"
          } z-50 ${theme.cardBg} rounded-lg ${theme.border} min-w-[150px] py-2`}
          style={{ boxShadow: theme.smallCardShadow }}
        >
          <button
            onClick={handleLogout}
            className={`w-full text-left px-4 py-2 text-sm ${
              theme.text
            } hover:bg-red-50 hover:text-red-600 transition-colors duration-200 ${
              isDark ? "hover:bg-red-900/20" : "hover:bg-red-50"
            }`}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );

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
const categorizeEvents = (tickets) => {
  console.log("=== CATEGORIZING", tickets.length, "EVENTS ===");
  const now = new Date();
  console.log("Current time:", now.toISOString());
  
  const all = [];
  const live = [];
  const past = [];

  tickets.forEach((ticket, index) => {
    all.push(ticket);

    // Try multiple possible field names for dates
    const eventDate = ticket.event_date || ticket.eventDate || ticket.date || ticket.start_date || ticket.startDate;
    const eventEndDate = ticket.event_end_date || ticket.eventEndDate || ticket.endDate || ticket.end_date;
    const eventStatus = ticket.status || ticket.eventStatus || ticket.event_status;

    console.log(`Event ${index} - "${ticket.event_name || ticket.name}":`, {
      eventDate,
      eventEndDate,
      eventStatus,
      fullTicket: ticket
    });

    if (eventDate) {
      const startDate = new Date(eventDate);
      const endDate = eventEndDate ? new Date(eventEndDate) : startDate;

      console.log(`  Dates - Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}`);
      console.log(`  Comparison - Start <= Now: ${startDate <= now}, End >= Now: ${endDate >= now}, End < Now: ${endDate < now}`);

      if (startDate <= now && endDate >= now) {
        live.push(ticket);
        console.log("  ✓ LIVE EVENT");
      } else if (endDate < now) {
        past.push(ticket);
        console.log("  ✓ PAST EVENT");
      } else {
        console.log("  → FUTURE EVENT (not categorized as live/past)");
      }
    } else if (eventStatus) {
      console.log(`  Using status: "${eventStatus}"`);
      const statusLower = eventStatus.toLowerCase();
      if (statusLower === 'live' || statusLower === 'active' || statusLower === 'ongoing') {
        live.push(ticket);
        console.log("  ✓ LIVE EVENT (by status)");
      } else if (statusLower === 'completed' || statusLower === 'ended' || statusLower === 'past') {
        past.push(ticket);
        console.log("  ✓ PAST EVENT (by status)");
      }
    } else {
      console.warn("  ⚠ NO DATE OR STATUS FOUND - cannot categorize");
    }
  });

  console.log("=== CATEGORIZATION COMPLETE ===");
  console.log("Total All:", all.length);
  console.log("Total Live:", live.length);
  console.log("Total Past:", past.length);

  return { all, live, past };
};

// ---------- REPLACE WITH THIS BLOCK ----------
/**
 * Robust id normalizer - handles:
 *  - string/number ids
 *  - objects like { _id: '...' } or { id: '...' }
 *  - nested user objects (event.user._id)
 *  - arrays where first element contains id
 */
const normalizeId = (val) => {
  if (val === null || val === undefined) return null;
  if (Array.isArray(val)) return normalizeId(val[0]);
  if (typeof val === 'object') {
    if (val._id) return String(val._id);
    if (val.id) return String(val.id);
    if (val.user) return normalizeId(val.user);
    if (val.creator) return normalizeId(val.creator);
    return null;
  }
  return String(val);
};

const isEventByProfileUser = (event, profileUser) => {
  if (!event || !profileUser) return false;
  const profileId = normalizeId(profileUser._id || profileUser.id || profileUser);
  if (!profileId) return false;

  const candidates = [
    event.userId,
    event.user,
    event.creatorId,
    event._userId,
    event.owner,
    event.organizer,
    event.createdBy,
    event.creator,
  ];

  for (const cand of candidates) {
    const candId = normalizeId(cand);
    if (candId && candId === profileId) return true;
  }

  // Try matching by username or email as a last-resort fallback
  if (event.user && typeof event.user === 'object') {
    if (event.user.username && profileUser.username && event.user.username === profileUser.username) return true;
    if (event.user.email && profileUser.email && event.user.email === profileUser.email) return true;
  }

  return false;
};

/**
 * Returns filtered events for the active tab.
 * If profileUser is not loaded yet, returns the unfiltered arrays (useful for debugging).
 */
const getFilteredEvents = () => {
  switch (activeTab) {
    case 'live': return liveEvents;
    case 'past': return pastEvents;
    default: return allEvents;
  }
};
const filteredEvents = getFilteredEvents();

// ---------- END REPLACEMENT BLOCK ----------


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
        smallCardShadow: "0 4px 10px rgba(0,0,0,0.35)",
        buttonHoverBg: "hover:bg-gray-100",
        notificationShadow: "inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)",
      };

  const displayName = currentUser?.name || "User";
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
  const handleViewEvent = (otherId, ticketId) => {
    navigate(`/ticket/other-event-view/${otherId}/${ticketId}`);
  };
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
          <header className="flex items-center justify-between px-3 md:px-4 lg:px-6 w-full" style={{ height: HEADER_HEIGHT }}>
            {/* Mobile Header */}
            <div className="flex md:hidden items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <img src={WieLogo} alt="WIE Logo" className="w-8 h-8 object-contain" />
                <img src={WieText} alt="WIE" className="h-5 object-contain" />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/message")}
                  style={{ 
                    boxShadow: isDark ? 'inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)' : 'inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)' 
                  }} 
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.bg}`}
                >
                  <img src={ChatIcon} alt="chats" className={`w-6 h-6 ${isDark ? 'filter brightness-0 invert' : 'filter brightness-0'}`} />
                </button>
                <HamburgerMenu
                  showMenu={showMobileHamburgerMenu}
                  handleToggle={handleMobileHamburgerClick}
                  menuRef={mobileHamburgerRef}
                />
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
                <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
              </div>
            </div>
          </header>
          <main className="flex-1 p-3 md:p-4 lg:p-6 overflow-y-auto overflow-x-hidden pb-32 md:pb-4 nest-hub-content max-w-full">
            <div className="max-w-7xl mx-auto space-y-3 md:space-y-4 lg:space-y-6 nest-hub-spacing w-full px-0 md:px-2 lg:px-4">
              {/* Profile Card */}
              <div className={`rounded-2xl md:rounded-3xl lg:rounded-[3rem] p-4 md:p-4 lg:p-6 mt-2 md:mt-4 lg:mt-8 ${theme.cardBg} nest-hub-card transition-all duration-300 w-full overflow-hidden`} style={{boxShadow: theme.cardShadow}}>
                {/* Mobile Layout */}
<div className="flex lg:hidden flex-col space-y-4">
                      <div className="flex flex-col gap-4">
                        {/* Top Row: Profile image + Name/Username */}
                        <div className="flex items-center gap-4">
                          {/* Profile Image */}
                          <img
                            src={getImageUrl(profileUser.image, 'auth') || ProfileImage}
                            alt="Profile"
                            className={`w-24 h-24 rounded-full object-cover border-2 flex-shrink-0 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                          />

                          {/* Name + Username */}
                          <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-1.5">
                              <h1 className={`text-lg font-bold ${theme.text}`}>{profileUser.name}</h1>
                              <img src={VerifiedIcon} alt="Verified" className="w-4 h-4" />
                            </div>
                            <p className={`text-sm ${theme.subText}`}>{profileUser.username}</p>
                            <p className={`text-sm font-medium ${theme.subText} whitespace-pre-line`}>
                              {profileUser.organisation_type || profileUser.role}
                            </p>
                          </div>
                        </div>

                        {/* Bio Section (full width below image and name) */}
                        <div className="w-full">
                          <p className={`text-xs leading-5 ${theme.subText} whitespace-pre-line`}>
                            {profileUser.bio}
                          </p>
                          {profileUser.website && (
                            <p className={`text-xs leading-5 ${theme.subText} whitespace-pre-line mt-1`}>
                              {profileUser.website}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Stats - FIXED VERSION */}
                      <div className="flex justify-center gap-6">
                        <div className="text-center" onClick={() => navigate(`/auth/others-ffe/${profileUser._id}`, { state: { activeTab: "events" } })}>
                          <p className={`text-sm ${theme.text}`}>
                            <span className="font-bold">{profileUser.eventsCount || profileUserEvents.length || 0}</span>
                          </p>
                          <p className={`text-xs ${theme.subText}`}>Event created</p>
                        </div>
                        <div className="text-center" onClick={() => navigate(`/auth/others-ffe/${profileUser._id}`, { state: { activeTab: "followers" } })}>
                          <p className={`text-sm ${theme.text}`}>
                            <span className="font-bold">{profileUser.followers || profileUser.followersCount || 0}</span>
                          </p>
                          <p className={`text-xs ${theme.subText}`}>Followers</p>
                        </div>
                        <div className="text-center" onClick={() => navigate(`/auth/others-ffe/${profileUser._id}`, { state: { activeTab: "following" } })}>
                          <p className={`text-sm ${theme.text}`}>
                            <span className="font-bold">{profileUser.following || profileUser.followingCount || 0}</span>
                          </p>
                          <p className={`text-xs ${theme.subText}`}>Following</p>
                        </div>
                      </div>
                      {/* Buttons mobile */}
<div className="lg:hidden flex flex-wrap gap-2 p-1 justify-center items-center profile-action-buttons">
  {/* Edit (if viewing your own profile) OR Follow (if viewing someone else) */}
  {profileUser && user && profileUser._id === user._id ? (
    <button
      onClick={() => navigate('/settings/editprofile')}
      className={`whitespace-nowrap flex-shrink-0 px-4 py-2 rounded-full text-sm font-normal transition-all duration-200 text-white bg-[#44444D] border border-[rgba(255,255,255,0.25)] shadow-[0px_0px_0px_1.49px_#2B2D43,0px_5.97px_8.95px_0px_#00000024,inset_0px_13.43px_20.89px_-7.46px_#FFFFFF4D]`}
    >
      Edit profile
    </button>
  ) : (
    <button
      onClick={handleFollowToggle}
      disabled={followLoading}
      className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-full text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-all duration-200 ${
        followLoading ? 'opacity-50 cursor-not-allowed' : ''
      } ${
        isFollowing
          ? 'text-white bg-[#44444D] border border-[rgba(255,255,255,0.25)] shadow-[0px_0px_0px_1.49px_#2B2D43,0px_5.97px_8.95px_0px_#00000024,inset_0px_13.43px_20.89px_-7.46px_#FFFFFF4D]'
          : 'text-white bg-[#5E5CE6] shadow-[0px_0px_0px_1px_#2B2D43,0px_4px_6px_0px_#00000024,inset_0px_9px_14px_-5px_#FFFFFF4D]'
      }`}
    >
      {followLoading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {isFollowing ? 'Unfollowing...' : 'Following...'}
        </span>
      ) : (
        isFollowing ? 'Unfollow' : 'Follow +'
      )}
    </button>
  )}

  {/* Share profile (same inline style as desktop) */}
  <button
    onClick={handleShareProfile}
    className="whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-full text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-all duration-200"
    style={
      isDark
        ? {
            background: 'var(--SecondaryBtnColorsec, #44444D)',
            color: 'white',
            border: '0.75px solid rgba(255,255,255,0.25)',
            boxShadow:
              '0px 0px 0px 1.49px #2B2D43, 0px 5.97px 8.95px 0px #00000024, inset 0px 13.43px 20.89px -7.46px #FFFFFF4D',
          }
        : {
            background: 'var(--SecondaryBtnColorsec, #44444D)',
            color: 'white',
            border: '0.5px solid rgba(255,255,255,0.35)',
            boxShadow:
              '0px 0px 0px 1px #2B2D43, 0px 4px 6px 0px #00000024, inset 0px 9px 14px -5px #FFFFFF4D',
          }
    }
  >
    Share profile
  </button>

  {/* Invite to group (same inline style as desktop) */}
  <button
    onClick={handleInviteToGroup}
    className="whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-full text-xs sm:px-4 sm:py-2 sm:text-sm font-medium transition-all duration-200"
    style={
      isDark
        ? {
            background: 'var(--SecondaryBtnColorsec, #44444D)',
            color: 'white',
            border: '0.75px solid rgba(255,255,255,0.25)',
            boxShadow:
              '0px 0px 0px 1.49px #2B2D43, 0px 5.97px 8.95px 0px #00000024, inset 0px 13.43px 20.89px -7.46px #FFFFFF4D',
          }
        : {
            background: 'var(--SecondaryBtnColorsec, #44444D)',
            color: 'white',
            border: '0.5px solid rgba(255,255,255,0.35)',
            boxShadow:
              '0px 0px 0px 1px #2B2D43, 0px 4px 6px 0px #00000024, inset 0px 9px 14px -5px #FFFFFF4D',
          }
    }
  >
    Invite to group
  </button>
</div>

                    </div>
                {/* Desktop Layout */}
<div className="hidden lg:flex justify-between items-center gap-6">
                  {/* Left side */}
                  <div className="flex items-start gap-6">
                    <img
                        src={getImageUrl(profileUser.image, 'auth') || ProfileImage}
                        alt={profileUser.name}
                        className={`w-32 h-32 md:w-36 md:h-36 lg:w-48 lg:h-48 rounded-full object-cover border-4 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                      />
                    <div className="space-y-1 md:space-y-2 flex-1">
                      <h1 className={`text-xl md:text-xl lg:text-2xl font-bold ${theme.text}`}>{profileUser.name}</h1>
                      <p className={`text-xs md:text-sm ${theme.subText}`}>{profileUser.username}</p>
                      <p className={`text-base leading-6 font-bold ${theme.subText} whitespace-pre-line`}>
                        {profileUser.organisation_type}
                      </p>
                      <p className={`whitespace-pre-line text-left text-xs md:text-sm leading-5 md:leading-6 break-words ${theme.subText}`}>
                        {profileUser.bio}</p>
                        {/*Button desktop*/}
<div className="flex gap-2 md:gap-3 pt-2 md:pt-3 flex-wrap profile-action-buttons">
                        <button 
                          onClick={handleFollowToggle} 
                          disabled={followLoading}
                          className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            followLoading ? 'opacity-50 cursor-not-allowed' : ''
                          } ${ isFollowing
        ? (
            isDark
              ? "text-white bg-[#44444D] border border-[rgba(255,255,255,0.25)] shadow-[0px_0px_0px_1.49px_#2B2D43,0px_5.97px_8.95px_0px_#00000024,inset_0px_13.43px_20.89px_-7.46px_#FFFFFF4D] hover:brightness-110"
              : "text-white bg-[#44444D] border border-[rgba(255,255,255,0.35)] shadow-[0px_0px_0px_1px_#2B2D43,0px_4px_6px_0px_#00000024,inset_0px_9px_14px_-5px_#FFFFFF4D] hover:brightness-110"

          )
        :                    "text-white bg-[#5E5CE6] shadow-[0px_0px_0px_1px_#2B2D43,0px_4px_6px_0px_#00000024,inset_0px_9px_14px_-5px_#FFFFFF4D] hover:brightness-110"


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
                            className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-200"
  style={
    isDark
      ? {
          background: "var(--SecondaryBtnColorsec, #44444D)",
          color: "white",
          border: "0.75px solid rgba(255,255,255,0.25)",
          boxShadow:
            "0px 0px 0px 1.49px #2B2D43, 0px 5.97px 8.95px 0px #00000024, inset 0px 13.43px 20.89px -7.46px #FFFFFF4D",
        }
      : {
          background: "var(--SecondaryBtnColorsec, #44444D)",
          color: "white",
          border: "0.5px solid rgba(255,255,255,0.35)",
          boxShadow:
            "0px 0px 0px 1px #2B2D43, 0px 4px 6px 0px #00000024, inset 0px 9px 14px -5px #FFFFFF4D",
        }
  }
                        >
                          Share profile
                        </button>
                        <button 
                          onClick={handleInviteToGroup}
                           className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-200"
  style={
    isDark
      ? {
          background: "var(--SecondaryBtnColorsec, #44444D)",
          color: "white",
          border: "0.75px solid rgba(255,255,255,0.25)",
          boxShadow:
            "0px 0px 0px 1.49px #2B2D43, 0px 5.97px 8.95px 0px #00000024, inset 0px 13.43px 20.89px -7.46px #FFFFFF4D",
        }
      : {
          background: "var(--SecondaryBtnColorsec, #44444D)",
          color: "white",
          border: "0.5px solid rgba(255,255,255,0.35)",
          boxShadow:
            "0px 0px 0px 1px #2B2D43, 0px 4px 6px 0px #00000024, inset 0px 9px 14px -5px #FFFFFF4D",
        }
  }
                        >
                          Invite to group
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side */}
                  <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handleHandburgerClick}
                        className={`w-10 h-10 flex items-center justify-center ${theme.bg}`}
                      >
                        <img src={HandburgerIcon} alt="Menu" className={`w-10 h-10 ${isDark ? 'filter brightness-0 invert' : 'filter brightness-0'}`} />
                      </button>
                    </div>
                    {/* Stats */}
<div
  className={`
    w-full 
    md:max-w-full 
    lg:w-[457px] 
    h-[161px] 
    flex justify-between items-center 
    rounded-[24px] 
    px-[24px] lg:px-[39px] 
    pr-[24px] lg:pr-[42px] 
    py-[25px] 
    transition-all duration-300 
    ${theme.cardBg} 
    md:mb-6 lg:mb-0
  `}
  style={{
    boxShadow: "-2px -2px 10px 0px rgba(99,99,99,0.21), 5px 6px 9px 0px rgba(0,0,0,0.46)",
  }}
>

  {/* Event Created */}
  <div
    className="text-center flex flex-col items-center gap-1"
    onClick={() =>
      navigate(`/auth/others-ffe/${profileUser._id}`, {
        state: { activeTab: "events" },
      })
    }
  >
    <img
      src={EventIcon}
      alt="Event"
      className={`w-[24px] h-[24px] ${!isDark ? "filter brightness-0" : ""}`}
    />
    <p className={`text-2xl font-bold ${theme.text}`}>
      {profileUser.eventsCount || profileUserEvents.length || 0}
    </p>
    <p className={`text-xs ${theme.subText}`}>Event created</p>
  </div>

  <div
    className="text-center flex flex-col items-center gap-1"
    onClick={() =>
      navigate(`/auth/others-ffe/${profileUser._id}`, {
        state: { activeTab: "followers" },
      })
    }
  >
    <img
      src={FollowersIcon}
      alt="Followers"
      className={`w-[24px] h-[24px] ${!isDark ? "filter brightness-0" : ""}`}
    />
    <p className={`text-2xl font-bold ${theme.text}`}>
      {profileUser.followersCount || profileUser.followers || 0}
    </p>
    <p className={`text-xs ${theme.subText}`}>Follower</p>
  </div>

  {/* Following */}
  <div
    className="text-center flex flex-col items-center gap-1"
    onClick={() =>
      navigate(`/auth/others-ffe/${profileUser._id}`, {
        state: { activeTab: "following" },
      })
    }
  >
    <img
      src={FollowingIcon}
      alt="Following"
      className={`w-[24px] h-[24px] ${!isDark ? "filter brightness-0" : ""}`}
    />
    <p className={`text-2xl font-bold ${theme.text}`}>
      {profileUser.following || 0}
    </p>
    <p className={`text-xs ${theme.subText}`}>Following</p>
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
                      <button className="w-full py-3.5 text-white font-normal hover:bg-[#232526] transition text-center hidden md:block" onClick={handleCloseModal}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div className={`rounded-xl md:rounded-2xl p-3 md:p-4 lg:p-6 nest-hub-card transition-all duration-300 w-full overflow-hidden`}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-lg font-semibold ${theme.text}`}>Suggestions</h2>
                  <button
                  className={`text-xs md:text-sm px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-[#6549B8] hover:bg-[#6549B8] hover:text-white transition-all duration-200 ${
                    isDark ? "text-[#FFFFFF]" : "text-[#000000]"
                  }`}
                  onClick={() => navigate('/suggestions')}
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
                          className={`w-[200px] md:w-[246px] h-[280px] md:h-[363px] flex-shrink-0 rounded-3xl p-4 flex flex-col justify-between 
  transition-colors duration-200 cursor-pointer 
  ${isDark ? "bg-[#212426] hover:bg-[#2A2D30]" : "bg-white hover:bg-[#F2F2F3]"}
`}
style={{
  boxShadow: theme.smallCardShadow,
}}

                          onClick={() => navigate(`/profile/${suggestedUser._id || suggestedUser.id}`)}
                        >
                          <div className="flex flex-col">
                            <div className="relative mb-4">
                              <img
                                src={getImageUrl(suggestedUser.image, 'auth') || ProfileImage}
                                alt={suggestedUser.name}
                                className="w-full h-[120px] md:h-[160px] object-cover rounded-2xl"
                              />
                            </div>
                            <div className="px-1" style={{ marginTop: "2rem" }}>
                              <div className="flex items-center gap-2 mb-1 justify-center">
                                <h3 className={`text-base font-semibold ${theme.text} truncate`}>{suggestedUser.name}</h3>
                                <img src={VerifiedIcon} alt="Verified" className="w-4 h-4 flex-shrink-0"/>
                              </div>
                              <p className={`text-sm ${theme.subText} capitalize text-center`}>{suggestedUser.organisation_type || "User"}</p>
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
                                <span className={`text-sm font-medium ${theme.text}`}>{eventCountsMap[suggestedUser._id || suggestedUser.id] || 0}</span>
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
                        onClick={() => setActiveTab('past')}
                      >
                        <img src={PastEventIcon} alt="PastEvent" className={`w-4 h-4 ${!isDark ? "filter brightness-0" : ""}`} />
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
                      <img src={PastEventIcon} alt="PastEvent" className={`w-7 h-7 ${!isDark ? "filter brightness-0" : ""}`}/>
                      <span className={`text-sm font-medium ${theme.text}`}>Past events</span>
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
  {/* Desktop: SAME AS PROFILE PAGE */}
  <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-[17.59px] w-full ml-4">
    {filteredEvents.map((event, index) => (
      <div
        key={event._id || `event-${index}`}
        className="overflow-hidden flex flex-col cursor-pointer hover:scale-[1.02] transition-transform duration-200"
        style={{
          width: "315.28px",
          height: "380px",
          borderRadius: "32.48px",
          paddingTop: "19px",
          paddingRight: "12.18px",
          paddingBottom: "19px",
          paddingLeft: "12.18px",
          backgroundColor: isDark ? "#212426" : "#ffffff",
          boxShadow: isDark
            ? "-2px -2px 10px 0px #63636336, 5px 6px 9px 0px #00000075"
            : "-2px -2px 10px 0px #E0E0E0, 5px 6px 9px 0px #00000033",
          transform: "translateX(6px)",
        }}
      >
        {/* Event Image */}
        <div className="mb-3">
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
            className="rounded-[1rem] w-full object-cover border-2 border-white border-opacity-50"
            style={{ height: "180px" }}
            onError={(e) => {
              e.target.src =
                "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2";
            }}
          />
        </div>

        {/* Event Info */}
        <div className="flex flex-col flex-1">
          <div className="text-center mb-4">
            <h3 className={`font-bold text-base ${theme.text} line-clamp-1`}>
              {event.event_name || event.name || "Event"}
            </h3>
            <p className={`text-sm ${theme.subText} mt-1 line-clamp-1`}>
              {event.event_category || event.category || "Event Type"}
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-center items-center gap-8 text-sm mb-4">
            <div className="flex flex-col items-center">
              <img
                src={LikeIcon}
                className={`w-5 h-5 mb-1 ${!isDark ? "brightness-0" : ""}`}
              />
              <span className={theme.subText}>
                {event.likes || event.likesCount || "0"}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <img
                src={TicketIcon}
                className={`w-5 h-5 mb-1 ${!isDark ? "brightness-0" : ""}`}
              />
              <span className={theme.subText}>
                {event.ticketsSold ||
                  event.registrations ||
                  event.ticketCount ||
                  "0"}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <img
                src={SendIcon}
                className={`w-5 h-5 mb-1 ${!isDark ? "brightness-0" : ""}`}
              />
              <span className={theme.subText}>
                {event.shares || event.sharesCount || "0"}
              </span>
            </div>
          </div>

          {/* View Button */}
          <div className="flex justify-center mt-auto">
            <button
              onClick={() => handleViewEvent(event.userId, event._id)}
              className="px-10 py-2 rounded-full text-white text-sm font-medium"
              style={{
                background:
                  "linear-gradient(180deg, #2e1745 0%, #7f53e7 100%)",
              }}
            >
              View
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>

  {/* Mobile: SAME AS PROFILE PAGE */}
  <div className="md:hidden grid grid-cols-2 gap-3">
    {filteredEvents.map((event, index) => (
      <div
        key={event._id || `event-${index}`}
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{
          height: "280px",
          backgroundColor: isDark ? "#212426" : "#ffffff",
          boxShadow: isDark
            ? "-2px -2px 10px 0px #63636336, 5px 6px 9px 0px #00000075"
            : "-2px -2px 10px 0px #E0E0E0, 5px 6px 9px 0px #00000033",
        }}
        onClick={() => handleViewEvent(event.userId, event._id)}
      >
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
            className="rounded-xl w-full object-cover"
            style={{ height: "120px" }}
          />
        </div>

        <div className="flex flex-col flex-1 p-2 justify-between">
          <div className="text-center mb-2">
            <h3 className={`font-bold text-sm ${theme.text} line-clamp-1`}>
              {event.event_name || event.name || "Event"}
            </h3>
            <p className={`text-xs ${theme.subText} mt-1 line-clamp-1`}>
              {event.event_category || event.category || "Event Type"}
            </p>
          </div>

          <div className="flex justify-center items-center gap-3 text-xs">
            <div className="flex flex-col items-center">
              <img src={LikeIcon} className={`w-3 h-3 ${!isDark ? "brightness-0" : ""}`} />
              <span className={theme.subText}>{event.likes || "0"}</span>
            </div>

            <div className="flex flex-col items-center">
              <img src={TicketIcon} className={`w-3 h-3 ${!isDark ? "brightness-0" : ""}`} />
              <span className={theme.subText}>
                {event.ticketsSold || event.ticketCount || "0"}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <img src={SendIcon} className={`w-3 h-3 ${!isDark ? "brightness-0" : ""}`} />
              <span className={theme.subText}>{event.shares || "0"}</span>
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
                    <h3 className={`text-xl font-medium ${theme.text} mb-4`}>
  No {activeTab !== "all" ? activeTab : ""} {activeTab === "groups" ? "" : "events"} found
</h3>

<p className={`text-sm ${theme.subText} text-center max-w-md`}>
  {profileUser.name} hasn't created any {activeTab !== "all" ? activeTab : ""}{" "}
  {activeTab === "groups" ? "" : "events"} yet.
</p>

                  </div>
                )}
              </div>
            </div>
          </main>
          <div >
          <BottomNavigation 
            theme={theme}
            user={users}
          />
          </div>
        </div>
      </div>
    </>
  );
};
export default OtherProfilePage;
