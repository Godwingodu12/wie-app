import React, { useState, useEffect, useRef } from "react";
import { getUserData } from "../../services/ticketService";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getAllFollowers,
  getAllFollowing,
  checkIsFollowing,
  followUser,
  unfollowUser,
} from "../../services/authService";
import { getMyEvents } from "../../services/ticketService";
import { getImageUrl } from "../../utils/imageUtils.js";
import SideBar from "../../components/HomePage/SideBar.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import BottomNavigation from "../../components/HomePage/BottomNavigation.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import WieText from "../../assets/HomePage/WieText.svg";
import ChatIcon from "../../assets/HomePage/ChatIcon.svg";
import EventIcon from "../../assets/PROFILEPAGE/EventIcon.svg";
import FollowersIcon from "../../assets/PROFILEPAGE/FollowersIcon.svg";
import FollowingIcon from "../../assets/PROFILEPAGE/FollowingIcon.svg";
import ProfileImage from "../../assets/PROFILEPAGE/ProfileImage.png";
import VerifiedIcon from "../../assets/PROFILEPAGE/VerifiedIcon.svg";
import LikeIcon from "../../assets/PROFILEPAGE/LikeIcon.svg";
import SendIcon from "../../assets/PROFILEPAGE/SendIcon.svg";
import TicketIcon from "../../assets/HomePage/TicketIcon.svg";

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

const GetFollowerEventList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [userImage, setUserImage] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [events, setEvents] = useState([]);
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("events");
  const [followingMap, setFollowingMap] = useState({});
  const [followingStates, setFollowingStates] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  // Initialize unfollowedUsers from sessionStorage
  const [unfollowedUsers, setUnfollowedUsers] = useState(() => {
    try {
      const stored = sessionStorage.getItem('unfollowedUsers');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
      console.error('Error loading unfollowed users from session:', error);
      return new Set();
    }
  });

  // Parse API response helper
  const parseApiResponse = (response) => {
    let data = [];
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
    }
    return Array.isArray(data) ? data : [];
  };

  const parseUsersResponse = (response) => {
    if (Array.isArray(response?.data?.activeFollowers)) {
      return response.data.activeFollowers;
    } else if (Array.isArray(response?.activeFollowers)) {
      return response.activeFollowers;
    } else if (Array.isArray(response?.data?.followers)) {
      return response.data.followers;
    } else if (Array.isArray(response?.followers)) {
      return response.followers;
    } else if (Array.isArray(response?.data?.following)) {
      return response.data.following;
    } else if (Array.isArray(response?.following)) {
      return response.following;
    } else if (Array.isArray(response?.data?.users)) {
      return response.data.users;
    } else if (Array.isArray(response?.users)) {
      return response.users;
    } else if (Array.isArray(response?.data)) {
      return response.data;
    } else if (Array.isArray(response)) {
      return response;
    }

    // If it's an object with user data inside
    if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      const keys = Object.keys(response.data);
      for (const key of keys) {
        if (Array.isArray(response.data[key])) {
          return response.data[key];
        }
      }
    }

    return [];
  };

  // Sync unfollowedUsers to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem('unfollowedUsers', JSON.stringify([...unfollowedUsers]));
    } catch (error) {
      console.error('Error saving unfollowed users to session:', error);
    }
  }, [unfollowedUsers]);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  // Get active tab from navigation state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location]);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserData();
        setUser(userData);
        if (userData.image) {
          const imageUrl = getImageUrl(userData.image, "auth");
          setUserImage(imageUrl);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
          if (activeTab === "followers") {
  const response = await getAllFollowers();
  const apiFollowers = parseUsersResponse(response);

  // ---- Load stored order ----
  let stored = [];
  try {
    const s = sessionStorage.getItem("followersList");
    stored = s ? JSON.parse(s) : [];
  } catch (e) {
    console.error("Session parse error", e);
  }

  let finalList = [];

  if (stored.length === 0) {
    // ---- First Visit ----
    finalList = apiFollowers;
    sessionStorage.setItem("followersList", JSON.stringify(finalList));
  } else {
    // ---- Subsequent Visits: Merge With Order Preservation ----
    const apiMap = new Map();
    apiFollowers.forEach(u => {
      apiMap.set(u._id || u.id || u.userId, u);
    });

    // 1) Keep stored order + update user details
    stored.forEach(storedUser => {
      const id = storedUser._id || storedUser.id || storedUser.userId;
      if (apiMap.has(id)) {
        finalList.push(apiMap.get(id)); // updated data
        apiMap.delete(id);
      }
    });

    // 2) Add new followers at END
    apiMap.forEach(user => finalList.push(user));

    // 3) Update stored list
    sessionStorage.setItem("followersList", JSON.stringify(finalList));
  }

  // ---- Set state ----
  setFollowers(finalList);

  // ---- Follow Status ----
  const statusMap = {};
  for (const user of finalList) {
    const id = user._id || user.id || user.userId;
    try {
      const res = await checkIsFollowing(id);
      statusMap[id] = res.isFollowing || false;
    } catch {
      statusMap[id] = false;
    }
  }
  setFollowingMap(statusMap);
} else if (activeTab === "following") {
          const response = await getAllFollowing();
          const followingList = parseUsersResponse(response);
          if (followingList.length === 0) {
            console.warn("No following found. Check API response structure.");
          }
          
          // Get previously stored following list from sessionStorage
          let storedFollowingList = [];
          try {
            const stored = sessionStorage.getItem('followingList');
            if (stored) {
              storedFollowingList = JSON.parse(stored);
            }
          } catch (err) {
            console.error('Error loading following list from session:', err);
          }
          
          let mergedFollowingList;
          
          if (unfollowedUsers.size === 0) {
            // No unfollowed users - just use the API response and store it
            mergedFollowingList = followingList;
            sessionStorage.setItem('followingList', JSON.stringify(followingList));
          } else {
            // There are unfollowed users - preserve order from stored list
            // Create a map for quick lookup
            const apiUserMap = new Map();
            followingList.forEach(user => {
              const userId = user._id || user.id || user.userId;
              if (userId) {
                apiUserMap.set(userId, user);
              }
            });
            
            // Start with the stored list order
            mergedFollowingList = storedFollowingList.map(user => {
              const userId = user._id || user.id || user.userId;
              // If user is in API response, use updated data; otherwise keep stored data
              return apiUserMap.has(userId) ? apiUserMap.get(userId) : user;
            });
            
            // Add any new users from API that aren't in stored list (at the end)
            followingList.forEach(user => {
              const userId = user._id || user.id || user.userId;
              const existsInStored = storedFollowingList.some(
                storedUser => (storedUser._id || storedUser.id || storedUser.userId) === userId
              );
              if (!existsInStored) {
                mergedFollowingList.push(user);
              }
            });
          }
          
          setFollowing(mergedFollowingList);
          
          // Set button status based on unfollowedUsers
          const statuses = {};
          mergedFollowingList.forEach(user => {
            const userId = user._id || user.id || user.userId;
            if (userId) {
              // If user is in unfollowedUsers, show "Follow" button (false)
              // If user is NOT in unfollowedUsers, show "Unfollow" button (true)
              statuses[userId] = !unfollowedUsers.has(userId);
            }
          });
          setFollowingMap(statuses);
        }else if (activeTab === "events") {
          const response = await getMyEvents();
          const eventsList = parseApiResponse(response);
          setEvents(eventsList);
        }
      } catch (err) {
        console.error(`Failed to fetch ${activeTab}:`, err);
        console.error("Error details:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, unfollowedUsers]);

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };
  useEffect(() => {
    const previousTab = activeTab;
    
    return () => {
      // Clear session storage when switching away from tabs
      if (previousTab === "following" && unfollowedUsers.size > 0) {
        sessionStorage.removeItem('unfollowedUsers');
        sessionStorage.removeItem('followingList');
        setUnfollowedUsers(new Set());
      }
      if (previousTab === "followers") {
        sessionStorage.removeItem('followersList');
      }
    };
  }, [activeTab, unfollowedUsers]);
  useEffect(() => {
    return () => {
      // Clear all session storage when component unmounts
      if (unfollowedUsers.size > 0) {
        sessionStorage.removeItem('unfollowedUsers');
        sessionStorage.removeItem('followingList');
      }
      sessionStorage.removeItem('followersList');
    };
  }, []);
const handleFollowToggle = async (userId) => {
  if (!userId) return;

  setFollowingStates(prev => ({ ...prev, [userId]: true }));
  const isFollowingNow = followingMap[userId];

  try {
    if (isFollowingNow) {
      await unfollowUser(userId);

      // Button only changes
      setFollowingMap(prev => ({
        ...prev,
        [userId]: false
      }));
    } else {
      await followUser(userId);
      setFollowingMap(prev => ({
        ...prev,
        [userId]: true
      }));
    }
  } catch (err) {
    console.error(err);
  } finally {
    setFollowingStates(prev => ({ ...prev, [userId]: false }));
  }
};
  const sortUsersByFollowStatus = (usersList) => {
    if (!usersList || usersList.length === 0) return usersList;

    return [...usersList].sort((a, b) => {
      const aId = a._id || a.id;
      const bId = b._id || b.id;
      
      // Get follow status - true means following, false means not following
      const aIsFollowing = followingMap[aId] !== false;
      const bIsFollowing = followingMap[bId] !== false;
      
      // Following users first (return -1 to put 'a' before 'b')
      if (aIsFollowing && !bIsFollowing) return -1;
      if (!aIsFollowing && bIsFollowing) return 1;
      return 0; // Keep original order if both have same follow status
    });
  };

  const handleViewEvent = (event) => {
    const ticketId = event._id;
    const status = event.event_status?.toLowerCase();
    switch (status) {
      case "pending":
        navigate(`/ticket/view-single-event/${ticketId}`);
        break;
      case "confirmed":
        navigate(`/ticket/view-confirm-event/${ticketId}`);
        break;
      case "live":
        navigate(`/ticket/live-event-view/${ticketId}`);
        break;
      case "completed":
        navigate(`/ticket/previous-event-view/${ticketId}`);
        break;
      default:
        navigate(`/ticket/view-single-event/${ticketId}`);
    }
  };

  const theme = isDark
    ? {
        bg: "bg-[#212426]",
        text: "text-white",
        subText: "text-[#c9c9cf]",
        cardBg: "bg-[#212426]",
        border: "border-gray-700",
        cardShadow: "-2px -2px 10px 0px #63636336, 5px 6px 9px 0px #00000075",
        buttonShadow: "6px 6px 12px 0px #0000002E inset, -6px -6px 12px 0px #FFFFFF14 inset",
        itemShadow: "-2px -2px 10px 0px #63636336, 5px 6px 9px 0px #00000075",
      }
    : {
        bg: "bg-[#f9f9f9]",
        text: "text-gray-900",
        subText: "text-gray-600",
        cardBg: "bg-[#ffffff]",
        border: "border-gray-300",
        cardShadow: "-2px -2px 10px 0px #E0E0E0, 5px 6px 9px 0px #00000033",
        buttonShadow: "6px 6px 12px 0px #0000001A inset, -6px -6px 12px 0px #FFFFFF80 inset",
        itemShadow: "-2px -2px 10px 0px #E0E0E0, 5px 6px 9px 0px #00000033",
      };
  // Search filter function
  const filterBySearch = (items, query, isEvent = false) => {
    if (!query.trim()) return items;
    
    const lowerQuery = query.toLowerCase().trim();
    
    if (isEvent) {
      // Search in events
      return items.filter(event => 
        event.event_name?.toLowerCase().includes(lowerQuery) ||
        event.event_category?.toLowerCase().includes(lowerQuery)
      );
    } else {
      // Search in users
      return items.filter(user => 
        user.name?.toLowerCase().includes(lowerQuery) ||
        user.username?.toLowerCase().includes(lowerQuery) ||
        user.email?.toLowerCase().includes(lowerQuery) ||
        user.organisation_type?.toLowerCase().includes(lowerQuery) ||
        user.role?.toLowerCase().includes(lowerQuery)
      );
    }
  };
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-16">
          <div className={`text-lg ${theme.subText}`}>Loading...</div>
        </div>
      );
    }

    if (activeTab === "events") {
      const filteredEvents = filterBySearch(events, searchQuery, true);
      
      return (
        <div className="w-full space-y-6">
          {/* Search Bar for Events */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search events by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl ${
                  isDark 
                    ? "bg-[#2a2d30] text-white placeholder-gray-500" 
                    : "bg-white text-gray-900 placeholder-gray-400"
                } border ${isDark ? "border-gray-700" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                style={{
                  boxShadow: theme.itemShadow,
                }}
              />
              <svg
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.subText}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {searchQuery && (
              <p className={`mt-2 text-sm ${theme.subText}`}>
                Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <p className={`text-lg ${theme.subText}`}>
                {searchQuery ? "No events found matching your search" : "No events created yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop: 3 columns */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event, index) => (
                  <div
                    key={event._id || `event-${index}`}
                    className="cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                    style={{
                      width: "315.28px",
                      height: "380px",
                      borderRadius: "32.48px",
                      padding: "19px 12.18px",
                      backgroundColor: isDark ? "#212426" : "#ffffff",
                      boxShadow: theme.itemShadow,
                    }}
                    onClick={() => handleViewEvent(event)}
                  >
                    <img
                      src={event.event_banner || event.event_logo}
                      alt={event.event_name || "Event"}
                      className="rounded-2xl w-full object-cover border-2 border-white border-opacity-50"
                      style={{ height: "180px" }}
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2";
                      }}
                    />
                    <div className="flex flex-col flex-1 mt-3">
                      <div className="text-center mb-4">
                        <h3 className={`font-bold text-base ${theme.text} line-clamp-1`}>
                          {event.event_name || "Event"}
                        </h3>
                        <p className={`text-sm ${theme.subText} mt-1 line-clamp-1`}>
                          {event.event_category || "Event Type"}
                        </p>
                      </div>
                      <div className="flex justify-center items-center gap-8 text-sm mb-4">
                        <div className="flex flex-col items-center">
                          <img
                            src={LikeIcon}
                            alt="Likes"
                            className={`w-5 h-5 mb-1 ${!isDark ? "filter brightness-0" : ""}`}
                          />
                          <span className={theme.subText}>{event.likes || "0"}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <img
                            src={TicketIcon}
                            alt="Tickets"
                            className={`w-5 h-5 mb-1 ${!isDark ? "filter brightness-0" : ""}`}
                          />
                          <span className={theme.subText}>
                            {event.ticketsSold || event.ticket_count || "0"}
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <img
                            src={SendIcon}
                            alt="Shares"
                            className={`w-5 h-5 mb-1 ${!isDark ? "filter brightness-0" : ""}`}
                          />
                          <span className={theme.subText}>{event.shares || "0"}</span>
                        </div>
                      </div>
                      <div className="flex justify-center mt-auto">
                        <button
                          className="px-10 py-2 rounded-full text-white text-sm font-medium"
                          style={{
                            background: "linear-gradient(180deg, #2e1745 0%, #7f53e7 100%)",
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile: 2 columns */}
              <div className="md:hidden grid grid-cols-2 gap-3">
                {filteredEvents.map((event, index) => (
                  <div
                    key={event._id || `event-${index}`}
                    className="rounded-2xl overflow-hidden cursor-pointer"
                    style={{
                      height: "280px",
                      backgroundColor: isDark ? "#212426" : "#ffffff",
                      boxShadow: theme.itemShadow,
                    }}
                    onClick={() => handleViewEvent(event)}
                  >
                    <div className="p-2">
                      <img
                        src={event.event_banner || event.event_logo}
                        alt={event.event_name || "Event"}
                        className="rounded-xl w-full object-cover"
                        style={{ height: "120px" }}
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2";
                        }}
                      />
                    </div>
                    <div className="flex flex-col flex-1 p-2 justify-between">
                      <div className="text-center mb-2">
                        <h3 className={`font-bold text-sm ${theme.text} line-clamp-1`}>
                          {event.event_name || "Event"}
                        </h3>
                        <p className={`text-xs ${theme.subText} mt-1 line-clamp-1`}>
                          {event.event_category || "Event Type"}
                        </p>
                      </div>
                      <div className="flex justify-center items-center gap-3 text-xs mb-2">
                        <div className="flex flex-col items-center">
                          <img
                            src={LikeIcon}
                            alt="Likes"
                            className={`w-3 h-3 mb-1 ${!isDark ? "filter brightness-0" : ""}`}
                          />
                          <span className={theme.subText}>{event.likes || "0"}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <img
                            src={TicketIcon}
                            alt="Tickets"
                            className={`w-3 h-3 mb-1 ${!isDark ? "filter brightness-0" : ""}`}
                          />
                          <span className={theme.subText}>
                            {event.ticketsSold || event.ticket_count || "0"}
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <img
                            src={SendIcon}
                            alt="Shares"
                            className={`w-3 h-3 mb-1 ${!isDark ? "filter brightness-0" : ""}`}
                          />
                          <span className={theme.subText}>{event.shares || "0"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }

    // Followers and Following UI with Search
    const users = activeTab === "followers" ? followers : following;
    const filteredUsers = filterBySearch(users, searchQuery, false);
    const sortedUsers = filteredUsers;

    return (
      <div className="w-full">
        {/* Search Bar for Users */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder={`Search ${activeTab} by name, username, or email...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl ${
                isDark 
                  ? "bg-[#2a2d30] text-white placeholder-gray-500" 
                  : "bg-white text-gray-900 placeholder-gray-400"
              } border ${isDark ? "border-gray-700" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              style={{
                boxShadow: theme.itemShadow,
              }}
            />
            <svg
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.subText}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {searchQuery && (
            <p className={`mt-2 text-sm ${theme.subText}`}>
              Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <p className={`text-lg ${theme.subText}`}>
              {searchQuery 
                ? "No users found matching your search" 
                : activeTab === "followers" 
                  ? "No followers yet" 
                  : "Not following anyone yet"}
            </p>
          </div>
        ) : (
          /* Single container with all users listed */
          <div
            className="rounded-2xl md:rounded-3xl p-3 md:p-4"
            style={{
              backgroundColor: isDark ? "#212426" : "#ffffff",
              boxShadow: theme.itemShadow,
            }}
          >
            <div className="space-y-3 md:space-y-4">
              {sortedUsers.map((userData, index) => {
                const userId = userData._id || userData.id;
                const isFollowing = followingMap[userId] || false;
                const isProcessing = followingStates[userId] || false;

                return (
                  <div key={userId}>
                    {/* Desktop Layout */}
                    <div
                      className="hidden md:flex items-center justify-between p-4 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => navigate(`/profile/${userId}`)}
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={getImageUrl(userData.image, "auth") || ProfileImage}
                          alt={userData.name}
                          className={`w-16 h-16 rounded-full object-cover border-2 ${
                            isDark ? "border-gray-600" : "border-gray-300"
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`text-lg font-semibold ${theme.text}`}>
                              {userData.name}
                            </h3>
                            <img src={VerifiedIcon} alt="Verified" className="w-4 h-4" />
                          </div>
                          <p className={`text-sm ${theme.subText}`}>@{userData.username}</p>
                          <p className={`text-sm ${theme.subText} capitalize mt-1`}>
                            {userData.organisation_type || userData.role}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowToggle(userId);
                        }}
                        disabled={isProcessing}
                        className={`px-6 py-2 rounded-full text-white text-sm font-medium transition-all duration-200 ${
                          isFollowing
                            ? "bg-[#44444D] hover:bg-[#50505A]"
                            : "bg-blue-500 hover:bg-blue-600"
                        } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isProcessing
                          ? isFollowing
                            ? "Unfollowing..."
                            : "Following..."
                          : isFollowing
                          ? "Unfollow"
                          : "Follow +"}
                      </button>
                    </div>

                    {/* Mobile Layout */}
                    <div
                      className="md:hidden flex items-center justify-between p-3 cursor-pointer"
                      onClick={() => navigate(`/profile/${userId}`)}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(userData.image, "auth") || ProfileImage}
                          alt={userData.name}
                          className={`w-12 h-12 rounded-full object-cover border-2 ${
                            isDark ? "border-gray-600" : "border-gray-300"
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <h3 className={`text-sm font-semibold ${theme.text}`}>
                              {userData.name}
                            </h3>
                            <img src={VerifiedIcon} alt="Verified" className="w-3 h-3" />
                          </div>
                          <p className={`text-xs ${theme.subText}`}>@{userData.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowToggle(userId);
                        }}
                        disabled={isProcessing}
                        className={`px-4 py-1.5 rounded-full text-white text-xs font-medium transition-all duration-200 ${
                          isFollowing
                            ? "bg-[#44444D] hover:bg-[#50505A]"
                            : "bg-blue-500 hover:bg-blue-600"
                        } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isProcessing
                          ? isFollowing
                            ? "Unfollowing..."
                            : "Following..."
                          : isFollowing
                          ? "Unfollow"
                          : "Follow +"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };
  useEffect(() => {
    setSearchQuery("");
  }, [activeTab]);
  return (
    <>
      <CustomScrollbarStyles />
      <div className={`${theme.bg} ${theme.text} min-h-screen flex overflow-hidden transition-colors duration-300`}>
        {/* Sidebar - Desktop */}
        <div
          className="hidden md:flex flex-col flex-shrink-0 transition-colors duration-300"
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            width: "80px",
            zIndex: 40,
            overflowY: "auto",
            backgroundColor: isDark ? "#212426" : "#f9f9f9",
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
          <header
            className="flex items-center justify-between px-3 md:px-4 lg:px-6 w-full"
            style={{ height: HEADER_HEIGHT }}
          >
            {/* Mobile Header */}
            <div className="flex md:hidden items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <img src={WieLogo} alt="WIE Logo" className="w-8 h-8 object-contain" />
                <img src={WieText} alt="WIE" className="h-5 object-contain" />
              </div>
              <button
                onClick={() => navigate("/message")}
                style={{
                  boxShadow: isDark
                    ? "inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)"
                    : "inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)",
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDark ? "bg-[#212426]" : "bg-white"
                }`}
              >
                <img
                  src={ChatIcon}
                  alt="chats"
                  className={`w-6 h-6 ${
                    isDark ? "filter brightness-0 invert" : "filter brightness-0"
                  }`}
                />
              </button>
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
              <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-3 md:p-4 lg:p-6 overflow-y-auto pb-32 md:pb-4">
            <div className="max-w-7xl mx-auto">
              {/* Main Container */}
              <div
                className="rounded-[30px] md:rounded-[50px] p-4 md:p-8"
                style={{
                  backgroundColor: isDark ? "#212426" : "#ffffff",
                  boxShadow: theme.cardShadow,
                  maxWidth: "1160px",
                  margin: "0 auto",
                }}
              >
                <button
                  onClick={() => navigate(-1)}
                  className={`mb-4 flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isDark
                      ? "bg-[#2a2d30] hover:bg-[#35383b] text-white"
                      : "bg-white hover:bg-gray-100 text-gray-900"
                  }`}
                  style={{
                    boxShadow: theme.itemShadow,
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span className="font-medium">Back</span>
                </button>
                {/* Tab Buttons - Reduced mobile text size */}
                <div
                  className="flex justify-between mb-6 md:mb-10"
                  style={{
                    gap: "6px",
                  }}
                >
                  {/* Events Tab */}
                  <button
                    onClick={() => setActiveTab("events")}
                    className={`flex items-center gap-1.5 md:gap-3 rounded-xl px-2 md:px-6 py-2 md:py-4 transition-all duration-200 flex-1 justify-center ${
                      activeTab === "events" ? "" : "opacity-60"
                    }`}
                    style={{
                      boxShadow: activeTab === "events" ? theme.buttonShadow : "none",
                    }}
                  >
                    <img
                      src={EventIcon}
                      alt="Events"
                      className={`w-3 h-3 md:w-5 md:h-5 flex-shrink-0 ${!isDark ? "filter brightness-0" : ""}`}
                    />
                    <span className={`text-[10px] md:text-sm font-medium ${theme.text} whitespace-nowrap`}>
                      Event created
                    </span>
                  </button>

                  {/* Followers Tab */}
                  <button
                    onClick={() => setActiveTab("followers")}
                    className={`flex items-center gap-1.5 md:gap-3 rounded-xl px-2 md:px-6 py-2 md:py-4 transition-all duration-200 flex-1 justify-center ${
                      activeTab === "followers" ? "" : "opacity-60"
                    }`}
                    style={{
                      boxShadow: activeTab === "followers" ? theme.buttonShadow : "none",
                    }}
                  >
                    <img
                      src={FollowersIcon}
                      alt="Followers"
                      className={`w-3 h-3 md:w-5 md:h-5 flex-shrink-0 ${!isDark ? "filter brightness-0" : ""}`}
                    />
                    <span className={`text-[10px] md:text-sm font-medium ${theme.text} whitespace-nowrap`}>
                      Followers
                    </span>
                  </button>

                  {/* Following Tab */}
                  <button
                    onClick={() => setActiveTab("following")}
                    className={`flex items-center gap-1.5 md:gap-3 rounded-xl px-2 md:px-6 py-2 md:py-4 transition-all duration-200 flex-1 justify-center ${
                      activeTab === "following" ? "" : "opacity-60"
                    }`}
                    style={{
                      boxShadow: activeTab === "following" ? theme.buttonShadow : "none",
                    }}
                  >
                    <img
                      src={FollowingIcon}
                      alt="Following"
                      className={`w-3 h-3 md:w-5 md:h-5 flex-shrink-0 ${!isDark ? "filter brightness-0" : ""}`}
                    />
                    <span className={`text-[10px] md:text-sm font-medium ${theme.text} whitespace-nowrap`}>
                      Following
                    </span>
                  </button>
                </div>
                {/* Content Area */}
                <div className="overflow-y-auto min-h-[120vh] md:min-h-[150vh] scrollbar-hide">
                  {renderContent()}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      {/* Bottom Navigation */}
      <BottomNavigation theme={theme} user={user} />
    </>
  );
};
export default GetFollowerEventList;
