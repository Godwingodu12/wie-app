import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableWithoutFeedback, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLikeSync } from '@/hooks/useLikeSync';
import { reelsState } from '@/store/reelsState';
import ShareSheet from '@/components/Post/ShareSheet';
import CommentSheet from '@/components/Post/CommentSheet';
import GradientHeartIcon from '@/components/UI/GradientHeartIcon';

interface ReelPlayerProps {
  reel: any;
  isActive: boolean;
}

export const ReelPlayer = React.memo(({ reel, isActive }: ReelPlayerProps) => {
  const { width, height } = useWindowDimensions();
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = React.useState(isActive);
  const [showShareSheet, setShowShareSheet] = React.useState(false);
  const [showCommentSheet, setShowCommentSheet] = React.useState(false);
  const insets = useSafeAreaInsets();
  const reelId = String(reel.id || reel._id);

  const { isLiked, likeCount, toggleLike } = useLikeSync(
    reelId,
    Boolean(reel.hasLiked),
    reel.likeCount || reel.likes?.length || 0
  );

  useEffect(() => {
    if (isActive) {
      setIsPlaying(true);
      // Restore playback position if available
      const savedPosition = reelsState.playbackPositions[reelId];
      if (savedPosition) {
        videoRef.current?.setPositionAsync(savedPosition);
      }
      videoRef.current?.playAsync();
    } else {
      setIsPlaying(false);
      videoRef.current?.pauseAsync();
      
      // Save position before suspending
      videoRef.current?.getStatusAsync().then((status) => {
        if (status.isLoaded) {
          reelsState.playbackPositions[reelId] = status.positionMillis;
        }
      });
    }
    
    // Also save on unmount
    return () => {
      videoRef.current?.getStatusAsync().then((status) => {
        if (status.isLoaded) {
          reelsState.playbackPositions[reelId] = status.positionMillis;
        }
      });
    };
  }, [isActive, reelId]);

  const togglePlayPause = () => {
    if (isPlaying) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const url = reel.mediaUrl || reel.url || reel.mediaItems?.[0]?.url;
  const owner = reel.owner || reel.user || {};
  const username = owner.username || reel.username || 'User';
  const avatar = owner.profile_picture || owner.avatar || reel.avatar || 'https://via.placeholder.com/150';

  const reelRatio = reel.ratio || reel.aspectRatio || reel.mediaItems?.[0]?.aspectRatio || reel.media?.[0]?.aspectRatio;
  const isDefaultVertical = !reelRatio || reelRatio === '9:16';

  return (
    <View style={{ width, height, backgroundColor: 'black' }}>
      <TouchableWithoutFeedback onPress={togglePlayPause}>
        <View style={StyleSheet.absoluteFill}>
          <Video
            ref={videoRef}
            source={{ uri: url }}
            style={StyleSheet.absoluteFill}
            resizeMode={isDefaultVertical ? ResizeMode.COVER : ResizeMode.CONTAIN}
            shouldPlay={isActive}
            isLooping
          />
          {!isPlaying && (
            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="play" size={60} color="rgba(255, 255, 255, 0.6)" />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Back Button */}
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} className="p-4 mt-2">
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Overlays (Gradient, User Info, Actions) */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: height / 3 }}
      />
      
      {/* Caption & User Info */}
      <View style={{ position: 'absolute', bottom: insets.bottom + 20, left: 16, right: 80 }}>
        <View className="flex-row items-center mb-3">
          <Image source={{ uri: avatar }} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#3f3f46' }} />
          <Text className="text-white font-bold ml-3 text-base shadow-sm">{username}</Text>
          <TouchableOpacity className="ml-3 px-3 py-1 border border-white rounded-lg">
            <Text className="text-white font-semibold text-xs">Follow</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-white text-sm shadow-sm mb-3" numberOfLines={2}>{reel.caption}</Text>
        <View className="flex-row items-center bg-black/30 self-start px-3 py-1 rounded-full">
          <Ionicons name="musical-note" size={14} color="white" />
          <Text className="text-white text-xs ml-2" numberOfLines={1}>
            {reel.musicTitle || reel.musicArtist ? `${reel.musicTitle || 'Audio'} • ${reel.musicArtist || 'Original'}` : 'Original Audio'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ position: 'absolute', bottom: insets.bottom + 20, right: 8, alignItems: 'center' }}>
        <TouchableOpacity className="mb-6 items-center" onPress={toggleLike}>
          {isLiked ? (
            <GradientHeartIcon size={38} focused={true} />
          ) : (
            <Ionicons name="heart-outline" size={35} color="white" />
          )}
          <Text className="text-white font-semibold text-xs mt-1 shadow-sm">{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity className="mb-6 items-center" onPress={() => setShowCommentSheet(true)}>
          <Ionicons name="chatbubble-outline" size={33} color="white" />
          <Text className="text-white font-semibold text-xs mt-1 shadow-sm">{reel.commentCount || reel.comments?.length || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity className="mb-6 items-center" onPress={() => setShowShareSheet(true)}>
          <Ionicons name="paper-plane-outline" size={33} color="white" />
          <Text className="text-white font-semibold text-xs mt-1 shadow-sm">{reel.shareCount || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity className="mb-6 items-center">
          <Ionicons name={reel.isSaved ? "bookmark" : "bookmark-outline"} size={33} color="white" />
        </TouchableOpacity>
        <TouchableOpacity className="items-center">
          <Ionicons name="ellipsis-horizontal" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* Comment Sheet */}
      <CommentSheet 
        isVisible={showCommentSheet} 
        onClose={() => setShowCommentSheet(false)} 
        postId={reelId}
      />

      {/* Share Sheet */}
      <ShareSheet 
        isVisible={showShareSheet} 
        onClose={() => setShowShareSheet(false)} 
        postId={reelId}
      />
    </View>
  );
});
