import { useState, useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { followService } from '@/services/followService';

export const FOLLOW_UPDATE_EVENT = 'FOLLOW_UPDATE_EVENT';

export const broadcastFollowUpdate = (userId: string, isFollowing: boolean, isRequested?: boolean, action?: 'follow' | 'unfollow' | 'requested') => {
  DeviceEventEmitter.emit(FOLLOW_UPDATE_EVENT, { userId, isFollowing, isRequested, action });
};

export const useFollowSync = (userId: string, initialIsFollowing: boolean, initialIsRequested: boolean = false) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isRequested, setIsRequested] = useState(initialIsRequested);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
    setIsRequested(initialIsRequested);
  }, [userId, initialIsFollowing, initialIsRequested]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(FOLLOW_UPDATE_EVENT, (data) => {
      if (data.userId === userId) {
        setIsFollowing(data.isFollowing);
        if (data.isRequested !== undefined) {
          setIsRequested(data.isRequested);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [userId]);

  const toggleFollow = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    const previousIsFollowing = isFollowing;
    const previousIsRequested = isRequested;

    try {
      if (isFollowing || isRequested) {
        const action = previousIsFollowing ? 'unfollow' : 'requested';
        // Optimistic update
        setIsFollowing(false);
        setIsRequested(false);
        broadcastFollowUpdate(userId, false, false, action);

        try {
          const res = await followService.unfollowUser(userId);
          if (!res?.success) {
            throw new Error('Failed to unfollow');
          }
        } catch (unfollowErr: any) {
          // If already unfollowed, just accept it
          if (unfollowErr?.code === 'NOT_FOLLOWING') {
             setIsFollowing(false);
             setIsRequested(false);
             broadcastFollowUpdate(userId, false, false, action);
             return;
          }
          throw unfollowErr;
        }
      } else {
        // Optimistic update
        setIsFollowing(true);
        broadcastFollowUpdate(userId, true, false, 'follow');

        try {
          const res = await followService.followUser(userId);
          if (res?.success) {
            if (res.status === 'pending' || res.requestStatus === 'pending') {
              setIsFollowing(false);
              setIsRequested(true);
              broadcastFollowUpdate(userId, false, true, 'requested');
            } else {
              setIsFollowing(true);
              setIsRequested(false);
              broadcastFollowUpdate(userId, true, false, 'follow');
            }
          } else {
            throw new Error('Failed to follow');
          }
        } catch (followErr: any) {
          // SYNC: If backend says already following, update state to true and don't error
          if (followErr?.code === 'ALREADY_FOLLOWING') {
            console.log(`[FollowSync] User ${userId} was already followed, syncing state.`);
            setIsFollowing(true);
            setIsRequested(false);
            broadcastFollowUpdate(userId, true, false, 'follow');
            return;
          }
          // SYNC: If backend says request already sent, update state to requested and don't error
          if (followErr?.code === 'REQUEST_ALREADY_SENT' || followErr?.message === 'Follow request already sent') {
            console.log(`[FollowSync] Follow request was already sent to ${userId}, syncing state.`);
            setIsFollowing(false);
            setIsRequested(true);
            broadcastFollowUpdate(userId, false, true, 'requested');
            return;
          }
          throw followErr;
        }
      }
    } catch (error) {
      // Revert optimistic update
      setIsFollowing(previousIsFollowing);
      setIsRequested(previousIsRequested);
      // Revert action by sending the opposite or just syncing state
      broadcastFollowUpdate(userId, previousIsFollowing, previousIsRequested);
      console.error('Follow toggle error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isFollowing, isRequested, isLoading]);

  return {
    isFollowing,
    isRequested,
    isLoading,
    toggleFollow,
    setFollowState: (following: boolean, requested: boolean, action?: 'follow' | 'unfollow' | 'requested') => {
      console.log(`[FollowSync] Manual setFollowState for ${userId}: following=${following}, requested=${requested}, action=${action}`);
      setIsFollowing(following);
      setIsRequested(requested);
      broadcastFollowUpdate(userId, following, requested, action);
    },
    setIsFollowing: (val: boolean, action?: 'follow' | 'unfollow' | 'requested') => {
      console.log(`[FollowSync] Manual setIsFollowing for ${userId}: val=${val}, action=${action}`);
      setIsFollowing(val);
      broadcastFollowUpdate(userId, val, isRequested, action);
    }
  };
};

