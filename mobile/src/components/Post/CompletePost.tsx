import React, { useState } from "react";
import { View } from "react-native";
import PostActions from "./PostActions";
import PostHeader from "./PostHeader";
import PostMedia from "./PostMedia";
import LikedBy from "./LikedBy";
import ExpandableCaption from "./PostCaption";
import ShareSheet from "./ShareSheet";
import CommentSheet from "./CommentSheet";
import { useLikeSync } from "@/hooks/useLikeSync";
import { usePostSync } from "@/hooks/usePostSync";
import { Text as RNText, TouchableOpacity } from "react-native";
import { router } from "expo-router";

interface PostProps {
  postData: {
    id: string;
    userId?: string;
    isFollowing?: boolean;
    isSelf?: boolean;
    username: string;
    name?: string;
    isVerified?: boolean;
    avatar: string;
    timestamp: string;
    musicTitle: string;
    musicArtist?: string;
    musicPreviewUrl?: string;
    media: { url: string; type: string; aspectRatio?: string }[];
    ratio?: any;
    initialLikes: number;
    hasLiked?: boolean;
    likedBy?: {
      userId: string;
      username: string;
      profile_picture?: string;
    };
    comments: string;
    shares: string;
    caption: string;
    location?: string;
    commentsDisabled?: boolean;
    likesHidden?: boolean;
    isPinned?: boolean;
    type?: string;
  };
  isActive?: boolean;
}

const CompletePost: React.FC<PostProps> = React.memo(({ postData, isActive }) => {
  if (!postData) return null;

  const [saved, setSaved] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showCommentSheet, setShowCommentSheet] = useState(false);
  
  const { isLiked, likeCount, toggleLike } = useLikeSync(
    postData.id,
    Boolean(postData.hasLiked),
    postData.initialLikes
  );

  const { 
    caption, 
    location, 
    commentsDisabled, 
    likesHidden,
    sharesHidden,
    isPinned,
    isDeleted,
    media
  } = usePostSync(
    postData.id,
    postData.caption,
    postData.location,
    postData.commentsDisabled,
    postData.likesHidden,
    postData.sharesHidden,
    postData.isPinned,
    postData.media
  );

  if (isDeleted) return null;

  const handleDoubleTap = async () => {
    if (!isLiked) {
      await toggleLike();
    }
  };

  return (
    <View className="mb-6 bg-black px-[6px]">
      {/* Header Section */}
      <PostHeader
        postId={postData.id}
        userId={postData.userId}
        isFollowing={postData.isFollowing}
        isSelf={postData.isSelf}
        username={postData.username}
        name={postData.name}
        isVerified={postData.isVerified}
        profileImage={postData.avatar}
        timestamp={postData.timestamp}
        musicTitle={postData.musicTitle}
        musicArtist={postData.musicArtist}
        caption={caption}
        locationLabel={location}
        commentsDisabled={commentsDisabled}
        likesHidden={likesHidden}
        sharesHidden={sharesHidden}
        isPinned={isPinned}
        media={media}
        ratio={postData.media?.[0]?.aspectRatio || postData.ratio || "4:5"}
      />

      {/* Media Section */}
      <PostMedia
        items={media || []}
        ratio={media?.[0]?.aspectRatio || postData.ratio}
        onDoubleTap={handleDoubleTap}
        musicPreviewUrl={postData.musicPreviewUrl}
        isActive={isActive}
        isReelPost={postData.type === 'reel'}
      />

      {/* View Insights (Owner Only) */}
      {postData.isSelf && (
        <TouchableOpacity 
          className="mt-2" 
          onPress={() => router.push({ pathname: '/Post/PostInsightsScreen', params: { postId: postData.id } })}
        >
          <RNText className="text-[#3897f0] text-[13px] font-medium">View insights</RNText>
        </TouchableOpacity>
      )}

      {/* Actions Section */}
      <PostActions
        isLiked={isLiked}
        isSaved={saved}
        likes={likeCount.toLocaleString()}
        comments={commentsDisabled ? "0" : postData.comments}
        shares={postData.shares}
        onLikePress={toggleLike}
        onSavePress={() => setSaved(!saved)}
        onSharePress={() => setShowShareSheet(true)}
        onCommentPress={() => !commentsDisabled && setShowCommentSheet(true)}
        likesHidden={likesHidden}
        sharesHidden={sharesHidden}
        commentsDisabled={commentsDisabled}
      />

      {/* Liked By Section */}
      {postData.likedBy && !likesHidden && (
        <LikedBy 
          postId={postData.id}
          likeCount={likeCount}
          likedBy={postData.likedBy}
        />
      )}

      {/* Caption Section */}
      {typeof ExpandableCaption !== 'undefined' ? (
        <ExpandableCaption
          userId={postData.userId}
          username={postData.username}
          isVerified={postData.isVerified}
          caption={caption}
          commentCount={commentsDisabled ? 0 : parseInt(postData.comments)}
          onCommentPress={() => !commentsDisabled && setShowCommentSheet(true)}
        />
      ) : (
        <View className="mt-2">
          <RNText className="text-white text-[13px]">
            <RNText className="font-bold">{postData.username} </RNText>
            {caption}
          </RNText>
        </View>
      )}

      {!commentsDisabled && (
        <CommentSheet 
          isVisible={showCommentSheet} 
          onClose={() => setShowCommentSheet(false)} 
          postId={postData.id}
        />
      )}

      <ShareSheet 
        isVisible={showShareSheet} 
        onClose={() => setShowShareSheet(false)} 
        postId={postData.id}
      />
    </View>
  );
});

export default CompletePost;
