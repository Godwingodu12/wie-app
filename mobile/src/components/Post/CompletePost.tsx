import React, { useState } from "react";
import { View } from "react-native";
import PostActions from "./PostActions";
import ExpandableCaption from "./PostCaption";
import PostHeader from "./PostHeader";
import PostMedia from "./PostMedia";
import ShareSheet from "./ShareSheet";
import CommentSheet from "./CommentSheet";
import { useLikeSync } from "@/hooks/useLikeSync";

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
    comments: string;
    shares: string;
    caption: string;
  };
  isActive?: boolean;
}

const CompletePost: React.FC<PostProps> = React.memo(({ postData, isActive }) => {
  const [saved, setSaved] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showCommentSheet, setShowCommentSheet] = useState(false);
  const { isLiked, likeCount, toggleLike } = useLikeSync(
    postData.id,
    Boolean(postData.hasLiked),
    postData.initialLikes
  );

  const handleDoubleTap = async () => {
    if (!isLiked) {
      await toggleLike();
    }
  };

  return (
    <View className="mb-6 bg-black px-[6px]">
      {/* Header Section */}
      <PostHeader
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
      />

      {/* Media Section */}
      <PostMedia
        items={postData.media}
        ratio={postData.media?.[0]?.aspectRatio || postData.ratio || "4:3"}
        onDoubleTap={handleDoubleTap}
        musicPreviewUrl={postData.musicPreviewUrl}
        isActive={isActive}
      />

      {/* Actions Section */}
      <PostActions
        isLiked={isLiked}
        isSaved={saved}
        likes={likeCount.toLocaleString()}
        comments={postData.comments}
        shares={postData.shares}
        onLikePress={toggleLike}
        onSavePress={() => setSaved(!saved)}
        onSharePress={() => setShowShareSheet(true)}
        onCommentPress={() => setShowCommentSheet(true)}
      />

      {/* Caption Section */}
      <ExpandableCaption
        username={postData.username}
        caption={postData.caption}
      />

      <ShareSheet 
        isVisible={showShareSheet} 
        onClose={() => setShowShareSheet(false)} 
        postId={postData.id}
      />

      <CommentSheet 
        isVisible={showCommentSheet} 
        onClose={() => setShowCommentSheet(false)} 
        postId={postData.id}
      />
    </View>
  );
});
export default CompletePost;
