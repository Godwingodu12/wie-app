  import React, { useState, useEffect } from "react";
  import { useParams, useNavigate, Link } from 'react-router-dom';
  import { getMe } from "../../services/userService";
  import { getOtherProfile, findAllActiveUsers,followUser,unfollowUser } from "../../services/authService";
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
  import PastEventIcon from "../../assets/PROFILEPAGE/PastEventIcon.svg";
  import LikeIcon from "../../assets/PROFILEPAGE/LikeIcon.svg";
  import SendIcon from "../../assets/PROFILEPAGE/SendIcon.svg";
  import RightArrowIcon from "../../assets/PROFILEPAGE/RightArrowIcon.svg"
  import HandBurgerIcon from "../../assets/PROFILEPAGE/HandburgerIcon.svg"

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

  const OtherProfilePage = () => {
    const { userId } = useParams(); // Get user ID from URL params
    const navigate = useNavigate();
    // const dispatch = useDispatch();
    const [currentUser, setCurrentUser] = useState(null); // Current logged-in user
    const [profileUser, setProfileUser] = useState(null); // User whose profile we're viewing
    const [users, setUsers] = useState([]);
    const [profileUserEvents, setProfileUserEvents] = useState([]);
    const [isDark, setIsDark] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

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
          
          // Handle the API response structure
          if (response?.user) {
            // If user is an array, take the first element
            const userData = Array.isArray(response.user) ? response.user[0] : response.user;
            setProfileUser(userData);
            setIsFollowing(userData.isFollowing || false);
            
            // Set empty events array - no dummy data generation
            setProfileUserEvents([]);
          } else {
            console.error("User not found in response");
            navigate("/profile"); // Redirect to own profile
          }
        } catch (err) {
          console.error("Failed to fetch profile user", err);
          navigate("/profile"); // Redirect to own profile on error
        } finally {
          setLoading(false);
        }
      };

      fetchProfileUser();
    }, [userId, navigate]);

    // Fetch suggestions (excluding current profile user and current logged-in user)
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
          
          // Filter out both the current profile user and the current logged-in user
          const filteredUsers = allUsers.filter(user => {
            const userIdToCheck = user._id || user.id;
            const currentUserIdToCheck = currentUser?._id || currentUser?.id;
            
            return userIdToCheck !== userId && 
                  userIdToCheck !== currentUserIdToCheck;
          });
          
          setUsers(filteredUsers);
          console.log("Filtered suggestions:", filteredUsers);
        } catch (err) {
          console.error("Failed to fetch active users:", err);
          setUsers([]);
        }
      };
      
      if (currentUser && userId) {
        fetchActiveUsers();
      }
    }, [userId, currentUser]);

    // Update arrow visibility based on suggestions
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

      // Check arrows when users change
      setTimeout(checkScrollArrows, 100); // Small delay to ensure DOM is updated
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
      try {
        if (isFollowing) {
          // Unfollow
          await unfollowUser(userId);
          setIsFollowing(false);
          setProfileUser(prev => ({
            ...prev,
            followers: (parseInt(prev.followers) - 1).toString(),
            followersCount: (parseInt(prev.followersCount || prev.followers) - 1)
          }));
        } else {
          // Follow
          await followUser(userId);
          setIsFollowing(true);
          setProfileUser(prev => ({
            ...prev,
            followers: (parseInt(prev.followers) + 1).toString(),
            followersCount: (parseInt(prev.followersCount || prev.followers) + 1)
          }));
        }
      } catch (err) {
        console.error("Failed to toggle follow status", err);
        // Show error message to user
        alert(err.response?.data?.message || "Failed to update follow status");
      } finally {
        setFollowLoading(false);
      }
    };
    const handleShareProfile = () => {
      if (navigator.share) {
        navigator.share({
          title: `${profileUser.name}'s Profile`,
          text: `Check out ${profileUser.name}'s profile on WIE`,
          url: window.location.href,
        });
      } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
          alert('Profile link copied to clipboard!');
        });
      }
    };

    const handleInviteToGroup = () => {
      // TODO: Implement invite to group functionality
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

    // Loading state
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
          {/* Sidebar */}
          <div className={`hidden md:flex flex-col flex-shrink-0 ${theme.bg} transition-colors duration-300`}>
            <div className="flex items-center justify-center" style={{ height: HEADER_HEIGHT }}>
              <img src={WieLogo} alt="Wie Logo" className="w-10 h-10 lg:w-12 lg:h-12" />
            </div>
            <div className="flex-1 overflow-y-auto">
              <SideBar user={currentUser} theme={theme} />
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
                {/* Profile Card */}
                <div className={`rounded-[3rem] p-6 mt-8 ${theme.cardBg} transition-all duration-300`} style={{boxShadow: theme.cardShadow}}>
                  {/* Desktop Layout - matching the image design */}
                  <div className="flex items-center justify-between">
                    {/* Left side - Profile info */}
                    <div className="flex items-center gap-8">
                      <img 
                        src={profileUser.image ? `http://localhost:3001/uploads/${profileUser.image}` : profileUser.avatar || "https://via.placeholder.com/150"}
                        alt="Profile"
                        className={`w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                      />
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <h1 className={`text-2xl md:text-3xl font-bold ${theme.text}`}>{profileUser.name}</h1>
                          <img src={VerifiedIcon} alt="Verified" className="w-6 h-6" />
                        </div>
                        <p className={`text-base ${theme.subText}`}>@{profileUser.username}</p>
                        <p className={`text-sm ${theme.subText} max-w-md leading-relaxed`}>
                          {profileUser.bio || "🌟 Exploring the world, one flight at a time ✈️\n📍 Currently: [Your Current Location]\n🎥 Capturing moments that matter"}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className={theme.subText}>Followed by</span>
                          </div>
                          <span className={theme.subText}>abcxy_jim, shan.cbssig_guy... and 8 more</span>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleFollowToggle}
                            disabled={followLoading}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              followLoading ? 'opacity-50 cursor-not-allowed' : ''
                            } ${
                              isFollowing
                                ? "text-white bg-gradient-to-b from-gray-600 to-gray-700 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:brightness-110"
                                : "text-white bg-gradient-to-b from-indigo-500 to-blue-500 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:brightness-110"
                            }`}
                          >
                            {followLoading ? (
                              <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                {isFollowing ? "Unfollowing..." : "Following..."}
                              </span>
                            ) : (
                              isFollowing ? "Following" : "Follow +"
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
                    
                    {/* Right side - Stats and menu */}
                    <div className="flex flex-col items-end gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div 
                            style={{ boxShadow: theme.notificationShadow }} 
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${theme.bg}`}
                          >
                            <img src={NotificationIcon} alt="Notification" className={`w-5 h-5 ${isDark ? 'filter brightness-0 invert' : 'filter brightness-0'}`} />
                          </div>
                        </div>
                        <button 
                            className={`w-10 h-10  flex items-center justify-center ${theme.bg}`}
                        >
                          <img src={HandBurgerIcon} alt="Menu" className={`w-10 h-10 ${isDark ? 'filter brightness-0 invert' : 'filter brightness-0'}`} />
                        </button>
                      </div>
                      
                      {/* Stats */}
                        <div className={`rounded-[2.5rem] px-10 py-4 flex gap-8 transition-all duration-300 ${theme.cardBg}`} style={{boxShadow: theme.smallCardShadow}}>                       <div className="flex flex-col items-center">
                          <img src={EventIcon} alt="Events" className={`w-6 h-6 mb-2 ${!isDark ? 'filter brightness-0' : ''}`} />
                          <span className={`text-2xl font-bold ${theme.text}`}>{profileUser.eventsCount || profileUserEvents.length || 22}</span>
                          <span className={`text-sm ${theme.subText}`}>Event created</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <img src={FollowersIcon} alt="Followers" className={`w-6 h-6 mb-2 ${!isDark ? 'filter brightness-0' : ''}`} />
                          <span className={`text-2xl font-bold ${theme.text}`}>{profileUser.followers}</span>
                          <span className={`text-sm ${theme.subText}`}>Follower</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <img src={FollowingIcon} alt="Following" className={`w-6 h-6 mb-2 ${!isDark ? 'filter brightness-0' : ''}`} />
                          <span className={`text-2xl font-bold ${theme.text}`}>{profileUser.following}</span>
                          <span className={`text-sm ${theme.subText}`}>Following</span>
                        </div>
                      </div>
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
                    {/* Left Arrow - only show when there are users and can scroll left */}
                    {showLeftArrow && users.length > 0 && (
                      <button
                        onClick={scrollLeft}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 transition"
                      >
                        <img src={RightArrowIcon} alt="Scroll Left" className="w-6 h-6 rotate-180 invert" />
                      </button>
                    )}

                    {/* Scrollable Users */}
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
                                  src={
                                    suggestedUser.image
                                      ? `http://localhost:3001/uploads/${suggestedUser.image}`
                                      : suggestedUser.avatar || "https://via.placeholder.com/214x160"
                                  }
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
                                    {suggestedUser.followersCount || Math.floor(Math.random() * 500) + 100}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <img
                                    src={EventIcon}
                                    alt="Events"
                                    className={`w-4 h-4 ${!isDark ? "filter brightness-0" : ""}`}
                                  />
                                  <span className={`text-sm font-medium ${theme.text}`}>
                                    {suggestedUser.eventsCount || Math.floor(Math.random() * 50) + 10}
                                  </span>
                                </div>
                              </div>
                              <button 
                                className="px-4 py-1.5 rounded-full text-white text-sm font-medium bg-blue-500 hover:bg-blue-600 transition-colors duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log(`Following user: ${suggestedUser.name}`);
                                }}
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

                    {/* Right Arrow - only show when there are users and can scroll right */}
                    {showRightArrow && users.length > 0 && (
                      <button
                        onClick={scrollRight}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 transition"
                      >
                        <img src={RightArrowIcon} alt="Scroll Right" className="w-6 h-6 invert" />
                      </button>
                    )}
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
                      <div className="flex flex-col items-center gap-2 cursor-pointer">
                        <img
                          src={AllEventsIcon}
                          alt="All events"
                          className={`w-6 h-6 ${!isDark ? "filter brightness-0" : ""}`}
                        />
                        <span className={`text-sm font-medium ${theme.text}`}>
                          All Events
                        </span>
                        <div className="w-full h-0.5 bg-blue-500"></div>
                      </div>
                      <div className="flex flex-col items-center gap-2 cursor-pointer opacity-60">
                        <img
                          src={LiveEventIcon}
                          alt="Live events"
                          className={`w-6 h-6 ${!isDark ? "filter brightness-0" : ""}`}
                        />
                        <span className={`text-sm font-medium ${theme.text}`}>
                          Live Events
                        </span>
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

                  {/* Events Content - Always show empty state since no real events */}
                  <div className="flex flex-col items-center justify-center py-16 md:py-24">
                    <div className={`w-24 h-24 rounded-full ${theme.cardBg} flex items-center justify-center mb-6`} style={{boxShadow: theme.smallCardShadow}}>
                      <img src={EventIcon} alt="No Events" className={`w-12 h-12 opacity-50 ${!isDark ? 'filter brightness-0' : ''}`} />
                    </div>
                    <h3 className={`text-xl font-medium ${theme.text} mb-4`}>
                      No events created
                    </h3>
                    <p className={`text-sm ${theme.subText} text-center max-w-md`}>
                      {profileUser.name} hasn't created any events yet. When they do, you'll see them here.
                    </p>
                  </div>
                </div>
              </div>
            </main>

            {/* Bottom Navigation */}
            <BottomNavigation />
          </div>
        </div>
      </>
    );
  };
  export default OtherProfilePage;