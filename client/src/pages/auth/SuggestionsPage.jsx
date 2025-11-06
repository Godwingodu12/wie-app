import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { getMe } from "../../services/userService";
import { getImageUrl } from "../../utils/imageUtils.js";
import { findAllActiveUsers, followUser, unfollowUser, checkIsFollowing } from "../../services/authService";
import { totalEventsCreatedCount } from "../../services/ticketService";
import SideBar from "../../components/HomePage/SideBar.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import VerifiedIcon from "../../assets/PROFILEPAGE/VerifiedIcon.svg";
import EventIcon from "../../assets/PROFILEPAGE/EventIcon.svg";
import FollowersIcon from "../../assets/PROFILEPAGE/FollowersIcon.svg";
import ProfileImage from "../../assets/PROFILEPAGE/ProfileImage.png";

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
const SuggestionsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [_userImage, setUserImage] = useState(() => {
          return sessionStorage.getItem('userImage') || null;
  });
  const [loading, setLoading] = useState(true);
  const [_currentUser, _setCurrentUser] = useState(null);
  const [_followLoading, _setFollowLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState({});
  const [followingStates, setFollowingStates] = useState({});
  const [eventCountsMap, setEventCountsMap] = useState({});

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
        if (res.data.image) {
            const imageUrl = getImageUrl(res.data.image, 'auth');
            setUserImage(imageUrl);
            sessionStorage.setItem('userImage', imageUrl);
        } else {
            setUserImage(null);
            sessionStorage.removeItem('userImage');
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchActiveUsers = async () => {
      setLoading(true);
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
        } else {
          console.log("Unexpected response format:", response);
          allUsers = [];
        }
        
        setUsers(allUsers);
      } catch (err) {
        console.error("Failed to fetch active users:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveUsers();
  }, []);

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

  useEffect(() => {
    const checkFollowStatuses = async () => {
      if (users.length === 0) return;
      const statuses = {};
      for (const suggestUser of users) {
        try {
          const response = await checkIsFollowing(suggestUser._id || suggestUser.id);
          statuses[suggestUser._id || suggestUser.id] = response.isFollowing || false;
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
    if (!user || users.length === 0) return;

    const filtered = users.filter((suggestedUser) => {
      const currentUserId = user._id || user.id;
      const suggestedId = suggestedUser._id || suggestedUser.id;
      return suggestedId && suggestedId !== currentUserId;
    });

    setFilteredUsers(filtered);
  }, [user, users]);

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleSuggestionFollowToggle = async (suggestedUserId) => {
    if (!suggestedUserId || !user) return;
    
    const key = suggestedUserId;
    
    setFollowingStates(prev => ({ ...prev, [key]: true }));
    
    try {
      const statusResponse = await checkIsFollowing(suggestedUserId);
      const isCurrentlyFollowing = statusResponse.isFollowing || false;
      
      if (isCurrentlyFollowing) {
        setFollowingMap(prev => ({ ...prev, [key]: false }));
        
        setUsers(prev => prev.map(u => {
          if ((u._id || u.id) === suggestedUserId) {
            const currentCount = parseInt(u.followers || u.followersCount || 0);
            return {
              ...u,
              followers: Math.max(0, currentCount - 1).toString(),
              followersCount: Math.max(0, currentCount - 1)
            };
          }
          return u;
        }));
        
        setFilteredUsers(prev => prev.map(u => {
          if ((u._id || u.id) === suggestedUserId) {
            const currentCount = parseInt(u.followers || u.followersCount || 0);
            return {
              ...u,
              followers: Math.max(0, currentCount - 1).toString(),
              followersCount: Math.max(0, currentCount - 1)
            };
          }
          return u;
        }));
        
        setUser(prev => ({
          ...prev,
          following: Math.max(0, parseInt(prev.following || 0) - 1).toString(),
          followingCount: Math.max(0, parseInt(prev.followingCount || prev.following || 0) - 1)
        }));
        
        const response = await unfollowUser(suggestedUserId);
        console.log("Unfollow response:", response);
        
      } else {
        setFollowingMap(prev => ({ ...prev, [key]: true }));
        
        setUsers(prev => prev.map(u => {
          if ((u._id || u.id) === suggestedUserId) {
            const currentCount = parseInt(u.followers || u.followersCount || 0);
            return {
              ...u,
              followers: (currentCount + 1).toString(),
              followersCount: currentCount + 1
            };
          }
          return u;
        }));
        
        setFilteredUsers(prev => prev.map(u => {
          if ((u._id || u.id) === suggestedUserId) {
            const currentCount = parseInt(u.followers || u.followersCount || 0);
            return {
              ...u,
              followers: (currentCount + 1).toString(),
              followersCount: currentCount + 1
            };
          }
          return u;
        }));
        
        setUser(prev => ({
          ...prev,
          following: (parseInt(prev.following || 0) + 1).toString(),
          followingCount: parseInt(prev.followingCount || prev.following || 0) + 1
        }));
        
        const response = await followUser(suggestedUserId);
        console.log("Follow response:", response);
      }
    } catch (err) {
      console.error('Error toggling follow status:', err);
      
      try {
        const statusResponse = await checkIsFollowing(suggestedUserId);
        setFollowingMap(prev => ({ 
          ...prev, 
          [key]: statusResponse.isFollowing || false 
        }));
        
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
        
        setUsers(allUsers);
        
        const userResponse = await getMe();
        setUser(userResponse.data);
        
      } catch (rollbackErr) {
        console.error('Error during rollback:', rollbackErr);
      }
      
      alert(err.response?.data?.message || 'Failed to update follow status');
    } finally {
      setFollowingStates(prev => ({ ...prev, [key]: false }));
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
        notificationShadow: "inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)",
        smallCardShadow: "7px 7px 14px #1c1f20,-7px -7px 14px #26292c",
      }
    : {
        bg: "#f9f9f9",
        text: "text-gray-900",
        subText: "text-gray-600",
        cardBg: "#f2f2f2",
        subCardBg: "#f2f2f2",
        border: "border-gray-300",
        notificationShadow: "inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)",
        smallCardShadow: "6px 6px 12px #6a6a6a,-6px -6px 12px #ffffff",
      };

  return (
    <>
      <CustomScrollbarStyles />
      <div className={`${theme.bg} ${theme.text} min-h-screen flex overflow-hidden transition-colors duration-300`}>
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

        <div className="flex flex-col flex-1 md:ml-20 lg:ml-20 overflow-x-hidden">
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

          <main className="flex-1 p-3 md:p-4 lg:p-6 overflow-y-auto overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              <h1 className={`text-2xl md:text-3xl font-bold ${theme.text} mb-6 md:mb-8`}>
                Suggestions
              </h1>

              {loading || !user ? (
                <div className="flex justify-center items-center py-16">
                  <div className={`text-lg ${theme.subText}`}>Loading suggestions...</div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className={`rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center min-h-[400px] ${theme.cardBg}`} style={{ boxShadow: theme.smallCardShadow }}>
                  <p className={`text-lg md:text-xl ${theme.text}`}>
                    No suggestions available
                  </p>
                </div>
              ) : (
<div className="space-y-4 max-w-6xl mx-auto w-[95%]">
                  {filteredUsers.map((suggestedUser) => {
                    const userId = suggestedUser._id || suggestedUser.id;
                    const eventCount = eventCountsMap[userId] || 0;
                    
                    return (
                      <div
                        key={userId}
                        className={`rounded-2xl md:rounded-3xl p-4 md:p-6 flex items-center justify-between transition-all duration-300 hover:scale-[1.01] cursor-pointer ${theme.cardBg}`}
                        style={{ boxShadow: theme.smallCardShadow }}
                        onClick={() => navigate(`/profile/${userId}`)}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <img
                            src={getImageUrl(suggestedUser.image, 'auth') || ProfileImage}    
                            alt={suggestedUser.name}
                            className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover flex-shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`text-base md:text-lg font-semibold ${theme.text} truncate`}>
                                {suggestedUser.name}
                              </h3>
                              {suggestedUser.verified && (
                                <img src={VerifiedIcon} alt="Verified" className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                              )}
                            </div>
                            <p className={`text-sm ${theme.subText} capitalize mb-2`}>
                              {suggestedUser.organisation_type || suggestedUser.role }
                            </p>
                            
                            <div className="hidden md:flex items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <img 
                                  src={FollowersIcon} 
                                  alt="Followers" 
                                  className={`w-4 h-4 ${!isDark ? "filter brightness-0" : ""}`}
                                />
                                <span className={`text-sm ${theme.text}`}>
                                  {suggestedUser.followers || 0}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <img 
                                  src={EventIcon} 
                                  alt="Events" 
                                  className={`w-4 h-4 ${!isDark ? "filter brightness-0" : ""}`}
                                />
                                <span className={`text-sm ${theme.text}`}>
                                  {eventCount}
                                </span>
                              </div>
                            </div>

                            {suggestedUser.mutualFollowers && (
                              <p className={`text-xs ${theme.subText} mt-2`}>
                                Followed by {suggestedUser.mutualFollowers}
                              </p>
                            )}
                          </div>
                        </div>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSuggestionFollowToggle(userId);
                          }}
                          disabled={followingStates[userId]}
className={`px-5 py-2 md:px-6 md:py-2.5 rounded-full text-white text-sm md:text-base font-semibold transition-all duration-200 ${
                            followingMap[userId]
                              ? 'bg-[#44444D] shadow-[0px_3px_6px_rgba(0,0,0,0.25)] hover:bg-[#50505A]'
                              : 'bg-blue-500 hover:bg-blue-600'
                          } ${followingStates[userId] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {followingStates[userId] ? (
                            followingMap[userId] ? 'Unfollowing...' : 'Following...'
                          ) : (
                            followingMap[userId] ? 'Unfollow' : 'Follow +'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
export default SuggestionsPage;
