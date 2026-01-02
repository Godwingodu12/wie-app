"use client";

import React, { useState, useEffect } from "react";
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
  Calendar,
  Loader2,
} from "lucide-react";
import SideBar from "@/components/home/SideBar";
import { useSidebar } from "@/context/SidebarContext";
import {
  getUserById,
  getSuggestedUsers,
  searchUsers,
} from "@/services/wieUserService";
import OtherFollowersModal from "@/components/profile/OtherFollowersModal";
import OtherFollowingModal from "@/components/profile/OtherFollowingModal";
import {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowStats,
} from "@/services/followService";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types";

const HIGHLIGHTS = [
  {
    id: 1,
    label: "Travel",
    img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=150&h=150&fit=crop",
  },
  {
    id: 2,
    label: "Fooding",
    img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=150&h=150&fit=crop",
  },
  {
    id: 3,
    label: "Friends",
    img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&h=150&fit=crop",
  },
  {
    id: 4,
    label: "Architect",
    img: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=150&h=150&fit=crop",
  },
  {
    id: 5,
    label: "Car",
    img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=150&h=150&fit=crop",
  },
  {
    id: 6,
    label: "Random",
    img: "https://images.unsplash.com/photo-1496449903678-68ddcb189a24?w=150&h=150&fit=crop",
  },
  {
    id: 7,
    label: "Mask",
    img: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&h=150&fit=crop",
  },
  {
    id: 8,
    label: "Films",
    img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=150&h=150&fit=crop",
  },
  {
    id: 9,
    label: "Me",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
  },
];

const ActionButton = ({
  label,
  active = false,
  onClick,
  disabled = false,
  icon: Icon,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ElementType;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`group relative flex items-center justify-center gap-2 transition-all text-white overflow-hidden flex-1 min-w-[100px] sm:min-w-[140px] max-w-[200px] hover:scale-105 active:scale-95 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    style={{
      height: "42px",
      borderRadius: "25px",
      padding: "8px 16px",
      background:
        "linear-gradient(180deg, #373737 0%, #262626 50%, #1C1C1C 100%)",
      border: "1px solid rgba(255, 255, 255, 0.05)",
    }}
  >
    <div className="relative z-10 flex items-center gap-2">
      {Icon && <Icon size={16} className="shrink-0" />}
      <span className="text-[12px] sm:text-[13px] md:text-sm font-medium whitespace-nowrap opacity-90">
        {label}
      </span>
    </div>
  </button>
);

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isCollapsed, isMobile } = useSidebar();
  const { user: currentUser } = useAuth();

  const identifier = params.userId as string;
  const [user, setUser] = useState<User | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [suggestedFollowStatus, setSuggestedFollowStatus] = useState<
    Record<string, boolean>
  >({});
  const [activeTab, setActiveTab] = useState<
    "posts" | "reels" | "feed" | "tags"
  >("posts");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const marginLeft = isMobile ? "0" : isCollapsed ? "105px" : "281px";

  const isUUID = (val: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  const isOwnProfile =
    currentUser &&
    (currentUser.id === identifier || currentUser.username === identifier);

  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

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

  const fetchUserData = async () => {
    try {
      setLoading(true);
      let targetId = identifier;

      // If not a UUID, resolve username to ID
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

      const [userData, followStatus, userStats] = await Promise.all([
        getUserById(targetId),
        isFollowing(targetId),
        getFollowStats(targetId),
      ]);

      setUser(userData);
      setIsFollowingUser(followStatus);
      setStats(userStats);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setLoading(false);
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
      if (isFollowingUser) {
        await unfollowUser(resolvedUserId);
        setIsFollowingUser(false);
        setStats((prev) => ({
          ...prev,
          followers: Math.max(0, prev.followers - 1),
        }));
      } else {
        await followUser(resolvedUserId);
        setIsFollowingUser(true);
        setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (error) {
      console.error("Follow toggle error:", error);
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
      <div className="flex justify-center items-center min-h-screen bg-[#050505] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#8860D9]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <SideBar />
        <main style={{ marginLeft }}>
          <div className="flex justify-center items-center min-h-screen">
            <div className="text-center">
              <p className="text-white text-xl mb-4">User not found</p>
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
      className="h-screen overflow-y-auto scrollbar-hide text-white font-sans selection:bg-[#5E5CE6] selection:text-white flex overflow-x-hidden"
      style={{ backgroundColor: "#0C1014" }}
    >
      <SideBar />

      <main
        className={`transition-all duration-300 ease-in-out flex-grow ${
          isMobile ? "pb-24 px-0 pt-0" : "p-8"
        }`}
        style={{ marginLeft: isMobile ? "0px" : marginLeft }}
      >
        {/* Main Card Container */}
        <div
          className={`w-full relative overflow-hidden flex flex-col mx-auto ${
            isMobile
              ? "rounded-none min-h-screen"
              : "md:rounded-[32px] rounded-[24px] my-4 md:my-8"
          }`}
          style={{
            maxWidth: "1400px",
            minHeight: isMobile ? "100vh" : "calc(100vh - 64px)",
            background:
              "linear-gradient(180deg, rgba(55, 55, 55, 0.2) 0%, rgba(38, 38, 38, 0.2) 50%, rgba(28, 28, 28, 0.2) 100%)",
            border: isMobile ? "none" : "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: isMobile
              ? "none"
              : "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Content Wrapper */}
          <div
            className={`${isMobile ? "p-4 pt-8" : "p-5 md:p-10"} relative z-10 w-full`}
          >
            <div className="flex justify-between items-center mb-4 sm:mb-6 md:mb-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.back()}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-base sm:text-lg md:text-xl font-medium text-white/90 tracking-tight truncate max-w-[150px] sm:max-w-none">
                  @
                  {user.username ||
                    user.name?.toLowerCase().replace(/\s+/g, "")}
                </h2>
              </div>

              {/* Three Dots Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                >
                  <MoreVertical size={20} />
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-[220px] sm:w-[286px] bg-[#1C2024]/90 border border-white/10 rounded-[20px] sm:rounded-[30px] shadow-2xl z-50 overflow-hidden py-2 sm:py-4 flex flex-col backdrop-blur-xl">
                      <button className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-[#FF453A] text-xs sm:text-sm font-medium hover:bg-white/5 transition-colors">
                        Restrict
                      </button>
                      <button className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-[#FF453A] text-xs sm:text-sm font-medium hover:bg-white/5 transition-colors">
                        Block
                      </button>
                      <button className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-[#FF453A] text-xs sm:text-sm font-medium hover:bg-white/5 transition-colors">
                        Report
                      </button>
                      <button className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-white text-xs sm:text-sm hover:bg-white/5 transition-colors">
                        About this account
                      </button>
                      <button className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-white text-xs sm:text-sm hover:bg-white/5 transition-colors">
                        Hide your story
                      </button>
                      <button
                        onClick={handleCopyProfileUrl}
                        className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-white text-xs sm:text-sm hover:bg-white/5 transition-colors"
                      >
                        Copy profile URL
                      </button>
                      <button
                        onClick={handleShareProfile}
                        className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-white text-xs sm:text-sm hover:bg-white/5 transition-colors"
                      >
                        Share this profile
                      </button>
                      <button className="w-full text-left px-4 sm:px-6 py-2 sm:py-3 text-white text-xs sm:text-sm hover:bg-white/5 transition-colors">
                        QR code
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Profile Info Section - Centered */}
            <div className="flex flex-col items-center w-full px-4 md:px-10 mb-8">
              <div className="flex flex-col items-center gap-2 mb-8 w-full max-w-lg">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-[82px] h-[82px] sm:w-[100px] sm:h-[100px] md:w-[110px] md:h-[110px] rounded-full overflow-hidden border-[3px] border-[#1C1C1E] relative transition-all duration-300 shadow-xl">
                    {user.profile_picture ? (
                      <Image
                        src={user.profile_picture}
                        alt={user.name || "User"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] flex items-center justify-center">
                        <span className="text-3xl sm:text-4xl font-bold text-white">
                          {user.name?.charAt(0)?.toUpperCase() ||
                            user.username?.charAt(0)?.toUpperCase() ||
                            "U"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name & Handle */}
                <div className="flex flex-col items-center text-center gap-1">
                  <div className="flex items-center justify-center gap-1">
                    <h1
                      className={`${isMobile ? "text-xl" : "text-2xl"} font-semibold text-white tracking-tight`}
                    >
                      {user.name || user.username || "User"}
                    </h1>
                  </div>
                  <p className="text-[#B5B5B5] text-sm font-medium">
                    @
                    {user.username ||
                      user.name?.toLowerCase().replace(/\s+/g, "")}
                  </p>
                </div>

                {/* Bio */}
                <div className="text-sm text-gray-400 text-center leading-relaxed px-4 whitespace-pre-line">
                  <p>{user.bio || "No bio yet"}</p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12 mb-8 w-full">
                <div className="text-center">
                  <div className="text-[18px] md:text-[20px] font-semibold text-white/90 leading-none">
                    {user.posts_count || 0}
                  </div>
                  <div className="text-[11px] md:text-sm text-white/50 mt-0.5 font-medium">
                    Posts
                  </div>
                </div>

                <div className="h-10 w-[0.5px] bg-white/10"></div>

                <button
                  className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowFollowersModal(true)}
                >
                  <div className="text-[18px] md:text-[20px] font-semibold text-white/90 leading-none">
                    {formatNumber(stats.followers)}
                  </div>
                  <div className="text-[11px] md:text-sm text-white/50 mt-0.5 font-medium">
                    Followers
                  </div>
                </button>

                <div className="h-10 w-[0.5px] bg-white/10"></div>

                <button
                  className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowFollowingModal(true)}
                >
                  <div className="text-[18px] md:text-[20px] font-semibold text-white/90 leading-none">
                    {formatNumber(stats.following)}
                  </div>
                  <div className="text-[11px] md:text-sm text-white/50 mt-0.5 font-medium">
                    Following
                  </div>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full max-w-lg px-2">
                <ActionButton
                  label={isFollowingUser ? "Following" : "Follow"}
                  active={isFollowingUser}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  icon={
                    followLoading
                      ? Loader2
                      : isFollowingUser
                        ? UserCheck
                        : UserPlus
                  }
                />
                <ActionButton label="Message" />
                <ActionButton label="Contact" />
              </div>
            </div>

            {/* Highlights Section */}
            <div className="w-full flex justify-center mb-8 md:mb-10 px-0">
              <div className="flex justify-start md:justify-center gap-4 overflow-x-auto pb-4 w-full max-w-4xl scrollbar-hide px-2">
                {HIGHLIGHTS.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer group flex-shrink-0"
                  >
                    <div
                      className="relative overflow-hidden backdrop-blur-[4px] transition-all group-hover:scale-105"
                      style={{
                        width: "70px",
                        height: "100px",
                        borderRadius: "12px",
                        border: "1px solid rgba(255, 255, 255, 0.5)",
                        background: "#3838380D",
                      }}
                    >
                      <img
                        src={item.img}
                        alt={item.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs text-gray-400">{item.label}</span>
                  </div>
                ))}
              </div>
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
          </div>
        </div>
      </main>

      <OtherFollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={resolvedUserId || identifier}
        userName={user?.name ?? undefined}
        onFollowingCountChange={(change) => {
          setStats((prev) => ({
            ...prev,
            following: Math.max(0, prev.following + change),
          }));
        }}
      />
      <OtherFollowingModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        userId={resolvedUserId || identifier}
        userName={user?.name ?? undefined}
        onFollowingCountChange={(change) => {
          setStats((prev) => ({
            ...prev,
            following: Math.max(0, prev.following + change),
          }));
        }}
      />

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
