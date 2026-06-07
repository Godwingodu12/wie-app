"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  X,
  Loader2,
  SlidersHorizontal,
  MoreHorizontal
} from 'lucide-react';
import {
  getFollowers,
  getFollowing,
  getFollowRequests,
  getSentFollowRequests,
  followUser,
  unfollowUser,
  checkFollowStatus,
  cancelFollowRequest,
  acceptFollowRequest,
  getFollowStats
} from "@/services/followService";
import { blockUser } from "@/services/chatService";
import { muteUser } from "@/services/wieUserService";
import { useTheme } from "@/components/home/ThemeContext";
import { useChat } from '@/context/ChatContext';
import { createOrGetWieChat } from '@/services/chatService';
import { rejectFollowRequest } from "@/services/followService";

// --- Types ---

type TabType = 'followers' | 'following' | 'requested' | 'received';
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
  initialTab?: 'followers' | 'following' | 'requests' | 'requested';
  isPrivateAccount?: boolean;
  onCountChange?: (type: 'following' | 'followers', change: number) => void;
}

const Button = ({
  children,
  variant = 'primary',
  className = '',
  onClick,
  disabled = false,
  themeStyles,
  style
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  themeStyles: any;
  style?: React.CSSProperties;
}) => {
  const baseStyles = "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

  // Dynamic styles based on variant
  let variantStyles = {};
  switch (variant) {
    case 'primary':
      variantStyles = {
        background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)',
        color: '#FFFFFF',
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
      };
      break;
    case 'secondary':
      variantStyles = {
        background: themeStyles.pillBg,
        color: themeStyles.text,
        border: `1px solid ${themeStyles.border}`
      };
      break;
    case 'outline':
      variantStyles = {
        border: `1px solid ${themeStyles.border}`,
        color: themeStyles.textSecondary,
        background: 'transparent'
      };
      break;
    case 'ghost':
      variantStyles = {
        color: themeStyles.textSecondary,
        background: 'transparent'
      };
      break;
    case 'danger':
      variantStyles = {
        background: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444'
      };
      break;
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${className} hover:opacity-90`}
      style={{ ...variantStyles, ...style }}
    >
      {children}
    </button>
  );
};

// --- Sub-Components for the Modal ---

const FilterDropdown = ({ isOpen, onClose, onSelect, currentFilter, themeStyles, isDark }: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (filter: FilterType) => void;
  currentFilter: FilterType;
  themeStyles: any;
  isDark: boolean;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-12 right-4 w-64 rounded-xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100"
      style={{
        background: isDark ? '#111418' : themeStyles.cardBg,
        border: `1px solid ${themeStyles.border}`
      }}
    >
      <div className="flex flex-col gap-1">
        {[
          { label: "Default", value: "default" },
          { label: "Date followed: Latest", value: "latest" },
          { label: "Date followed: Earliest", value: "earliest" }
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onSelect(option.value as FilterType);
              onClose();
            }}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              color: currentFilter === option.value ? themeStyles.text : themeStyles.textSecondary,
              background: currentFilter === option.value ? themeStyles.pillBg : 'transparent'
            }}
          >
            <span>{option.label}</span>
            <div
              className="w-3 h-3 rounded-full border flex items-center justify-center"
              style={{
                borderColor: currentFilter === option.value ? themeStyles.text : themeStyles.textSecondary,
                background: currentFilter === option.value ? themeStyles.text : 'transparent'
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

const ActionMenu = ({
  isOpen,
  onClose,
  onAction,
  themeStyles,
  isDark
}: {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: 'mute' | 'block' | 'unfollow') => void;
  themeStyles: any;
  isDark: boolean;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className={`absolute right-0 w-32 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100 ${isDark ? 'top-8' : 'top-8'}`}
      style={{
        background: isDark ? '#1C202433' : themeStyles.cardBg,
        border: isDark ? '0.5px solid' : `1px solid ${themeStyles.border}`,
        borderImageSource: isDark ? 'linear-gradient(270deg, rgba(32, 32, 32, 0.2) -8.43%, rgba(96, 96, 96, 0.2) 100%)' : 'none',
        borderImageSlice: isDark ? 1 : undefined,
        backdropFilter: isDark ? 'blur(80px)' : 'none'
      }}
    >
      <div className="flex flex-col gap-0.5">
        {[
          { label: 'Mute', action: 'mute' },
          { label: 'Block', action: 'block' },
          {
             label: 'Unfollow',
             action: 'unfollow',
             color: '#ef4444',
             style: {
                 background: isDark ? '#222831' : themeStyles.pillBg, // Custom background for Unfollow
                 marginTop: '4px' // Separation
             }
          }
        ].map((item: any) => (
          <button
            key={item.label}
            onClick={(e) => {
              e.stopPropagation();
              onAction(item.action);
              onClose();
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              color: item.color || themeStyles.text,
              ...(item.style || {})
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};


const ConfirmationModal = ({
  user,
  type,
  onConfirm,
  onCancel,
  loading = false,
  themeStyles
}: {
  user: User;
  type: 'mute' | 'block' | 'unfollow' | 'cancel';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  themeStyles: any;
}) => {
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-8 animate-in fade-in duration-200" onClick={onCancel}>
      <div
        className="rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl scale-100"
        onClick={e => e.stopPropagation()}
        style={{
          background: themeStyles.cardBg,
          border: `1px solid ${themeStyles.border}`
        }}
      >
        <div
          className="w-16 h-16 mx-auto rounded-full overflow-hidden mb-4 border-2"
          style={{ borderColor: themeStyles.border }}
        >
          {user.profile_picture ? (
            <Image
              src={user.profile_picture}
              alt={user.name || 'User'}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
        <h3 className="font-bold text-lg mb-1" style={{ color: themeStyles.text }}>{user.name}</h3>
        <p className="text-xs mb-6" style={{ color: themeStyles.textSecondary }}>@{user.username}</p>
        <p className="text-sm mb-6" style={{ color: themeStyles.textSecondary }}>
          Are you sure you want to {type} <span style={{ color: themeStyles.text }}>@{user.username}</span>?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-full text-xs font-semibold hover:opacity-80 disabled:opacity-50"
            style={{
              border: `1px solid ${themeStyles.border}`,
              color: themeStyles.text
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-full text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: type === 'unfollow' || type === 'block' ? '#ef4444' : themeStyles.pillBg,
              color: type === 'unfollow' || type === 'block' ? '#FFFFFF' : themeStyles.text
            }}
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin"/>}
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

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

  // Convert initialTab to our new TabType
  const mapInitialTab = (tab: string): TabType => {
    if (tab === 'requests') return 'received';
    return tab as TabType;
  };

  const [activeTab, setActiveTab] = useState<TabType>(mapInitialTab(initialTab));

  // Update active tab when prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(mapInitialTab(initialTab));
    }
  }, [initialTab, isOpen]);

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { loadChatById, chats } = useChat();
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Interactions State
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("default");

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const [counts, setCounts] = useState({ followers: 0, following: 0, requests: 0, requested: 0 });

  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    type: 'mute' | 'block' | 'unfollow' | 'cancel';
    user: User | null;
  }>({ isOpen: false, type: 'mute', user: null });

  // Load data when modal opens or tab changes
  useEffect(() => {
    if (isOpen && userId) {
      fetchUsers();
      fetchCounts();
    }
  }, [isOpen, userId, activeTab]);

  // Filter users when search query or users list changes
  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, filterType]);

    const fetchCounts = async () => {
        try {
            const stats = await getFollowStats(userId);
            let requestCount = 0;
            let requestedCount = 0;

            if (isOwnProfile) {
                // Fetch request counts if own profile
                try {
                     const incoming = await getFollowRequests();
                     requestCount = incoming.requests?.length || 0;
                     const outgoing = await getSentFollowRequests(userId);
                     requestedCount = outgoing.sentRequests?.length || 0;
                } catch (e) {
                    console.error("Failed to fetch request counts", e);
                }
            }

            setCounts({
                followers: stats.followers,
                following: stats.following,
                requests: requestCount,
                requested: requestedCount
            });
        } catch (error) {
            console.error("Failed to fetch counts", error);
        }
    };

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
                if (isOwnProfile) {
                    const status = await checkFollowStatus(user.userId || user.id);
                    return {
                        ...user,
                        userId: user.userId || user.id,
                        isFollowing: status.isFollowing,
                        followRequestStatus: status.requestStatus || 'none',
                        isPrivate: user.accountPrivacy || false
                    };
                }
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
          break;

        case "following":
          data = await getFollowing(userId);
          const followingWithStatus = await Promise.all((data.following || []).map(async (user: any) => {
             if (isOwnProfile) {
                 return { ...user, isFollowing: true };
             } else {
                 try {
                    const status = await checkFollowStatus(user.userId || user.id);
                    return { ...user, isFollowing: status.isFollowing };
                 } catch {
                    return { ...user, isFollowing: false };
                 }
             }
          }));
          setUsers(followingWithStatus);
          break;

        case "received":
          if (isOwnProfile && isPrivateAccount) {
            data = await getFollowRequests();
            setUsers(data.requests || []);
          } else {
             setUsers([]);
          }
          break;

        case "requested":
          if (isOwnProfile) {
             data = await getSentFollowRequests(userId);
             setUsers(data.sentRequests || []);
          } else {
             setUsers([]);
          }
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

    if (searchQuery.trim()) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (filterType) {
      case "latest":
        filtered.sort((a, b) => new Date(b.followedAt).getTime() - new Date(a.followedAt).getTime());
        break;
      case "earliest":
        filtered.sort((a, b) => new Date(a.followedAt).getTime() - new Date(b.followedAt).getTime());
        break;
    }

    setFilteredUsers(filtered);
  };

  // --- Actions ---

  const performAction = async (action: 'mute' | 'block' | 'unfollow' | 'cancel', user: User) => {
    if (!user) return;

    setActioningId(user.id);
    const targetId = user.id;

    try {
      switch (action) {
        case 'mute':
          await muteUser(targetId);
          break;
        case 'block':
          await blockUser(targetId);
          setUsers(prev => prev.filter(u => u.id !== targetId));
          break;
        case 'unfollow':
          await unfollowUser(targetId);
          // Don't remove from list, update status
          setUsers(prev => prev.map(u => u.id === targetId ? { ...u, isFollowing: false } : u));
          if (onCountChange) onCountChange('following', -1);
          setCounts(prev => ({ ...prev, following: Math.max(0, prev.following - 1) }));
          break;
        case 'cancel':
          await cancelFollowRequest(targetId);
          if (activeTab === 'requested') {
              setUsers(prev => prev.filter(u => u.id !== targetId));
              setCounts(prev => ({ ...prev, requested: Math.max(0, prev.requested - 1) }));
          } else {
             setUsers(prev => prev.map(u => u.id === targetId ? { ...u, followRequestStatus: 'none' } : u));
             setCounts(prev => ({ ...prev, requested: Math.max(0, prev.requested - 1) }));
          }
          break;
      }
      setConfirmationState({ isOpen: false, type: 'mute', user: null });
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    } finally {
      setActioningId(null);
    }
  };

  const handleAction = (action: 'mute' | 'block' | 'unfollow' | 'cancel', user: User) => {
    if (action === 'unfollow' || action === 'cancel') {
      performAction(action, user);
    } else {
      setConfirmationState({ isOpen: true, type: action, user });
    }
  };

  const confirmAction = () => {
    if (confirmationState.user && confirmationState.type) {
        performAction(confirmationState.type, confirmationState.user);
    }
  };

  const handleAcceptRequest = async (requestUserId: string) => {
     try {
        setActioningId(requestUserId);
        await acceptFollowRequest(requestUserId);
        setUsers(prev => prev.filter(u => u.id !== requestUserId));
        setCounts(prev => ({ ...prev, requests: Math.max(0, prev.requests - 1), followers: prev.followers + 1 }));
        if (onCountChange) onCountChange('followers', 1);
     } catch (error) {
        console.error("Accept request error:", error);
     } finally {
        setActioningId(null);
     }
  };

  const handleRejectRequest = async (requestUserId: string) => {
     try {
        setActioningId(requestUserId);
        await rejectFollowRequest(requestUserId);
        setUsers(prev => prev.filter(u => u.id !== requestUserId));
        setCounts(prev => ({ ...prev, requests: Math.max(0, prev.requests - 1) }));
     } catch (error) {
        console.error("Reject request error:", error);
     } finally {
        setActioningId(null);
     }
  };

  const handleFollowToggle = async (followerId: string, isCurrentlyFollowing: boolean, currentStatus?: string) => {
     try {
        setActioningId(followerId);

        if (isCurrentlyFollowing) {
             const user = users.find(u => u.id === followerId);
             if (user) {
                 handleAction('unfollow', user);
             }
             return;
        }

        if (currentStatus === 'pending') {
             const user = users.find(u => u.id === followerId);
             if (user) {
                 handleAction('cancel', user);
             }
             return;
        }

        const response = await followUser(followerId);
        const isPending = response?.status === 'pending' || response?.requestStatus === 'pending';

        if (!isPending && onCountChange) {
            onCountChange('following', 1);
        }
        // Update counts based on whether it's pending or active
        if (!isPending) {
            setCounts(prev => ({ ...prev, following: prev.following + 1 }));
        } else {
            setCounts(prev => ({ ...prev, requested: prev.requested + 1 }));
        }

        setUsers(prev => prev.map(u =>
            u.id === followerId
            ? { ...u, isFollowing: !isPending, followRequestStatus: isPending ? 'pending' : 'active' }
            : u
        ));

     } catch (error) {
        console.error("Follow toggle error:", error);
     } finally {
        setActioningId(null);
     }
  };

  const handleMessageClick = async (targetUserId: string) => {
    try {
        const existingChat = chats.find(chat => chat.participant?._id === targetUserId);
        if (existingChat) {
            await loadChatById(existingChat._id);
            router.push('/message');
            onClose();
            return;
        }
        const response = await createOrGetWieChat(targetUserId);
        if (response.success && response.chat) {
            await loadChatById(response.chat._id);
            router.push('/message');
            onClose();
        }
    } catch (error: any) {
        console.error('Failed to chat:', error);
        alert('Failed to open chat.');
    }
  };

  const handleUserClick = (targetUserId: string) => {
    onClose();
    router.push(`/profile/${targetUserId}`);
  };


  // --- Render ---

  if (!isOpen) return null;

  const visibleTabs: TabType[] = ['followers', 'following'];

  if (isOwnProfile) {
      if (counts.requested > 0) {
          visibleTabs.push('requested');
      }
      if (isPrivateAccount || counts.requests > 0) {
          visibleTabs.push('received');
      }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>

      {/* Modal Container */}
      <div
        className="w-[95%] max-w-[718px] rounded-[24px] shadow-2xl flex flex-col h-[75vh] md:h-[981px] max-h-[85dvh] md:max-h-[90dvh] overflow-hidden relative animate-in zoom-in-95 duration-300 mx-auto"
        onClick={e => e.stopPropagation()}
        style={{
          background: isDark ? '#111418' : themeStyles.cardBg,
          boxShadow: isDark ? 'none' : undefined // Optional: remove shadow in dark mode if no border? User only said remove border. I'll just remove border props.
        }}
      >

        {confirmationState.isOpen && confirmationState.user && (
          <ConfirmationModal
            user={confirmationState.user}
            type={confirmationState.type}
            onCancel={() => setConfirmationState({ ...confirmationState, isOpen: false })}
            onConfirm={confirmAction}
            loading={!!actioningId}
            themeStyles={themeStyles}
          />
        )}

        {/* 1. Modal Header & Tabs */}
        <div className="flex flex-col z-10" style={{ background: isDark ? '#111418' : themeStyles.cardBg }}>
          <div className="flex items-center justify-between p-3 md:p-5 pb-0">
            {/* Tabs Scroll Container */}
            <div className="flex gap-6 md:gap-8 overflow-x-auto no-scrollbar mask-gradient pr-8 scrollbar-hide">
              {visibleTabs.map((tab) => {
                  let count = 0;
                  if (tab === 'followers') count = counts.followers;
                  if (tab === 'following') count = counts.following;
                  if (tab === 'received') count = counts.requests;
                  if (tab === 'requested') count = counts.requested;

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

          {/* 2. Search & Filter Bar */}
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

              {(activeTab === 'followers' || activeTab === 'following') && (
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{
                    color: themeStyles.textSecondary,
                    background: isDark ? '#1C202433' : 'transparent',
                    border: isDark ? '0.5px solid' : 'none',
                    borderImageSource: isDark ? 'linear-gradient(270deg, rgba(32, 32, 32, 0.2) -8.43%, rgba(96, 96, 96, 0.2) 100%)' : 'none',
                    borderImageSlice: isDark ? 1 : undefined
                  }}
                >
                  <SlidersHorizontal size={16} />
                </button>
              )}
            </div>

            <FilterDropdown
                isOpen={showFilter}
                onClose={() => setShowFilter(false)}
                onSelect={setFilterType}
                currentFilter={filterType}
                themeStyles={themeStyles}
                isDark={isDark}
            />
          </div>
        </div>

        {/* 3. Scrollable List Content */}
        <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
            {loading ? (
                <div className="flex flex-col justify-center items-center py-12">
                   <Loader2 className="w-8 h-8 animate-spin text-[#8860D9]" />
                   <p className="mt-4 text-sm" style={{ color: themeStyles.textSecondary }}>Loading...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="py-10 text-center text-sm" style={{ color: themeStyles.textSecondary }}>
                    {searchQuery ? 'No users found.' : `No ${activeTab === "received" ? "requests" : activeTab} yet.`}
                </div>
            ) : (
                <div className="flex flex-col gap-1 pb-4">
                    {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 rounded-xl group transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        >

                            {/* User Info */}
                            <div
                                className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                                onClick={() => handleUserClick(user.id)}
                            >
                                <div
                                  className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                                  style={{ background: themeStyles.pillBg }}
                                >
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
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium truncate" style={{ color: themeStyles.text }}>{user.name || user.username}</span>
                                    <span className="text-xs truncate" style={{ color: themeStyles.textSecondary }}>@{user.username}</span>
                                </div>
                            </div>

                            {/* Contextual Buttons */}
                            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                                {/* RECEIVED (REQUESTS) TAB */}
                                {activeTab === 'received' && isOwnProfile ? (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="primary"
                                            className="w-20 md:w-24 px-0"
                                            onClick={() => handleAcceptRequest(user.id)}
                                            disabled={!!actioningId}
                                            themeStyles={themeStyles}
                                        >
                                            Accept
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="w-20 md:w-24 px-0"
                                            onClick={() => handleRejectRequest(user.id)}
                                            disabled={!!actioningId}
                                            themeStyles={themeStyles}
                                        >
                                            Deny
                                        </Button>
                                    </div>
                                ) : activeTab === 'requested' && isOwnProfile ? (
                                    <Button variant="secondary" className="w-24" onClick={() => handleAction('cancel', user)} themeStyles={themeStyles}>Requested</Button>
                                ) : (
                                    // GENERAL FOLLOW/UNFOLLOW ACTIONS
                                    user.id !== userId && !(activeTab === 'following' && user.isFollowing) && (
                                        user.isFollowing ? (
                                            <Button
                                                variant="outline"
                                                className="w-20 md:w-24 border-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFollowToggle(user.id, true);
                                                }}
                                                disabled={!!actioningId}
                                                themeStyles={themeStyles}
                                                style={{
                                                  background: isDark ? 'linear-gradient(180deg, rgba(179, 184, 226, 0.2) 0%, rgba(136, 96, 217, 0.2) 50%, rgba(149, 117, 205, 0.2) 100%)' : undefined,
                                                  border: isDark ? 'none' : undefined,
                                                  color: isDark ? themeStyles.text : undefined
                                                }}
                                            >
                                                Unfollow
                                            </Button>
                                        ) : user.followRequestStatus === 'pending' ? (
                                            <Button
                                                variant="secondary"
                                                className="w-20 md:w-24 border-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFollowToggle(user.id, false, 'pending');
                                                }}
                                                disabled={!!actioningId}
                                                themeStyles={themeStyles}
                                                style={{
                                                  background: isDark ? 'linear-gradient(180deg, rgba(179, 184, 226, 0.2) 0%, rgba(136, 96, 217, 0.2) 50%, rgba(149, 117, 205, 0.2) 100%)' : undefined,
                                                  border: isDark ? 'none' : undefined,
                                                  color: isDark ? themeStyles.text : undefined
                                                }}
                                            >
                                                Requested
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                className="w-20 md:w-24"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFollowToggle(user.id, false);
                                                }}
                                                disabled={!!actioningId}
                                                themeStyles={themeStyles}
                                            >
                                        Follow
                                    </Button>
                                )
                            )
                        )}
                        {/* FOLLOWING TAB ACTIONS (MESSAGE + 3-DOT MENU) */}
                        {activeTab === 'following' && user.isFollowing && (
                             <div className="flex items-center gap-2">
                                <Button
                                    variant="primary"
                                    className="px-4 h-8 text-xs font-semibold rounded-full"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMessageClick(user.id);
                                    }}
                                    themeStyles={themeStyles}
                                >
                                    Message
                                </Button>
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(activeMenuId === user.id ? null : user.id);
                                        }}
                                        className="p-1.5 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                        style={{ color: themeStyles.textSecondary }}
                                    >
                                        <MoreHorizontal size={16} />
                                    </button>
                                    {/* 3-Dot Menu Dropdown */}
                                    <ActionMenu
                                        isOpen={activeMenuId === user.id}
                                        onClose={() => setActiveMenuId(null)}
                                        onAction={(action) => handleAction(action, user)}
                                        themeStyles={themeStyles}
                                        isDark={isDark}
                                    />
                                </div>
                            </div>
                        )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="h-6" />
        </div>

      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #C5C5C5;
          border-radius: 100px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #A0A0A0;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .mask-gradient {
            mask-image: linear-gradient(to right, black 85%, transparent 100%);
            -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes zoom-in-95 {
             from { transform: scale(0.95); }
             to { transform: scale(1); }
        }
        .animate-in {
            animation-duration: 200ms;
            animation-fill-mode: forwards;
            animation-timing-function: ease-out;
        }
        .fade-in {
            animation-name: fade-in;
        }
        .zoom-in-95 {
            animation-name: zoom-in-95;
        }
      `}</style>
    </div>
  );
}
