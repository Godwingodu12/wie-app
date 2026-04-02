"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  MoreVertical,
  UserPlus,
  UserCheck,
  Play,
  Video,
  Image as ImageIcon,
  Copy,
  ChevronRight,
  MapPin,
  Lock,
  Calendar,
  Loader2,
  Mail,
  Phone,
  X,
} from "lucide-react";
import SideBar from "@/components/home/SideBar";
import { useSidebar } from "@/context/SidebarContext";
import {
  getUserById,
  getSuggestedUsers,
  searchUsers,
} from "@/services/wieUserService";
import { getUserFluxes, getUserDiaries } from "@/services/mediaService";
import type { Flux, Diary }from "@/services/mediaService";
import OtherFollowModal from "@/components/profile/OtherFollowModal";
import {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowStats,
  getDetailedFollowStatus,
  cancelFollowRequest,
  isFollowedBy
} from "@/services/followService";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/home/ThemeContext";
import { useChat } from '@/context/ChatContext';
import { createOrGetWieChat } from '@/services/chatService';
import { User } from "@/types";


const ActionButton = ({
  label,
  active = false,
  onClick,
  disabled = false,
  icon: Icon,
  themeStyles,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ElementType;
  themeStyles: any;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`group relative flex items-center justify-center gap-1 sm:gap-2 transition-all overflow-hidden flex-1 min-w-[30%] sm:min-w-[120px] md:min-w-[140px] max-w-full sm:max-w-[200px] hover:scale-105 active:scale-95 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    style={{
      height: "42px",
      borderRadius: "25px",
      background: active
        ? "linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)"
        : themeStyles.pillBg,
      border: `1px solid ${themeStyles.border}`,
      color: active ? "#FFFFFF" : themeStyles.text,
    }}
  >
    <div className="relative z-10 flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 w-full">
      {Icon && <Icon size={16} className="shrink-0 sm:w-[18px] sm:h-[18px]" />}
      <span className="text-[11px] sm:text-[13px] md:text-sm font-medium whitespace-nowrap opacity-90 truncate">
        {label}
      </span>
    </div>
  </button>
);

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isCollapsed, isMobile } = useSidebar();
  const { themeStyles, isDark } = useTheme();
  const { user: currentUser } = useAuth();
  const { loadChatById, chats } = useChat();
  const identifier = params.userId as string;
  const [user, setUser] = useState<User | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [isFollowedByTarget, setIsFollowedByTarget] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [followStatus, setFollowStatus] = useState<{
    isFollowing: boolean;
    isPending: boolean;
    status: string;
  }>({ isFollowing: false, isPending: false, status: 'none' });
  const [suggestedFollowStatus, setSuggestedFollowStatus] = useState<
    Record<string, boolean>
  >({});
  const [activeTab, setActiveTab] = useState<
    "posts" | "reels" | "feed" | "tags"
  >("posts");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isUUID = (val: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  const isOwnProfile =
    currentUser &&
    (currentUser.id === identifier || currentUser.username === identifier);

  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const [posts,        setPosts]        = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [userFluxes,   setUserFluxes]   = useState<Flux[]>([]);
  const [userDiaries,  setUserDiaries]  = useState<Diary[]>([]);
  const [fluxLoading,  setFluxLoading]  = useState(false);
  const highlightsRef = useRef<HTMLDivElement>(null);

  const scrollHighlights = (direction: "left" | "right") => {
    if (highlightsRef.current) {
      const scrollAmount = 250;
      highlightsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (identifier) {
      if (isOwnProfile) {
        router.push("/profile");
        return;
      }
      fetchUserData();
      fetchSuggestedUsers();
    }
  }, [identifier, isOwnProfile]);

useEffect(() => {
    if (resolvedUserId) {
      fetchUserPosts(activeTab);
    }
  }, [resolvedUserId, activeTab]);

  const fetchUserFluxAndDiary = async (uid: string) => {
    setFluxLoading(true);
    try {
      const [fluxes, diaries] = await Promise.all([
        getUserFluxes(uid).catch(() => [] as Flux[]),
        getUserDiaries(uid).catch(() => [] as Diary[]),
      ]);
      setUserFluxes(fluxes  ?? []);
      setUserDiaries(diaries ?? []);
    } catch (e) {
      // Silently fail — backend returns empty arrays for unauthorized access
      setUserFluxes([]);
      setUserDiaries([]);
    } finally {
      setFluxLoading(false);
    }
  };

const fetchUserData = async () => {
    try {
      setLoading(true);
      let targetId = identifier;

      if (!isUUID(identifier)) {
        try {
          const searchRes = await searchUsers(identifier, 1, 1);
          const foundUser = searchRes.users?.find(
            (u: User) => u.username?.toLowerCase() === identifier.toLowerCase(),
          );

          if (foundUser) {
            targetId = foundUser.id;
          } else {
            console.error("User not found by username");
            setUser(null);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Failed to resolve username:", error);
          setUser(null);
          setLoading(false);
          return;
        }
      }
      setResolvedUserId(targetId);
      fetchUserFluxAndDiary(targetId);
      const [userData, detailedStatus, userStats, followedByThem] = await Promise.all([
        getUserById(targetId),
        getDetailedFollowStatus(targetId),
        getFollowStats(targetId),
        isFollowedBy(targetId),
      ]);
      setUser(userData);
      setFollowStatus(detailedStatus);
      setIsFollowingUser(detailedStatus.isFollowing);
      setStats(userStats);
      setIsFollowedByTarget(followedByThem);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
const handleMessageClick = async () => {
  if (!resolvedUserId) return;
  try {
    // ✅ First, check if a chat already exists in context
    const existingChat = chats.find(
      chat => chat.participant?._id === resolvedUserId
    );

    if (existingChat) {
      // ✅ Load existing chat and navigate
      await loadChatById(existingChat._id);
      router.push('/message');
      return;
    }

    // ✅ If no existing chat in context, create or get from server
    const response = await createOrGetWieChat(resolvedUserId);

    if (response.success && response.chat) {
      // ✅ Load the chat (whether existing or new)
      await loadChatById(response.chat._id);
      router.push('/message');
    }
  } catch (error: any) {
    console.error('❌ Failed to create/get chat:', error);
    // Show user-friendly error message
    if (error.response?.status === 403) {
      alert(error.response?.data?.message || 'Cannot create chat with this user');
    } else if (error.response?.status === 404) {
      alert('User not found');
    } else {
      alert('Failed to open chat. Please try again.');
    }
  }
};
  const fetchUserPosts = async (tab: string) => {
    if (!resolvedUserId) return;
    try {
      setPostsLoading(true);
      // Simulate API call for posts
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockPosts = Array(8)
        .fill(null)
        .map((_, i) => ({
          id: `post-${i}`,
          image_url: `https://picsum.photos/seed/${resolvedUserId}-${i + 100}/500/500`,
          views: "1.7M",
          type: i % 3 === 0 ? "video" : i % 3 === 1 ? "collection" : "image",
          likes_count: Math.floor(Math.random() * 1000),
          comments_count: Math.floor(Math.random() * 100),
        }));

      setPosts(mockPosts);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const users = await getSuggestedUsers(6);
      setSuggestedUsers(users);

      // Check following status for suggested users
      const statusChecks = await Promise.all(
        users.map(async (u: User) => {
          const status = await isFollowing(u.id);
          return { userId: u.id, isFollowing: status };
        }),
      );

      const statusMap: Record<string, boolean> = {};
      statusChecks.forEach(({ userId, isFollowing }) => {
        statusMap[userId] = isFollowing;
      });
      setSuggestedFollowStatus(statusMap);
    } catch (error) {
      console.error("Failed to fetch suggested users:", error);
    }
  };
const handleFollowToggle = async () => {
    if (!user || !resolvedUserId) return;
    try {
      setFollowLoading(true);

      if (followStatus.isPending) {
        // Cancel follow request
        await cancelFollowRequest(resolvedUserId);
        setFollowStatus({ isFollowing: false, isPending: false, status: 'none' });
        setIsFollowingUser(false);
      } else if (followStatus.isFollowing) {
        // Unfollow
        await unfollowUser(resolvedUserId);
        setFollowStatus({ isFollowing: false, isPending: false, status: 'none' });
        setIsFollowingUser(false);
        setStats((prev) => ({
          ...prev,
          followers: Math.max(0, prev.followers - 1),
        }));
      } else {
        // Follow or send request
        const result = await followUser(resolvedUserId);

        if (result.status === 'pending') {
          // Private account - request sent (DON'T increment count)
          setFollowStatus({ isFollowing: false, isPending: true, status: 'pending' });
          setIsFollowingUser(false);
        } else if (result.status === 'active') {
          // Public account - followed (increment count)
          setFollowStatus({ isFollowing: true, isPending: false, status: 'active' });
          setIsFollowingUser(true);
          setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
        }
      }
    } catch (error: any) {
      console.error("Follow toggle error:", error);
      // Show user-friendly error message
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    } finally {
      setFollowLoading(false);
    }
  };
  const handleSuggestedFollowToggle = async (suggestedUserId: string) => {
    try {
      if (suggestedFollowStatus[suggestedUserId]) {
        await unfollowUser(suggestedUserId);
        setSuggestedFollowStatus((prev) => ({
          ...prev,
          [suggestedUserId]: false,
        }));
      } else {
        await followUser(suggestedUserId);
        setSuggestedFollowStatus((prev) => ({
          ...prev,
          [suggestedUserId]: true,
        }));
      }
    } catch (error) {
      console.error("Suggested follow toggle error:", error);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getProfileUrl = () => {
    if (typeof window === "undefined" || !user) return "";
    const username = user.username || user.id;
    return `${window.location.origin}/profile/${username}`;
  };

  const handleShareProfile = async () => {
    const url = getProfileUrl();
    if (!url) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${user?.name || "User"}'s Profile`,
          text: `Check out ${user?.name || "this user"}'s profile on our app!`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        // Fallback to clipboard
      }
      setIsMenuOpen(false);
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const handleCopyProfileUrl = async () => {
    const url = getProfileUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setIsMenuOpen(false);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ background: themeStyles.background }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#8860D9]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen" style={{ background: themeStyles.background }}>
        <SideBar />
        <main className="ml-0 md:ml-[105px] lg:ml-[281px] transition-all duration-300">
          <div className="flex justify-center items-center min-h-screen">
            <div className="text-center">
              <p className="text-xl mb-4" style={{ color: themeStyles.text }}>User not found</p>
              <button
                onClick={() => router.push("/home")}
                className="px-6 py-2 bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white rounded-full hover:opacity-90 transition-opacity"
              >
                Go Home
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="h-screen overflow-y-auto scrollbar-hide font-sans selection:bg-[#5E5CE6] selection:text-white flex overflow-x-hidden"
      style={{
        backgroundColor: themeStyles.background,
        color: themeStyles.text
      }}
    >
      <SideBar />

      <main
        className={`transition-all duration-300 ease-in-out flex-1 w-full
            pb-24 px-0 pt-0
            sm:p-4 sm:pb-24
            md:p-6 md:pb-6
            lg:p-8 lg:pb-8
            lg:ml-[250px] xl:ml-[281px]`}
      >
        {/* Main Card Container */}
        <div
          className={`w-full relative overflow-hidden flex flex-col mx-auto
            rounded-none sm:rounded-[20px] md:rounded-[28px] lg:rounded-[32px]
            my-0 sm:my-2 md:my-4 lg:my-8
            min-h-screen sm:min-h-[calc(100vh-48px)] md:min-h-[calc(100vh-56px)] lg:min-h-[calc(100vh-64px)]
            border-none sm:border md:border
            shadow-none sm:shadow-lg md:shadow-xl lg:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]
            max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[700px] xl:max-w-[1200px]
          `}
          style={{
            background: themeStyles.cardBg,
            borderColor: themeStyles.border,
          }}
        >
          {/* Content Wrapper */}
          <div
            className={`p-4 pt-6 sm:p-5 md:p-8 lg:p-10 relative z-10 w-full flex flex-col`}
          >
            <div className="flex justify-between items-center mb-4 sm:mb-6 md:mb-8 w-full">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => router.back()}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-colors"
                  style={{ background: themeStyles.pillBg, color: themeStyles.textSecondary }}
                >
                  <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
                </button>
                <h2 className="text-base sm:text-lg md:text-xl font-medium tracking-tight truncate max-w-[120px] sm:max-w-[200px] md:max-w-none" style={{ color: themeStyles.text }}>
                  @
                  {user.username ||
                    user.name?.toLowerCase().replace(/\s+/g, "")}
                </h2>
              </div>

              {/* Three Dots Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-colors"
                  style={{ background: themeStyles.pillBg, color: themeStyles.textSecondary }}
                >
                  <MoreVertical size={18} className="sm:w-5 sm:h-5" />
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <div
                      className="absolute right-0 top-full mt-2 w-[200px] sm:w-[286px] rounded-[20px] sm:rounded-[30px] shadow-2xl z-50 overflow-hidden py-2 sm:py-4 flex flex-col backdrop-blur-xl"
                      style={{
                        background: themeStyles.cardBg,
                        border: `1px solid ${themeStyles.border}`
                      }}
                    >
                      <button className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-[#FF453A] text-xs sm:text-sm font-medium hover:opacity-80 transition-opacity">
                        Restrict
                      </button>
                      <button className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-[#FF453A] text-xs sm:text-sm font-medium hover:opacity-80 transition-opacity">
                        Block
                      </button>
                      <button className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-[#FF453A] text-xs sm:text-sm font-medium hover:opacity-80 transition-opacity">
                        Report
                      </button>
                      <button className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm hover:opacity-80 transition-opacity" style={{ color: themeStyles.text }}>
                        About this account
                      </button>

                      <button
                        onClick={handleCopyProfileUrl}
                        className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm hover:opacity-80 transition-opacity" style={{ color: themeStyles.text }}
                      >
                        Copy profile URL
                      </button>
                      <button
                        onClick={handleShareProfile}
                        className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm hover:opacity-80 transition-opacity" style={{ color: themeStyles.text }}
                      >
                        Share this profile
                      </button>
                      <button className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm hover:opacity-80 transition-opacity" style={{ color: themeStyles.text }}>
                        QR code
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Profile Info Section - Centered */}
            <div className="flex flex-col items-center w-full px-0 sm:px-4 md:px-8 lg:px-10 mb-6 sm:mb-8">
              <div className="flex flex-col items-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 w-full max-w-lg">
                {/* Avatar — flux ring + click to view */}
                <div className="relative">
                  <div
                    onClick={() => {
                      if (userFluxes.length > 0 && resolvedUserId) {
                        router.push(
                          `/post/flux-view?fluxId=${userFluxes[0]._id}&userId=${resolvedUserId}`
                        );
                      }
                    }}
                    style={{
                      padding:      userFluxes.length > 0 ? 3 : 0,
                      borderRadius: "50%",
                      // Animated gradient ring when has flux
                      background:   userFluxes.length > 0
                        ? "linear-gradient(135deg,#8860D9 0%,#B3B8E2 40%,#2979FF 80%,#8860D9 100%)"
                        : "transparent",
                      backgroundSize: "200% 200%",
                      cursor:       userFluxes.length > 0 ? "pointer" : "default",
                      display:      "inline-block",
                      transition:   "all 0.3s ease",
                      animation:    userFluxes.length > 0 ? "gradient-spin 3s linear infinite" : "none",
                    }}
                  >
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-[124px] lg:h-[124px] rounded-full overflow-hidden relative transition-all duration-300 shadow-xl"
                      style={{
                        border: userFluxes.length > 0
                          ? "3px solid #0A0A0C"
                          : "3px solid #1C1C1E",
                      }}
                    >
                      {user.profile_picture ? (
                        <Image
                          src={user.profile_picture}
                          alt={user.name || "User"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] flex items-center justify-center">
                          <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                            {user.name?.charAt(0)?.toUpperCase() ||
                              user.username?.charAt(0)?.toUpperCase() ||
                              "U"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Animated ring pulse while flux loading */}
                  {fluxLoading && (
                    <div
                      style={{
                        position:     "absolute",
                        inset:        -4,
                        borderRadius: "50%",
                        border:       "2px solid rgba(136,96,217,0.4)",
                        animation:    "ring-pulse 1.2s ease-in-out infinite",
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  {/* Flux count badge */}
                  {userFluxes.length > 1 && (
                    <div
                      style={{
                        position:        "absolute",
                        bottom:          2,
                        right:           2,
                        width:           20,
                        height:          20,
                        borderRadius:    "50%",
                        background:      "linear-gradient(135deg,#8860D9,#B3B8E2)",
                        display:         "flex",
                        alignItems:      "center",
                        justifyContent:  "center",
                        fontSize:        10,
                        fontWeight:      700,
                        color:           "#fff",
                        border:          "2px solid #0A0A0C",
                        zIndex:          2,
                      }}
                    >
                      {userFluxes.length}
                    </div>
                  )}

                  <style>{`
                    @keyframes ring-pulse {
                      0%,100% { opacity: 0.3; transform: scale(1);    }
                      50%     { opacity: 0.8; transform: scale(1.05); }
                    }
                    @keyframes gradient-spin {
                      0%   { background-position: 0% 50%;   }
                      50%  { background-position: 100% 50%; }
                      100% { background-position: 0% 50%;   }
                    }
                  `}</style>
                </div>

                {/* Name & Handle */}
                <div className="flex flex-col items-center text-center gap-0.5 sm:gap-1">
                  <div className="flex items-center justify-center gap-1">
                    <h1
                      className={`text-lg sm:text-xl md:text-2xl lg:text-[26px] font-semibold tracking-tight`}
                      style={{ color: themeStyles.text }}
                    >
                      {user.name || user.username || "User"}
                    </h1>
                  </div>
                  <p className="text-[#B5B5B5] text-xs sm:text-sm md:text-base font-medium">
                    @
                    {user.username ||
                      user.name?.toLowerCase().replace(/\s+/g, "")}
                  </p>
                </div>

                {/* Bio */}
                <div className="text-sm text-center leading-relaxed px-4 whitespace-pre-line" style={{ color: themeStyles.textSecondary }}>
                  <p>{user.bio || "No bio yet"}</p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-center gap-3 sm:gap-5 md:gap-8 lg:gap-12 mb-6 sm:mb-8 w-full">
                <div className="text-center">
                  <div className="text-base sm:text-lg md:text-xl lg:text-[22px] font-semibold leading-none" style={{ color: themeStyles.text }}>
                    {user.posts_count || 0}
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm mt-0.5 font-medium" style={{ color: themeStyles.textSecondary }}>
                    Posts
                  </div>
                </div>

                <div className="h-10 w-[0.5px]" style={{ background: themeStyles.divider }}></div>

                <button
                  className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowFollowersModal(true)}
                >
                  <div className="text-base sm:text-lg md:text-xl lg:text-[22px] font-semibold leading-none" style={{ color: themeStyles.text }}>
                    {formatNumber(stats.followers)}
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm mt-0.5 font-medium" style={{ color: themeStyles.textSecondary }}>
                    Followers
                  </div>
                </button>

                <div className="h-10 w-[0.5px]" style={{ background: themeStyles.divider }}></div>

                <button
                  className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowFollowingModal(true)}
                >
                  <div className="text-base sm:text-lg md:text-xl lg:text-[22px] font-semibold leading-none" style={{ color: themeStyles.text }}>
                    {formatNumber(stats.following)}
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm mt-0.5 font-medium" style={{ color: themeStyles.textSecondary }}>
                    Following
                  </div>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 md:gap-3 w-full px-1 sm:px-0 max-w-full sm:max-w-sm md:max-w-md lg:max-w-lg">
                <ActionButton
                  label={
                    followLoading
                      ? "..."
                      : followStatus.isPending
                        ? "Requested"
                        : followStatus.isFollowing
                          ? "Following"
                          : isFollowedByTarget
                            ? "Follow Back"
                            : "Follow"
                  }
                  active={!followStatus.isFollowing && !followStatus.isPending}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  icon={
                    followLoading
                      ? Loader2
                      : followStatus.isPending
                        ? UserCheck
                        : followStatus.isFollowing
                          ? UserCheck
                          : UserPlus
                  }
                  themeStyles={themeStyles}
                />
                <ActionButton
                  label="Message"
                  onClick={handleMessageClick}
                  themeStyles={themeStyles}
                />
                {user.email && (
                  <ActionButton
                    label="Contact"
                    onClick={() => setContactModalOpen(true)}
                    themeStyles={themeStyles}
                  />
                )}
              </div>
            </div>
            {/* Only show content if user is public OR user is following */}
            {(() => {
              const privacy = (user as any).account_privacy ?? (user as any).accountPrivacy ?? 'public';
              return privacy === 'public' || followStatus.isFollowing;
            })() ? (
              <>
            {/* ── Diary / Highlights Section ── */}
            <div className="w-full flex justify-center items-center mb-8 md:mb-10 relative">
              {/* Left Arrow */}
              <button
                onClick={() => scrollHighlights("left")}
                className="absolute left-0 z-10 w-8 h-8 sm:w-9 sm:h-9 hidden lg:flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              >
                <ChevronLeft size={18} />
              </button>

              <div
                ref={highlightsRef}
                className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 w-full max-w-[280px] sm:max-w-lg md:max-w-4xl scrollbar-hide px-8 sm:px-4 md:px-0"
              >
                {fluxLoading ? (
                  /* Loading skeleton */
                  Array(4).fill(null).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 min-w-[70px] flex-shrink-0">
                      <div
                        className="w-[70px] h-[100px] rounded-xl animate-pulse"
                        style={{ background: themeStyles.pillBg }}
                      />
                      <div className="w-12 h-3 rounded animate-pulse" style={{ background: themeStyles.pillBg }} />
                    </div>
                  ))
                ) : userDiaries.length > 0 ? (
                  /* Real diary items */
                  userDiaries.map((diary) => (
                    <div
                      key={diary._id}
                      className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer group flex-shrink-0"
                      onClick={() => router.push(`/profile/diary/view/${diary._id}`)}
                    >
                      <div className="relative w-[70px] h-[100px] rounded-xl overflow-hidden border border-white/20 transition-all group-hover:scale-105"
                        style={{ background: themeStyles.pillBg }}
                      >
                        {diary.coverImage ? (
                          <img
                            src={diary.coverImage}
                            alt={diary.title}
                            className="w-full h-full object-cover"
                          />
                        ) : diary.fluxes?.[0]?.mediaUrl ? (
                          <img
                            src={diary.fluxes[0].mediaUrl}
                            alt={diary.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg,#8860D9,#B3B8E2)" }}
                          >
                            <span style={{ fontSize: 24 }}>📔</span>
                          </div>
                        )}
                        {/* Flux count badge on diary */}
                        {diary.fluxCount > 0 && (
                          <div style={{
                            position:       "absolute",
                            bottom:         4,
                            right:          4,
                            background:     "rgba(0,0,0,0.6)",
                            borderRadius:   6,
                            padding:        "1px 5px",
                            fontSize:       9,
                            color:          "#fff",
                            fontWeight:     600,
                          }}>
                            {diary.fluxCount}
                          </div>
                        )}
                      </div>
                      <span
                        className="text-xs text-center truncate w-full"
                        style={{ color: themeStyles.textSecondary }}
                      >
                        {diary.title}
                      </span>
                    </div>
                  ))
                ) : (
                  /* No diaries */
                  <div className="flex flex-col items-center justify-center py-4 px-6 opacity-40">
                    <span style={{ fontSize: 28 }}>📔</span>
                    <span className="text-xs mt-2" style={{ color: themeStyles.textSecondary }}>
                      No diaries yet
                    </span>
                  </div>
                )}
              </div>
              {/* Right Arrow */}
              <button
                onClick={() => scrollHighlights("right")}
                className="absolute right-0 z-10 w-8 h-8 sm:w-9 sm:h-9 hidden lg:flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            {/* Profile Tabs & Content */}
            <div className="w-full">
              <ProfileTabs
                userId={resolvedUserId || identifier}
                isMobile={isMobile}
                isOwnProfile={false}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>
              </>
              ) : (
              /* Private Account Message */
              <div className="w-full flex flex-col items-center justify-center py-16 px-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: themeStyles.pillBg }}>
                  <Lock size={32} style={{ color: themeStyles.textSecondary }} />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: themeStyles.text }}>
                  This Account is Private
                </h3>
                <p className="text-center text-sm max-w-sm" style={{ color: themeStyles.textSecondary }}>
                  {followStatus.isPending
                    ? "Follow request sent. You'll see their posts once they approve your request."
                    : "Follow this account to see their posts and stories."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <OtherFollowModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={resolvedUserId || identifier}
        userName={user?.name ?? undefined}
        initialTab="followers"
        onFollowingCountChange={(change) => {
          setStats((prev) => ({
            ...prev,
            following: Math.max(0, prev.following + change),
          }));
        }}
      />

      <OtherFollowModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        userId={resolvedUserId || identifier}
        userName={user?.name ?? undefined}
        initialTab="following"
        onFollowingCountChange={(change) => {
          setStats((prev) => ({
            ...prev,
            following: Math.max(0, prev.following + change),
          }));
        }}
      />

      {/* Contact Modal */}
      {contactModalOpen && user && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setContactModalOpen(false)}
        >
          <div
            className="rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200"
            style={{
              background: isDark ? "#0B0D0F" : "#FFFFFF",
              border: `1px solid ${themeStyles.border}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-4 flex justify-between items-center"
              style={{
                borderBottom: `1px solid ${themeStyles.border}`,
                background: themeStyles.pillBg
              }}
            >
              <h3 className="text-lg font-semibold" style={{ color: themeStyles.text }}>Contact Info</h3>
              <button
                onClick={() => setContactModalOpen(false)}
                className="p-1 rounded-full transition-colors hover:opacity-80"
                style={{ color: themeStyles.textSecondary }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-3">


              {user.email && (
                <a
                  href={`mailto:${user.email}`}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all group"
                  style={{
                    background: themeStyles.cardBg,
                    border: `1px solid ${themeStyles.border}`
                  }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: themeStyles.pillBg, color: themeStyles.text }}>
                    <Mail size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: themeStyles.textSecondary }}>Email</span>
                    <span className="text-sm font-medium break-all" style={{ color: themeStyles.text }}>{user.email}</span>
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>
      )}


      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
