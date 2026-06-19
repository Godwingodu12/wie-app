import { useState, useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';

export const POST_UPDATE_EVENT = 'POST_UPDATE_EVENT';
export const POST_DELETE_EVENT = 'POST_DELETE_EVENT';

export const broadcastPostUpdate = (postId: string, updates: { 
  caption?: string; 
  locationLabel?: string; 
  commentsDisabled?: boolean;
  likesHidden?: boolean;
  sharesHidden?: boolean;
  isPinned?: boolean;
  media?: any[];
}) => {
  DeviceEventEmitter.emit(POST_UPDATE_EVENT, { postId, ...updates });
};

export const broadcastPostDelete = (postId: string) => {
  DeviceEventEmitter.emit(POST_DELETE_EVENT, { postId });
};

export const usePostSync = (
  postId: string,
  initialCaption: string,
  initialLocation?: string,
  initialCommentsDisabled: boolean = false,
  initialLikesHidden: boolean = false,
  initialSharesHidden: boolean = false,
  initialIsPinned: boolean = false,
  initialMedia: any[] = []
) => {
  const [caption, setCaption] = useState(initialCaption);
  const [location, setLocation] = useState(initialLocation);
  const [commentsDisabled, setCommentsDisabled] = useState(initialCommentsDisabled);
  const [likesHidden, setLikesHidden] = useState(initialLikesHidden);
  const [sharesHidden, setSharesHidden] = useState(initialSharesHidden);
  const [isPinned, setIsPinned] = useState(initialIsPinned);
  const [media, setMedia] = useState(initialMedia);
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    setCaption(initialCaption);
    setLocation(initialLocation);
    setCommentsDisabled(initialCommentsDisabled);
    setLikesHidden(initialLikesHidden);
    setSharesHidden(initialSharesHidden);
    setIsPinned(initialIsPinned);
    setMedia(initialMedia);
  }, [postId, initialCaption, initialLocation, initialCommentsDisabled, initialLikesHidden, initialSharesHidden, initialIsPinned, initialMedia]);

  useEffect(() => {
    const updateSub = DeviceEventEmitter.addListener(POST_UPDATE_EVENT, (data) => {
      if (data.postId === postId) {
        if (data.caption !== undefined) setCaption(data.caption);
        if (data.locationLabel !== undefined) setLocation(data.locationLabel);
        if (data.commentsDisabled !== undefined) setCommentsDisabled(data.commentsDisabled);
        if (data.likesHidden !== undefined) setLikesHidden(data.likesHidden);
        if (data.sharesHidden !== undefined) setSharesHidden(data.sharesHidden);
        if (data.isPinned !== undefined) setIsPinned(data.isPinned);
        if (data.media !== undefined) setMedia(data.media);
      }
    });

    const deleteSub = DeviceEventEmitter.addListener(POST_DELETE_EVENT, (data) => {
      if (data.postId === postId) {
        setIsDeleted(true);
      }
    });

    return () => {
      updateSub.remove();
      deleteSub.remove();
    };
  }, [postId]);

  return {
    caption,
    location,
    commentsDisabled,
    likesHidden,
    sharesHidden,
    isPinned,
    isDeleted,
    media,
    setCaption,
    setLocation,
    setCommentsDisabled,
    setLikesHidden,
    setSharesHidden,
    setIsPinned,
    setMedia
  };
};
