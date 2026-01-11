'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Loader2, UserPlus, UserCheck } from 'lucide-react';
import SideBar from '@/components/home/SideBar';
import { useSidebar } from '@/context/SidebarContext';
import { useTheme } from '@/components/home/ThemeContext';
import { searchUsers } from '@/services/wieUserService';
import { followUser, unfollowUser, isFollowing } from '@/services/followService';
import { User } from '@/types';
import DefaultAvatar from '@/assets/Home/Ellipse 14.png';

export default function ExplorePage() {
  const { isCollapsed, isMobile } = useSidebar();
  const { themeStyles } = useTheme();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  const marginLeft = isMobile ? '0' : (isCollapsed ? '80px' : '281px');

  useEffect(() => {
    if (searchQuery.trim()) {
      const debounceTimer = setTimeout(() => {
        handleSearch();
      }, 500);

      return () => clearTimeout(debounceTimer);
    } else {
      setUsers([]);
    }
  }, [searchQuery, page]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const result = await searchUsers(searchQuery, page, 20);
      setUsers(result.users);
      setTotalPages(result.totalPages);

      // Check following status for all users
      const statusChecks = await Promise.all(
        result.users.map(async (user: User) => {
          const status = await isFollowing(user.id);
          return { userId: user.id, isFollowing: status };
        })
      );

      const statusMap: Record<string, boolean> = {};
      statusChecks.forEach(({ userId, isFollowing }) => {
        statusMap[userId] = isFollowing;
      });
      setFollowingStatus(statusMap);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId: string) => {
    try {
      setFollowLoading({ ...followLoading, [userId]: true });

      if (followingStatus[userId]) {
        await unfollowUser(userId);
        setFollowingStatus({ ...followingStatus, [userId]: false });
      } else {
        await followUser(userId);
        setFollowingStatus({ ...followingStatus, [userId]: true });
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
    } finally {
      setFollowLoading({ ...followLoading, [userId]: false });
    }
  };

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  return (
    <div className="min-h-screen" style={{ background: themeStyles.background }}>
      <SideBar />

      <main
        className={`transition-all duration-300 ease-in-out ${isMobile ? 'pb-24' : ''}`}
        style={{ marginLeft }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: themeStyles.text }}>Explore</h1>
            <p className="" style={{ color: themeStyles.textSecondary }}>Discover and connect with people</p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name, username, or email..."
                className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8860D9] focus:border-transparent placeholder-gray-500"
                style={{
                  background: themeStyles.cardBg,
                  border: `1px solid ${themeStyles.border}`,
                  color: themeStyles.text
                }}
              />
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-[#8860D9] animate-spin" />
            </div>
          )}

          {/* Results */}
          {!loading && users.length > 0 && (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-xl p-4 transition-colors"
                  style={{
                    background: themeStyles.cardBg,
                    border: `1px solid ${themeStyles.border}`
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeStyles.hoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = themeStyles.cardBg}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => handleUserClick(user.id)}
                    >
                      {/* Avatar */}
                      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-[#2a2a2a] flex-shrink-0">
                        {user.profile_picture ? (
                          <Image
                            src={user.profile_picture}
                            alt={user.name || 'User'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Image
                            src={DefaultAvatar}
                            alt="Default"
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate" style={{ color: themeStyles.text }}>
                            {user.name || user.username || 'User'}
                          </h3>
                          {user.is_verified && (
                            <div className="bg-blue-500 rounded-full p-[2px] w-4 h-4 flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        {user.username && (
                          <p className="text-sm" style={{ color: themeStyles.textSecondary }}>@{user.username}</p>
                        )}
                        {user.bio && (
                          <p className="text-sm mt-1 truncate" style={{ color: themeStyles.textSecondary }}>
                            {user.bio}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: themeStyles.textSecondary }}>
                          <span>{user.followers_count || 0} followers</span>
                          <span>{user.following_count || 0} following</span>
                        </div>
                      </div>
                    </div>

                    {/* Follow Button */}
                    <button
                      onClick={() => handleFollowToggle(user.id)}
                      disabled={followLoading[user.id]}
                      className={`
                        px-6 py-2 rounded-full font-semibold text-sm transition-all flex items-center gap-2 flex-shrink-0
                        ${
                          followingStatus[user.id]
                            ? 'hover:opacity-80'
                            : 'bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white hover:opacity-90'
                        }
                        ${followLoading[user.id] ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      style={followingStatus[user.id] ? {
                        background: themeStyles.pillBg,
                        color: themeStyles.text,
                        border: `1px solid ${themeStyles.border}`
                      } : {}}
                    >
                      {followLoading[user.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : followingStatus[user.id] ? (
                        <>
                          <UserCheck className="w-4 h-4" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Follow
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-colors"
                    style={{
                      background: themeStyles.cardBg,
                      color: themeStyles.text,
                      border: `1px solid ${themeStyles.border}`
                    }}
                  >
                    Previous
                  </button>
                  <span className="text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-colors"
                    style={{
                      background: themeStyles.cardBg,
                      color: themeStyles.text,
                      border: `1px solid ${themeStyles.border}`
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {!loading && searchQuery && users.length === 0 && (
            <div className="text-center py-12">
              <p className="" style={{ color: themeStyles.textSecondary }}>No users found matching "{searchQuery}"</p>
            </div>
          )}
          {/* Empty State */}
          {!loading && !searchQuery && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4" style={{ color: themeStyles.textSecondary }} />
              <p className="" style={{ color: themeStyles.textSecondary }}>Start typing to search for users</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
