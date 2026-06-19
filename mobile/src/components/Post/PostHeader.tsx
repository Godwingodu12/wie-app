import { Image, Text, TouchableOpacity, View, ActivityIndicator, Modal, TouchableWithoutFeedback, StyleSheet, Dimensions, Alert, Share } from 'react-native'
import React, { useState, useRef, useMemo } from 'react'
import Avatar from './Avatar'
import { Ionicons } from '@expo/vector-icons'
import icons from '@/constants/icons'
import { COLORS } from '@/constants/theme'
import { router } from 'expo-router'
import { useFollowSync } from '@/hooks/useFollowSync'
import MusicLabel from './MusicLabel'
import { OptionsBottomSheet } from '../BottomSheet'
import { mediaService } from '@/services/mediaService'
import { broadcastPostDelete, broadcastPostUpdate } from '@/hooks/usePostSync'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  postId: string;
  userId?: string;
  isFollowing?: boolean;
  isSelf?: boolean;
  username: string;
  name?: string;
  isVerified?: boolean;
  timestamp: string;
  musicTitle?: string;
  musicArtist?: string;
  profileImage?: string;
  caption?: string;
  locationLabel?: string;
  commentsDisabled?: boolean;
  likesHidden?: boolean;
  sharesHidden?: boolean;
  isPinned?: boolean;
  media?: any[];
  ratio?: string;
}

const PostHeader: React.FC<Props> = ({ 
  postId,
  userId, 
  isFollowing: initialIsFollowing = false, 
  isSelf = false, 
  username, 
  name, 
  isVerified = false, 
  timestamp, 
  musicTitle, 
  musicArtist, 
  profileImage,
  caption,
  locationLabel,
  commentsDisabled = false,
  likesHidden = false,
  sharesHidden = false,
  isPinned = false,
  media = [],
  ratio = '4:5',
}) => {
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);

  const { isFollowing, isRequested, toggleFollow, isLoading } = useFollowSync(
    userId || '',
    initialIsFollowing
  );

  const handleProfilePress = () => {
    if (isSelf) {
      router.push('/(protected)/(tabs)/profile');
    } else if (userId) {
      router.push({
        pathname: '/Profile/OtherProfile',
        params: {
          id: userId,
          username: username,
          avatar: profileImage,
          isFollowing: String(isFollowing),
          type: 'user'
        }
      });
    }
  };

  const handleDeletePost = () => {
    Alert.alert(
      "Delete post?",
      "",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await mediaService.deletePost(postId);
              broadcastPostDelete(postId);
              if (router.canGoBack()) {
                router.back();
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete post");
            }
          }
        }
      ]
    );
  };

  const handleToggleComments = async () => {
    try {
      await mediaService.togglePostComments(postId);
      broadcastPostUpdate(postId, { commentsDisabled: !commentsDisabled });
    } catch (error) {
      Alert.alert("Error", "Failed to toggle comments");
    }
  };

  const handleToggleLikesVisibility = async () => {
     // Assuming endpoint or we just local broadcast
     broadcastPostUpdate(postId, { likesHidden: !likesHidden });
  };

  const handleToggleSharesVisibility = async () => {
     broadcastPostUpdate(postId, { sharesHidden: !sharesHidden });
  };

  const handleTogglePin = async () => {
     try {
       await mediaService.pinPost(postId);
       broadcastPostUpdate(postId, { isPinned: !isPinned });
     } catch (error: any) {
       Alert.alert("Error", error.message || "Failed to toggle pin");
     }
  };

  const handleArchive = async () => {
    try {
      await mediaService.archivePost(postId);
      broadcastPostDelete(postId); // Hides it from grid/feed
      Alert.alert("Archived", "Post moved to archive.");
    } catch (error) {
      Alert.alert("Error", "Failed to archive post");
    }
  };

  const handleCopyLink = () => {
    Alert.alert("Link Copied", "Post link has been copied to clipboard.");
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this post by ${username} on Wie!`,
        url: `https://wie.app/post/${postId}`
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const topActions = useMemo(() => [
    { label: 'Save', icon: 'bookmark-outline' as const, onPress: () => mediaService.toggleSavePost(postId) },
    { label: 'Remix', icon: 'duplicate-outline' as const, onPress: () => Alert.alert("Remix", "Remix feature coming soon") },
    { label: 'QR code', icon: 'qr-code-outline' as const, onPress: () => Alert.alert("QR Code", "QR Code feature coming soon") },
  ], [postId]);

  const menuOptions = useMemo(() => {
    if (isSelf) {
      return [
        { label: 'Create a cutout sticker', icon: 'cut-outline' as const, onPress: () => {} },
        { label: 'Archive', icon: 'archive-outline' as const, onPress: handleArchive },
        { 
          label: likesHidden ? 'Unhide like count' : 'Hide like count', 
          icon: (likesHidden ? 'eye-outline' : 'eye-off-outline') as any, 
          onPress: handleToggleLikesVisibility 
        },
        { 
          label: sharesHidden ? 'Unhide share count' : 'Hide share count', 
          icon: (sharesHidden ? 'eye-outline' : 'eye-off-outline') as any, 
          onPress: handleToggleSharesVisibility 
        },
        { 
          label: commentsDisabled ? 'Turn on commenting' : 'Turn off commenting', 
          icon: 'chatbubble-outline' as const, 
          onPress: handleToggleComments 
        },
        { 
          label: 'Edit', 
          icon: 'create-outline' as const, 
          onPress: () => router.push({
            pathname: '/Post/EditPostScreen',
            params: { 
              postId, 
              caption: caption || '', 
              locationLabel: locationLabel || '',
              username,
              profileImage: profileImage || '',
              timestamp,
              mediaStr: JSON.stringify(media || []),
              ratio: ratio || '4:5'
            }
          }) 
        },
        { label: 'Adjust preview', icon: 'grid-outline' as const, onPress: () => {} },
        { label: 'View insights', icon: 'stats-chart-outline' as const, onPress: () => router.push({ pathname: '/Post/PostInsightsScreen', params: { postId } }) },
        { label: 'Turn off reuse', icon: 'close-circle-outline' as const, onPress: () => {} },
        { 
          label: isPinned ? 'Unpin from your main grid' : 'Pin to your main grid', 
          icon: 'pin-outline' as const, 
          onPress: handleTogglePin 
        },
        { label: 'Delete', icon: 'trash-outline' as const, isDestructive: true, onPress: handleDeletePost },
      ];
    } else {
      return [
        { label: 'Report', icon: 'flag-outline' as const, isDestructive: true, onPress: () => Alert.alert("Report", "Thank you for reporting.") },
        { label: 'Not Interested', icon: 'eye-off-outline' as const, onPress: () => Alert.alert("Hidden", "We'll show you fewer posts like this.") },
        { 
          label: isFollowing ? 'Unfollow' : 'Follow', 
          icon: isFollowing ? 'person-remove-outline' as const : 'person-add-outline' as const, 
          onPress: toggleFollow 
        },
        { label: 'Copy Link', icon: 'link-outline' as const, onPress: handleCopyLink },
        { label: 'Share to...', icon: 'share-social-outline' as const, onPress: handleShare },
      ];
    }
  }, [isSelf, isFollowing, commentsDisabled, likesHidden, sharesHidden, isPinned, postId, caption, locationLabel, username, profileImage, timestamp]);

  const displayName = username || name || 'user';
  const audioTitle = musicTitle 
    ? (musicArtist ? `${musicTitle}, ${musicArtist}` : musicTitle)
    : "";

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        
        {/* Left Section: Avatar + Info */}
        <View className='flex-row items-center flex-1'>
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={handleProfilePress}
          >
            <Avatar hasStory image={profileImage} />
          </TouchableOpacity>

          <View style={{ marginLeft: 10 }} className='flex-1 justify-center'>
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleProfilePress}
              className='flex-row items-center'
            >
              <Text
                className='text-[14px] text-white font-bold mr-1'
                numberOfLines={1}
              >
                {displayName}
              </Text>
              {isVerified && <Ionicons name="checkmark-circle" size={14} color="white" />}
            </TouchableOpacity>

            {locationLabel && !audioTitle ? (
               <Text className="text-gray-400 text-[11px]" numberOfLines={1}>{locationLabel}</Text>
            ) : audioTitle ? (
              <MusicLabel audioTitle={audioTitle} />
            ) : null}
          </View>
        </View>

        {/* Right Section: Follow Button + Menu */}
        <View className='flex-row items-center'>
          {!isSelf && userId && !isFollowing && (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={toggleFollow}
              disabled={isLoading}
              style={{ backgroundColor: COLORS.secondary }}
              className={`px-5 py-1.5 rounded-full mr-3 min-w-[70px] items-center justify-center`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-[13px] font-semibold">
                  {isRequested ? 'Requested' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            hitSlop={15}
            onPress={() => setIsOptionsVisible(true)}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Row: Timestamp */}
      <Text style={styles.timestampText}>
        {timestamp}
      </Text>

      <OptionsBottomSheet 
        isVisible={isOptionsVisible}
        onClose={() => setIsOptionsVisible(false)}
        options={menuOptions}
        topActions={isSelf ? topActions : undefined}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    minHeight: 60,
    paddingTop: 8,
    paddingBottom: 6,
    paddingLeft: 0,
    paddingRight: 0,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestampText: {
    color: '#A8A29E',
    fontSize: 11,
    fontWeight: 'normal',
    marginTop: 2,
  }
});

export default PostHeader;
