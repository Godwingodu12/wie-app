import { useState, useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { mediaService } from '@/services/mediaService';

export const LIKE_UPDATE_EVENT = 'LIKE_UPDATE_EVENT';

export const broadcastLikeUpdate = (postId: string, isLiked: boolean, likeCount: number) => {
  DeviceEventEmitter.emit(LIKE_UPDATE_EVENT, { postId, isLiked, likeCount });
};

export const useLikeSync = (
  postId: string,
  initialIsLiked: boolean,
  initialLikeCount: number,
  contentType: 'post' | 'flux' = 'post'
) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikeCount(initialLikeCount);
  }, [postId, initialIsLiked, initialLikeCount]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(LIKE_UPDATE_EVENT, (data) => {
      if (data.postId === postId) {
        setIsLiked(data.isLiked);
        setLikeCount(data.likeCount);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [postId]);

  const toggleLike = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;

    // Optimistic Update
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);
    broadcastLikeUpdate(postId, newIsLiked, newLikeCount);

    try {
      if (contentType === 'flux') {
        await mediaService.toggleFluxLike(postId, "❤️");
      } else {
        await mediaService.togglePostLike(postId, "❤️");
      }
    } catch (error) {
      // Revert optimistic update
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
      broadcastLikeUpdate(postId, previousIsLiked, previousLikeCount);
      console.error('Like toggle error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [postId, isLiked, likeCount, isLoading, contentType]);

  return {
    isLiked,
    likeCount,
    isLoading,
    toggleLike
  };
};
