"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, X, UserPlus, UserCheck } from "lucide-react";
import { getOtherFollowers, followUser, unfollowUser } from "@/services/followService";
import { useAuth } from "@/hooks/useAuth";

interface Follower {
  id: string;
  name: string;
  username: string;
  profile_picture?: string | null;
  bio?: string;
  is_verified: boolean;
  followedAt: string;
  isFollowing: boolean;
}

interface OtherFollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  onFollowingCountChange?: (change: number) => void;
}

export default function OtherFollowersModal({ 
  isOpen, 
  onClose, 
  userId, 
  userName,
  onFollowingCountChange
}: OtherFollowersModalProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchFollowers();
    }
  }, [isOpen, userId]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const data = await getOtherFollowers(userId);
      setFollowers(data.followers || []);
    } catch (error) {
      console.error('Failed to fetch followers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (followerId: string, isCurrentlyFollowing: boolean) => {
    try {
      setActionLoadingId(followerId);

      if (isCurrentlyFollowing) {
        await unfollowUser(followerId);
        if (onFollowingCountChange) {
          onFollowingCountChange(-1);
        }
      } else {
        await followUser(followerId);
        if (onFollowingCountChange) {
          onFollowingCountChange(1);
        }
      }

      setFollowers(prev =>
        prev.map(u =>
          u.id === followerId ? { ...u, isFollowing: !isCurrentlyFollowing } : u
        )
      );
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUserClick = (userId: string) => {
    onClose();
    router.push(`/profile/${userId}`);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-[#1a1a1a] border border-[#2D2F39] rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-[#2D2F39]">
            <h2 className="text-xl font-bold text-white">
              {userName ? `${userName}'s Followers` : 'Followers'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-col justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#8860D9]" />
                <p className="text-white mt-4">Loading followers...</p>
              </div>
            ) : followers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 rounded-full bg-[#38383833] flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-white text-lg font-bold mb-2">No Followers Yet</h3>
                <p className="text-gray-400 text-sm text-center">
                  This user has no followers yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {followers.map((user) => {
                  const isCurrentUser = currentUser?.id === user.id;
                  
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#252525] hover:bg-[#2a2a2a] transition-colors"
                    >
                      <div
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleUserClick(user.id)}
                      >
                        <div className="relative flex-shrink-0">
                          <div
                            className="p-[2px] rounded-full"
                            style={{
                              background: 'linear-gradient(147.67deg, #2979FF 13.16%, #6B9CF0 54.09%, #9DC1FF 100.03%)'
                            }}
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden border-[2px] border-[#1C1C1E]">
                              {user.profile_picture ? (
                                <Image
                                  src={user.profile_picture}
                                  alt={user.name || 'User'}
                                  width={48}
                                  height={48}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] flex items-center justify-center">
                                  <span className="text-base font-bold text-white">
                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-medium text-sm truncate">
                              {user.name || user.username || 'User'}
                            </h3>
                            {user.is_verified && (
                              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs truncate">@{user.username || 'username'}</p>
                        </div>
                      </div>

                      {!isCurrentUser && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollowToggle(user.id, user.isFollowing);
                          }}
                          disabled={actionLoadingId === user.id}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-1.5 ${
                            user.isFollowing
                              ? 'bg-[#2C2C2E] hover:bg-[#3C3C3E] text-white'
                              : 'bg-[#8860D9] hover:bg-[#7550C9] text-white'
                          }`}
                        >
                          {actionLoadingId === user.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : user.isFollowing ? (
                            <>
                              <UserCheck className="w-3 h-3" />
                              Following
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3" />
                              Follow
                            </>
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
    </>
  );
}