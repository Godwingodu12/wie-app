import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  X,
  Loader2,
  UserPlus,
  UserCheck
} from 'lucide-react';
import { getOtherFollowers, getOtherFollowing, followUser, unfollowUser, getFollowStats } from "@/services/followService";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/home/ThemeContext";

// --- Types ---

type TabType = 'followers' | 'following';
type FilterType = "default" | "latest" | "earliest";

interface User {
  id: string;
  name: string;
  username: string;
  profile_picture?: string | null;
  bio?: string;
  is_verified: boolean;
  followedAt: string;
  isFollowing: boolean;
}

interface OtherFollowModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  initialTab?: TabType;
  onFollowingCountChange?: (change: number) => void;
}

export default function OtherFollowModal({
  isOpen,
  onClose,
  userId,
  userName,
  initialTab = "followers",
  onFollowingCountChange
}: OtherFollowModalProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { themeStyles, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Update active tab when prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  const [data, setData] = useState<{ followers: User[]; following: User[] }>({
    followers: [],
    following: []
  });
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [hasLoaded, setHasLoaded] = useState<{ followers: boolean; following: boolean }>({
    followers: false,
    following: false
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [counts, setCounts] = useState({ followers: 0, following: 0 });

  // Reset state when modal opens with a new user
  useEffect(() => {
    if (isOpen) {
      // If we're opening for a different user, or standard reset logic if needed.
      // Current implementation trusts parent to unmount or we can check userId change.
      // But typically isOpen toggle implies we might want to refresh or keep cache.
      // For now, let's keep cache if same userId, invalidating in parent is safer but
      // let's assume we want to fetch fresh if it's a "new" open.
      // Actually, standard behavior is to fetch if not loaded.
    }
  }, [isOpen, userId]);

  // Load data when modal opens or tab changes
  useEffect(() => {
    if (isOpen && userId) {
      // Always fetch counts to be up to date
      fetchCounts();

      // Fetch users if not already loaded for this tab
      if (!hasLoaded[activeTab]) {
        fetchUsers();
      }
    }
  }, [isOpen, userId, activeTab]);

  // Filter users when search query or data changes
  useEffect(() => {
    filterUsers();
  }, [data, activeTab, searchQuery]);

    const fetchCounts = async () => {
        try {
            const stats = await getFollowStats(userId);
            setCounts({
                followers: stats.followers,
                following: stats.following
            });
        } catch (error) {
            console.error("Failed to fetch counts", error);
        }
    };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let responseData: any;

      if (activeTab === "followers") {
          responseData = await getOtherFollowers(userId);
          setData(prev => ({ ...prev, followers: responseData.followers || [] }));
          setHasLoaded(prev => ({ ...prev, followers: true }));
      } else {
          responseData = await getOtherFollowing(userId);
          setData(prev => ({ ...prev, following: responseData.following || [] }));
          setHasLoaded(prev => ({ ...prev, following: true }));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    const currentList = data[activeTab] || [];
    let filtered = [...currentList];

    if (searchQuery.trim()) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleFollowToggle = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    try {
      setActionLoadingId(targetUserId);

      if (isCurrentlyFollowing) {
        await unfollowUser(targetUserId);
        if (onFollowingCountChange) {
          onFollowingCountChange(-1);
        }
      } else {
        await followUser(targetUserId);
        if (onFollowingCountChange) {
          onFollowingCountChange(1);
        }
      }

      // Update state in BOTH lists to keep consistency (if user appears in both)
      setData(prev => ({
        followers: prev.followers.map(u =>
          u.id === targetUserId ? { ...u, isFollowing: !isCurrentlyFollowing } : u
        ),
        following: prev.following.map(u =>
          u.id === targetUserId ? { ...u, isFollowing: !isCurrentlyFollowing } : u
        )
      }));

    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUserClick = (targetUserId: string) => {
    onClose();
    router.push(`/profile/${targetUserId}`);
  };

  if (!isOpen) return null;

  const visibleTabs: TabType[] = ['followers', 'following'];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>

      {/* Modal Container */}
      <div
        className="w-[95%] max-w-[718px] rounded-[24px] shadow-2xl flex flex-col h-[75vh] md:h-[981px] max-h-[85dvh] md:max-h-[90dvh] overflow-hidden relative animate-in zoom-in-95 duration-300 mx-auto"
        onClick={e => e.stopPropagation()}
        style={{
          background: isDark ? '#111418' : themeStyles.cardBg,
          boxShadow: isDark ? 'none' : undefined
        }}
      >

        {/* 1. Modal Header & Tabs */}
        <div className="flex flex-col z-10" style={{ background: isDark ? '#111418' : themeStyles.cardBg }}>
          <div className="flex items-center justify-between p-3 md:p-5 pb-0">
            {/* Tabs Scroll Container */}
            <div className="flex gap-6 md:gap-8 overflow-x-auto no-scrollbar mask-gradient pr-8 scrollbar-hide">
              {visibleTabs.map((tab) => {
                  let count = 0;
                  if (tab === 'followers') count = counts.followers;
                  if (tab === 'following') count = counts.following;

                  const label = tab.charAt(0).toUpperCase() + tab.slice(1);

                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-2.5 text-sm md:text-lg font-medium whitespace-nowrap transition-colors relative flex items-center gap-1.5`}
                      style={{
                        color: activeTab === tab ? themeStyles.text : themeStyles.textSecondary
                      }}
                    >
                      {label}
                      <span className="text-xs md:text-base opacity-70">{count}</span>
                      {activeTab === tab && (
                        <div
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[3px] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                          style={{ background: themeStyles.text }}
                        />
                      )}
                    </button>
                  );
              })}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{
                color: themeStyles.textSecondary,
                background: isDark ? '#1C2024B2' : 'transparent'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* 2. Search Bar */}
          <div className="px-3 md:px-5 py-3 md:py-4 relative">
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                size={16}
                style={{ color: themeStyles.textSecondary }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search here"
                className="w-full text-sm pl-11 pr-10 py-3.5 rounded-2xl border border-transparent focus:outline-none transition-all placeholder:text-gray-500"
                style={{
                  background: isDark ? '#3838384D' : themeStyles.pillBg,
                  color: themeStyles.text
                }}
              />
            </div>
          </div>
        </div>

        {/* 3. Users List */}
        <div className="flex-1 overflow-y-auto px-2 md:px-3 pb-4 space-y-1 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 h-full">
              <Loader2 className="w-8 h-8 animate-spin text-[#8860D9]" />
              <p className="text-sm mt-4 opacity-50" style={{ color: themeStyles.text }}>Loading...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 h-full text-center px-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: themeStyles.pillBg }}>
                <Search className="w-6 h-6 opacity-30" style={{ color: themeStyles.text }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: themeStyles.text }}>
                {searchQuery ? 'No results found' : `No ${activeTab} yet`}
              </h3>
              <p className="text-xs max-w-[200px]" style={{ color: themeStyles.textSecondary }}>
                {searchQuery ? "Try searching for someone else" : `When people ${activeTab === 'followers' ? 'follow' : 'are followed by'} this user, they'll appear here.`}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
                {filteredUsers.map((user) => {
                    const isCurrentUser = currentUser?.id === user.id;

                    return (
                        <div
                            key={user.id}
                            className="flex items-center justify-between p-2 rounded-xl group transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                            onClick={() => handleUserClick(user.id)}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Avatar */}
                                <div className="relative">
                                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden border border-black/5 dark:border-white/10">
                                        {user.profile_picture ? (
                                            <Image
                                                src={user.profile_picture}
                                                alt={user.name || 'User'}
                                                width={44}
                                                height={44}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#B3B8E2] to-[#8860D9] flex items-center justify-center">
                                                <span className="text-sm font-bold text-white">
                                                    {user.name?.charAt(0)?.toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Names */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-[13px] md:text-sm truncate" style={{ color: themeStyles.text }}>
                                            {user.username}
                                        </span>
                                        {user.is_verified && (
                                            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center">
                                                <svg viewBox="0 0 24 24" fill="white" className="w-2.5 h-2.5">
                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs truncate opacity-60" style={{ color: themeStyles.text }}>
                                        {user.name}
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            {!isCurrentUser && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFollowToggle(user.id, user.isFollowing);
                                    }}
                                    disabled={actionLoadingId === user.id}
                                    className={`ml-2 md:ml-3 px-3 md:px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center min-w-[75px] md:min-w-[90px] ${
                                        user.isFollowing
                                         ? 'bg-[#2C2C2E] text-white hover:bg-[#3C3C3E]'
                                         : 'bg-[#8860D9] text-white hover:bg-[#7550C9]'
                                    }`}
                                >
                                    {actionLoadingId === user.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : user.isFollowing ? (
                                        'Following'
                                    ) : (
                                        'Follow'
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}