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
    media: { url: string; type: string }[];
    initialLikes: number;
    hasLiked?: boolean;
    comments: string;
    shares: string;
    caption: string;
  };
}

const CompletePost: React.FC<PostProps> = React.memo(({ postData }) => {
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
    <View className="mb-6 bg-black">
      {/* Header Section */}
      <View className="mt-2">
        <View className="px-3 mb-2">
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
          />
        </View>

        {/* Media Section */}
        <PostMedia
          items={postData.media}
          ratio="4:5"
          onDoubleTap={handleDoubleTap}
        />
      </View>

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
