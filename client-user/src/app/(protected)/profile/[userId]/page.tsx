'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, UserPlus, UserCheck, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import SideBar from '@/components/home/SideBar';
import { useSidebar } from '@/context/SidebarContext';
import { getUserById, getSuggestedUsers } from '@/services/wieUserService';
import OtherFollowersModal from "@/components/profile/OtherFollowersModal";
import OtherFollowingModal from "@/components/profile/OtherFollowingModal";
import { followUser, unfollowUser, isFollowing, getFollowStats } from '@/services/followService';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types';
import DefaultAvatar from '@/assets/Home/Ellipse 14.png';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isCollapsed, isMobile } = useSidebar();
  const { user: currentUser } = useAuth();
  
  const userId = params.userId as string;
  const [user, setUser] = useState<User | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [suggestedFollowStatus, setSuggestedFollowStatus] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'feed' | 'tags'>('posts');
  const marginLeft = isMobile ? '0' : (isCollapsed ? '80px' : '281px');
  const isOwnProfile = currentUser?.id === userId;
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  useEffect(() => {
    if (userId) {
      fetchUserData();
      if (!isOwnProfile) {
        fetchSuggestedUsers();
      }
    }
  }, [userId, isOwnProfile]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [userData, followStatus, userStats] = await Promise.all([
        getUserById(userId),
        isOwnProfile ? Promise.resolve(false) : isFollowing(userId),
        getFollowStats(userId),
      ]);

      setUser(userData);
      setIsFollowingUser(followStatus);
      setStats(userStats);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setLoading(false);
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
        })
      );

      const statusMap: Record<string, boolean> = {};
      statusChecks.forEach(({ userId, isFollowing }) => {
        statusMap[userId] = isFollowing;
      });
      setSuggestedFollowStatus(statusMap);
    } catch (error) {
      console.error('Failed to fetch suggested users:', error);
    }
  };
  const handleFollowToggle = async () => {
    if (!user) return;
    try {
      setFollowLoading(true);
      if (isFollowingUser) {
        await unfollowUser(userId);
        setIsFollowingUser(false);
        setStats(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
      } else {
        await followUser(userId);
        setIsFollowingUser(true);
        // ✅ Update stats immediately
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
    } finally {
      setFollowLoading(false);
    }
  };
  const handleSuggestedFollowToggle = async (suggestedUserId: string) => {
    try {
      if (suggestedFollowStatus[suggestedUserId]) {
        await unfollowUser(suggestedUserId);
        setSuggestedFollowStatus(prev => ({ ...prev, [suggestedUserId]: false }));
      } else {
        await followUser(suggestedUserId);
        setSuggestedFollowStatus(prev => ({ ...prev, [suggestedUserId]: true }));
      }
    } catch (error) {
      console.error('Suggested follow toggle error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <SideBar />
        <main style={{ marginLeft }}>
          <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="w-8 h-8 text-[#8860D9] animate-spin" />
          </div>
        </main>
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
                onClick={() => router.back()}
                className="px-6 py-2 bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white rounded-full hover:opacity-90 transition-opacity"
              >
                Go Back
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <SideBar />

      <main
        className={`transition-all duration-300 ease-in-out ${isMobile ? 'pb-24' : ''}`}
        style={{ marginLeft }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Profile Section */}
            <div className="flex-1">
              <div className="bg-[#1a1a1a] border border-[#2D2F39] rounded-xl p-6 sm:p-8 mb-6">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Avatar */}
                  <div className="relative w-32 h-32 rounded-full overflow-hidden bg-[#2a2a2a] flex-shrink-0 mx-auto sm:mx-0">
                    {user.profile_picture ? (
                      <Image
                        src={user.profile_picture}
                        alt={user.name || 'User'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] flex items-center justify-center">
                        <span className="text-5xl font-bold text-white">
                          {user.name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-4 gap-4">
                      <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">
                          {user.name || user.username || 'User'}
                        </h1>
                        {user.is_verified && (
                          <div className="bg-blue-500 rounded-full p-1 w-6 h-6 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-4 h-4 text-white"
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

                      {/* Action Buttons */}
                      {!isOwnProfile && (
                        <button
                          onClick={handleFollowToggle}
                          disabled={followLoading}
                          className={`
                            px-6 sm:px-8 py-2.5 rounded-full font-semibold text-sm transition-all flex items-center gap-2 justify-center
                            ${
                              isFollowingUser
                                ? 'bg-[#2D2F39] text-white hover:bg-[#3a3f4d]'
                                : 'bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white hover:opacity-90'
                            }
                            ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          {followLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isFollowingUser ? (
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
                      )}

                      {isOwnProfile && (
                        <button
                          onClick={() => router.push('/profile')}
                          className="px-6 sm:px-8 py-2.5 rounded-full font-semibold text-sm bg-[#2D2F39] text-white hover:bg-[#3a3f4d] transition-colors"
                        >
                          Edit Profile
                        </button>
                      )}
                    </div>

                    {user.username && (
                      <p className="text-gray-400 mb-4">@{user.username}</p>
                    )}
                    {/* Stats */}
                    <div className="flex items-center justify-center sm:justify-start gap-6 mb-4">
                      <button 
                        className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setShowFollowersModal(true)}
                      >
                        <p className="text-xl sm:text-2xl font-bold text-white">{stats.followers}</p>
                        <p className="text-xs sm:text-sm text-gray-400">Followers</p>
                      </button>
                      <button 
                        className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setShowFollowingModal(true)}
                      >
                        <p className="text-xl sm:text-2xl font-bold text-white">{stats.following}</p>
                        <p className="text-xs sm:text-sm text-gray-400">Following</p>
                      </button>
                    </div>
                    {/* Bio */}
                    {user.bio && (
                      <p className="text-gray-300 mb-4 leading-relaxed">{user.bio}</p>
                    )}

                    {/* Additional Info */}
                    <div className="flex flex-col gap-2 text-sm text-gray-400">
                      {user.location && (
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>{user.location}</span>
                        </div>
                      )}
                      {user.created_at && (
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full">
                <ProfileTabs 
                  userId={userId} 
                  isMobile={isMobile} 
                  isOwnProfile={isOwnProfile}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              </div>
            </div>
            {/* Suggested Users Sidebar - Only show if not own profile */}
            {!isOwnProfile && !isMobile && suggestedUsers.length > 0 && (
              <div className="w-full lg:w-80 flex-shrink-0">
                <div className="bg-[#1a1a1a] border border-[#2D2F39] rounded-xl p-6 sticky top-6">
                  <h3 className="text-lg font-bold text-white mb-4">Suggested for you</h3>
                  <div className="space-y-4">
                    {suggestedUsers.map((suggestedUser) => (
                      <div
                        key={suggestedUser.id}
                        className="flex items-center gap-3 group"
                      >
                        <div
                          className="relative w-12 h-12 rounded-full overflow-hidden bg-[#2a2a2a] flex-shrink-0 cursor-pointer"
                          onClick={() => router.push(`/profile/${suggestedUser.id}`)}
                        >
                          {suggestedUser.profile_picture ? (
                            <Image
                              src={suggestedUser.profile_picture}
                              alt={suggestedUser.name || 'User'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] flex items-center justify-center">
                              <span className="text-lg font-bold text-white">
                                {suggestedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => router.push(`/profile/${suggestedUser.id}`)}
                        >
                          <div className="flex items-center gap-1">
                            <p className="text-white font-semibold text-sm truncate">
                              {suggestedUser.name || suggestedUser.username}
                            </p>
                            {suggestedUser.is_verified && (
                              <div className="bg-blue-500 rounded-full p-[2px] w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-2 h-2 text-white"
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
                          <p className="text-gray-400 text-xs truncate">
                            {suggestedUser.followers_count || 0} followers
                          </p>
                        </div>
                        <button
                          onClick={() => handleSuggestedFollowToggle(suggestedUser.id)}
                          className={`
                            px-4 py-1.5 rounded-full font-semibold text-xs transition-all flex-shrink-0
                            ${
                              suggestedFollowStatus[suggestedUser.id]
                                ? 'bg-[#2D2F39] text-white hover:bg-[#3a3f4d]'
                                : 'bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white hover:opacity-90'
                            }
                          `}
                        >
                          {suggestedFollowStatus[suggestedUser.id] ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* See all link */}
                  <button
                    onClick={() => router.push('/explore')}
                    className="w-full mt-4 text-sm text-[#8860D9] hover:text-[#9575CD] transition-colors text-center font-medium"
                  >
                    See all suggestions
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Suggested Users */}
          {!isOwnProfile && isMobile && suggestedUsers.length > 0 && (
            <div className="mt-6 bg-[#1a1a1a] border border-[#2D2F39] rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Suggested for you</h3>
              <div className="space-y-4">
                {suggestedUsers.slice(0, 3).map((suggestedUser) => (
                  <div
                    key={suggestedUser.id}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="relative w-12 h-12 rounded-full overflow-hidden bg-[#2a2a2a] flex-shrink-0 cursor-pointer"
                      onClick={() => router.push(`/profile/${suggestedUser.id}`)}
                    >
                      {suggestedUser.profile_picture ? (
                        <Image
                          src={suggestedUser.profile_picture}
                          alt={suggestedUser.name || 'User'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {suggestedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => router.push(`/profile/${suggestedUser.id}`)}
                    >
                      <p className="text-white font-semibold text-sm truncate">
                        {suggestedUser.name || suggestedUser.username}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {suggestedUser.followers_count || 0} followers
                      </p>
                    </div>
                    <button
                      onClick={() => handleSuggestedFollowToggle(suggestedUser.id)}
                      className={`
                        px-4 py-1.5 rounded-full font-semibold text-xs transition-all flex-shrink-0
                        ${
                          suggestedFollowStatus[suggestedUser.id]
                            ? 'bg-[#2D2F39] text-white'
                            : 'bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white'
                        }
                      `}
                    >
                      {suggestedFollowStatus[suggestedUser.id] ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push('/explore')}
                className="w-full mt-4 text-sm text-[#8860D9] hover:text-[#9575CD] transition-colors text-center font-medium"
              >
                See all suggestions
              </button>
            </div>
          )}
        </div>
      </main>
    <OtherFollowersModal
      isOpen={showFollowersModal}
      onClose={() => setShowFollowersModal(false)}
      userId={userId}
      userName={user?.name ?? undefined}
      onFollowingCountChange={(change) => {
        setStats(prev => ({ ...prev, following: Math.max(0, prev.following + change) }));
      }}
    />
    <OtherFollowingModal
      isOpen={showFollowingModal}
      onClose={() => setShowFollowingModal(false)}
      userId={userId}
      userName={user?.name ?? undefined}
      onFollowingCountChange={(change) => {
        setStats(prev => ({ ...prev, following: Math.max(0, prev.following + change) }));
      }}
    />
    </div>
  );
}
