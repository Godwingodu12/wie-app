"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Search, Filter, MessageCircle, MoreVertical, X, UserCheck, UserPlus } from "lucide-react";
import { 
  getFollowers, 
  getFollowing, 
  getFollowRequests,
  getSentFollowRequests,
  followUser, 
  unfollowUser,
  checkFollowStatus,
  cancelFollowRequest
} from "@/services/followService";
import {blockUser,unblockUser} from "@/services/chatService";
import { muteUser}  from "@/services/wieUserService";
import { useTheme } from "@/components/home/ThemeContext";
import CancelIcon from "@/assets/profile/cancelIcon.png";
import { useChat } from '@/context/ChatContext';
import { createOrGetWieChat } from '@/services/chatService';
type TabType = "followers" | "following" | "requests" | "requested";
type FilterType = "default" | "latest" | "earliest";

interface User {
  id: string;
  name: string;
  username: string;
  profile_picture?: string | null;
  bio?: string;
  is_verified: boolean;
  followedAt: string;
  isFollowing?: boolean;
  followRequestStatus?: string;
  isPrivate?: boolean;
}

interface FollowModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  isOwnProfile?: boolean;
  initialTab?: TabType;
  isPrivateAccount?: boolean;
  onCountChange?: (type: 'following' | 'followers', change: number) => void;
}

export default function FollowModal({
  isOpen,
  onClose,
  userId,
  userName,
  isOwnProfile = false,
  initialTab = "followers",
  isPrivateAccount = false,
  onCountChange
}: FollowModalProps) {
  const router = useRouter();
  const { themeStyles, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { loadChatById, chats } = useChat();
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("default");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    type: 'mute' | 'block' | 'unfollow' | 'cancel' | null;
    user: User | null;
  }>({ type: null, user: null });
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [tabCounts, setTabCounts] = useState({
    followers: 0,
    following: 0,
    requests: 0,
    requested: 0
  });

useEffect(() => {
  if (isOpen && userId) {
    fetchAllTabCounts();
    fetchUsers();
  }
}, [isOpen, userId, activeTab]);
  const fetchAllTabCounts = async () => {
    try {
        const counts = {
        followers: 0,
        following: 0,
        requests: 0,
        requested: 0
        };

        // Fetch all counts in parallel
        const [followersData, followingData, requestsData, requestedData] = await Promise.all([
        getFollowers(userId).catch(() => ({ followers: [] })),
        getFollowing(userId).catch(() => ({ following: [] })),
        isPrivateAccount && isOwnProfile ? getFollowRequests().catch(() => ({ requests: [] })) : Promise.resolve({ requests: [] }),
        isPrivateAccount && isOwnProfile ? getSentFollowRequests(userId).catch(() => ({ sentRequests: [] })) : Promise.resolve({ sentRequests: [] })
        ]);

        counts.followers = followersData?.followers?.length || 0;
        counts.following = followingData?.following?.length || 0;
        counts.requests = requestsData?.requests?.length || 0;
        counts.requested = requestedData?.sentRequests?.length || 0;

        setTabCounts(counts);
    } catch (error) {
        console.error('Failed to fetch tab counts:', error);
    }
  };
  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, filterType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setShowActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
const fetchUsers = async () => {
  try {
    setLoading(true);
    let data: any;

    switch (activeTab) {
      case "followers":
        data = await getFollowers(userId);
        const followersWithStatus = await Promise.all(
          (data.followers || []).map(async (user: any) => {
            try {
              const status = await checkFollowStatus(user.userId || user.id);
              return {
                ...user,
                userId: user.userId || user.id,
                isFollowing: status.isFollowing,
                followRequestStatus: status.requestStatus || 'none', 
                isPrivate: user.accountPrivacy || false 
              };
            } catch {
              return {
                ...user,
                userId: user.userId || user.id,
                isFollowing: false,
                followRequestStatus: 'none',
                isPrivate: user.accountPrivacy || false
              };
            }
          })
        );
        setUsers(followersWithStatus);
        // Only update the current tab count
        setTabCounts(prev => ({ ...prev, followers: followersWithStatus.length }));
        break;

      case "following":
        data = await getFollowing(userId);
        const followingWithStatus = (data.following || []).map((user: User) => ({
          ...user,
          isFollowing: true
        }));
        setUsers(followingWithStatus);
        setTabCounts(prev => ({ ...prev, following: followingWithStatus.length }));
        break;

      case "requests":
        data = await getFollowRequests();
        setUsers(data.requests || []);
        setTabCounts(prev => ({ ...prev, requests: (data.requests || []).length }));
        break;

      case "requested":
        data = await getSentFollowRequests(userId);
        setUsers(data.sentRequests || []);
        setTabCounts(prev => ({ ...prev, requested: (data.sentRequests || []).length }));
        break;  
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
    setUsers([]);
  } finally {
    setLoading(false);
  }
};
  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sort filter
    switch (filterType) {
      case "latest":
        filtered.sort((a, b) => new Date(b.followedAt).getTime() - new Date(a.followedAt).getTime());
        break;
      case "earliest":
        filtered.sort((a, b) => new Date(a.followedAt).getTime() - new Date(b.followedAt).getTime());
        break;
      default:
        break;
    }

    setFilteredUsers(filtered);
  };

  const handleAction = async (action: 'mute' | 'block' | 'unfollow' | 'cancel', user: User) => {
    setShowConfirmModal({ type: action, user });
    setShowActionMenu(null);
  };

  const executeAction = async () => {
    if (!showConfirmModal.user || !showConfirmModal.type) return;

    try {
      setActioningId(showConfirmModal.user.id);

      switch (showConfirmModal.type) {
        case 'mute':
          await muteUser(showConfirmModal.user.id);
          break;
        case 'block':
          await blockUser(showConfirmModal.user.id);
          setUsers(prev => prev.filter(u => u.id !== showConfirmModal.user!.id));
          break;
        case 'unfollow':
          await unfollowUser(showConfirmModal.user.id);
          setUsers(prev => prev.filter(u => u.id !== showConfirmModal.user!.id));
          if (onCountChange) onCountChange('following', -1);
          break;
        case 'cancel':
          await cancelFollowRequest(showConfirmModal.user.id);
          setUsers(prev => prev.filter(u => u.id !== showConfirmModal.user!.id));
          break;
      }

      setShowConfirmModal({ type: null, user: null });
    } catch (error) {
      console.error(`Failed to ${showConfirmModal.type}:`, error);
    } finally {
      setActioningId(null);
    }
  };
const handleFollowToggle = async (followerId: string, isCurrentlyFollowing: boolean, currentStatus?: string) => {
  if (!isOwnProfile) return;

  try {
    setActioningId(followerId);

    if (isCurrentlyFollowing) {
      // Unfollow
      await unfollowUser(followerId);
      if (onCountChange) {
        onCountChange('following', -1);
      }
      
      // Update user status
      setUsers(prev =>
        prev.map(u =>
          u.id === followerId 
            ? { ...u, isFollowing: false, followRequestStatus: 'none' } 
            : u
        )
      );
    } else if (currentStatus === 'pending') {
      // Cancel pending request
      await cancelFollowRequest(followerId);
      
      setUsers(prev =>
        prev.map(u =>
          u.id === followerId 
            ? { ...u, isFollowing: false, followRequestStatus: 'none' } 
            : u
        )
      );
    } else {
      // Follow or send request
      const response = await followUser(followerId);
      
      // Check if it's a pending request (private account) or active follow
      const isPending = response?.status === 'pending' || response?.requestStatus === 'pending';
      
      if (!isPending && onCountChange) {
        onCountChange('following', 1);
      }
      
      setUsers(prev =>
        prev.map(u =>
          u.id === followerId 
            ? { 
                ...u, 
                isFollowing: !isPending, 
                followRequestStatus: isPending ? 'pending' : 'active' 
              } 
            : u
        )
      );
    }
  } catch (error) {
    console.error('Failed to toggle follow:', error);
  } finally {
    setActioningId(null);
  }
};
  const handleUserClick = (userId: string) => {
    onClose();
    router.push(`/profile/${userId}`);
  };
const handleMessageClick = async (userId: string) => {
  try {
    // First, check if a chat already exists in context
    const existingChat = chats.find(
      chat => chat.participant?._id === userId
    );

    if (existingChat) {
      // Load existing chat and navigate
      await loadChatById(existingChat._id);
      router.push('/message');
      onClose();
      return;
    }

    // If no existing chat in context, create or get from server
    const response = await createOrGetWieChat(userId);

    if (response.success && response.chat) {
      // Load the chat (whether existing or new)
      await loadChatById(response.chat._id);
      router.push('/message');
      onClose();
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
    const getTabCount = (tab: TabType) => {
    return tabCounts[tab];
    };

  if (!isOpen) return null;

  const availableTabs: TabType[] = isPrivateAccount && isOwnProfile
    ? ["followers", "following", "requests", "requested"]
    : ["followers", "following"];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Main Modal */}
      <div className="fixed top-[75px] left-1/2 -translate-x-1/2 z-50 w-[718px] h-[981px] rounded-[24px] flex flex-col"
        style={{
          background: isDark ? "#0B0D0F" : "#FFFFFF",
          border: "0.3px solid",
          borderImage: "linear-gradient(180deg, #666666 0%, #616060 50%, #393939 100%) 1"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Tabs and Cancel */}
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            {/* Tabs */}
            <div className="flex gap-6">
            {availableTabs.map((tab) => (
                <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative"
                >
                <div className="flex items-center gap-1">
                    <span
                    className={`text-sm font-medium capitalize transition-colors ${
                        activeTab === tab ? 'opacity-100' : 'opacity-50'
                    }`}
                    style={{ color: themeStyles.text }}
                    >
                    {tab}
                    </span>
                    <span
                    className={`text-xs ${
                        activeTab === tab ? 'opacity-100' : 'opacity-50'
                    }`}
                    style={{ color: themeStyles.textSecondary }}
                    >
                    {getTabCount(tab)}
                    </span>
                </div>
                {activeTab === tab && (
                    <div
                    className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#8860D9]"
                    />
                )}
                </button>
            ))}
            </div>
            {/* Cancel Button */}
            <button
              onClick={onClose}
              className="w-[42px] h-[42px] flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
            >
              <Image src={CancelIcon} alt="Close" width={24} height={24} />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="relative flex items-center gap-2">
            <div
              className="flex-1 flex items-center gap-2 rounded-[12px] px-[14px] py-[13px]"
              style={{ background: themeStyles.pillBg }}
            >
              <Search className="w-4 h-4" style={{ color: themeStyles.textSecondary }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: themeStyles.text }}
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="w-[42px] h-[42px] flex items-center justify-center rounded-[12px] hover:bg-white/5 transition-colors"
              style={{ background: themeStyles.pillBg }}
            >
              <Filter className="w-4 h-4" style={{ color: themeStyles.text }} />
            </button>

            {/* Filter Menu */}
            {showFilterMenu && (
              <div
                ref={filterMenuRef}
                className="absolute top-[50px] right-0 w-[255px] rounded-[8px] border-[0.5px] p-[18px_10px] z-10"
                style={{
                  background: isDark ? "#1C1C1E" : "#FFFFFF",
                  borderColor: themeStyles.border
                }}
              >
                <div className="space-y-1">
                  {[
                    { label: "Default", value: "default" },
                    { label: "Date followed: Latest", value: "latest" },
                    { label: "Date followed: Earliest", value: "earliest" }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilterType(option.value as FilterType);
                        setShowFilterMenu(false);
                      }}
                      className="w-full flex items-center justify-between py-3 px-2 rounded hover:bg-white/5 transition-colors"
                    >
                      <span className="text-sm" style={{ color: themeStyles.text }}>
                        {option.label}
                      </span>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        filterType === option.value ? 'border-[#8860D9]' : 'border-gray-400'
                      }`}>
                        {filterType === option.value && (
                          <div className="w-2 h-2 rounded-full bg-[#8860D9]" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto px-8">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#8860D9]" />
              <p className="mt-4" style={{ color: themeStyles.text }}>Loading...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: themeStyles.pillBg }}>
                <svg className="w-10 h-10" style={{ color: themeStyles.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: themeStyles.text }}>
                {searchQuery ? 'No results found' : `No ${activeTab} yet`}
              </h3>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between h-[52px]"
                >
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => handleUserClick(user.id)}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {user.profile_picture ? (
                        <Image
                          src={user.profile_picture}
                          alt={user.name || 'User'}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate" style={{ color: themeStyles.text }}>
                        {user.name || user.username || 'User'}
                      </h3>
                      <p className="text-xs truncate" style={{ color: themeStyles.textSecondary }}>
                        @{user.username || 'username'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                {activeTab === "followers" && isOwnProfile && (
                <button
                    onClick={(e) => {
                    e.stopPropagation();
                    handleFollowToggle(user.id, user.isFollowing || false, user.followRequestStatus);
                    }}
                    disabled={actioningId === user.id}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-1.5 ${
                    user.isFollowing
                        ? 'bg-[#2C2C2E] hover:bg-[#3C3C3E] text-white'
                        : user.followRequestStatus === 'pending'
                        ? 'bg-[#3C3C3E] hover:bg-[#4C4C4E] text-white'
                        : 'bg-gradient-to-r from-[#8E74E1] to-[#6E53D1] hover:opacity-90 text-white'
                    }`}
                >
                    {actioningId === user.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                    ) : user.isFollowing ? (
                    <>
                        <UserCheck className="w-3 h-3" />
                        Following
                    </>
                    ) : user.followRequestStatus === 'pending' ? (
                    <>
                        <X className="w-3 h-3" />
                        Requested
                    </>
                    ) : (
                    <>
                        <UserPlus className="w-3 h-3" />
                        Follow
                    </>
                    )}
                </button>
                )}
                {activeTab === "following" && isOwnProfile && (
                <div className="flex items-center gap-2">
                    <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleMessageClick(user.id);
                    }}
                    className="p-2 rounded-full hover:bg-white/5 transition-colors"
                    >
                    <MessageCircle className="w-4 h-4" style={{ color: themeStyles.text }} />
                    </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                          className="p-2 rounded-full hover:bg-white/5 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" style={{ color: themeStyles.text }} />
                        </button>

                        {showActionMenu === user.id && (
                          <div
                            ref={actionMenuRef}
                            className="absolute right-0 top-full mt-1 w-[150px] rounded-lg border p-2 z-10 space-y-1"
                            style={{
                              background: isDark ? "#1C1C1E" : "#FFFFFF",
                              borderColor: themeStyles.border
                            }}
                          >
                            <button
                              onClick={() => handleAction('mute', user)}
                              className="w-full text-left px-3 py-2 rounded hover:bg-white/5 text-sm"
                              style={{ color: themeStyles.text }}
                            >
                              Mute
                            </button>
                            <button
                              onClick={() => handleAction('block', user)}
                              className="w-full text-left px-3 py-2 rounded hover:bg-white/5 text-sm"
                              style={{ color: themeStyles.text }}
                            >
                              Block
                            </button>
                            <button
                              onClick={() => handleAction('unfollow', user)}
                              className="w-full text-left px-3 py-2 rounded hover:bg-white/5 text-sm text-red-500"
                            >
                              Unfollow
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "requested" && isOwnProfile && (
                    <button
                      onClick={() => handleAction('cancel', user)}
                      disabled={actioningId === user.id}
                      className="px-4 py-2 rounded-full text-xs font-medium bg-[#2C2C2E] hover:bg-[#3C3C3E] text-white transition-colors disabled:opacity-50"
                    >
                      {actioningId === user.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        'Cancel'
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal.user && showConfirmModal.type && (
        <>
          <div
            className="fixed inset-0 bg-black/80 z-[60]"
            onClick={() => setShowConfirmModal({ type: null, user: null })}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[400px] rounded-2xl p-6"
            style={{ background: isDark ? "#1C1C1E" : "#FFFFFF" }}
          >
            <div className="flex flex-col items-center text-center">
              {/* User Avatar */}
              <div className="w-16 h-16 rounded-full overflow-hidden mb-3">
                {showConfirmModal.user.profile_picture ? (
                  <Image
                    src={showConfirmModal.user.profile_picture}
                    alt={showConfirmModal.user.name || 'User'}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      {showConfirmModal.user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>

              {/* User Info */}
              <h3 className="font-bold mb-1" style={{ color: themeStyles.text }}>
                {showConfirmModal.user.name}
              </h3>
              <p className="text-sm mb-4" style={{ color: themeStyles.textSecondary }}>
                @{showConfirmModal.user.username}
              </p>

              {/* Confirmation Text */}
              <p className="text-sm mb-6" style={{ color: themeStyles.text }}>
                Are you sure you want to {showConfirmModal.type} @{showConfirmModal.user.username}?
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowConfirmModal({ type: null, user: null })}
                  className="flex-1 py-2 rounded-full font-medium text-sm transition-colors"
                  style={{ background: themeStyles.pillBg, color: themeStyles.text }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeAction}
                  disabled={!!actioningId}
                  className="flex-1 py-2 rounded-full font-medium text-sm bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                >
                  {actioningId ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    `${showConfirmModal.type.charAt(0).toUpperCase() + showConfirmModal.type.slice(1)}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}