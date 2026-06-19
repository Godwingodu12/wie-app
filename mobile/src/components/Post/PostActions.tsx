import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientHeartIcon from '../UI/GradientHeartIcon';

type PostActionsProps = {
  likes: string | number;
  comments: string | number;
  shares: string | number;
  isLiked: boolean;
  isSaved: boolean;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  onSharePress?: () => void;
  onSavePress?: () => void;
  likesHidden?: boolean;
  sharesHidden?: boolean;
  commentsDisabled?: boolean;
};

const PostActions: React.FC<PostActionsProps> = ({
  likes,
  comments,
  shares,
  isLiked,
  isSaved,
  onLikePress,
  onCommentPress,
  onSharePress,
  onSavePress,
  likesHidden = false,
  sharesHidden = false,
  commentsDisabled = false,
}) => {
  const { width } = useWindowDimensions();
  // Adjust icon size slightly for very small screens
  const iconSize = width < 380 ? 18 : 22;

  return (
    <View className="flex-row items-center mt-1 px-0 gap-x-3">
      <View className="flex-row items-center flex-1 bg-[#1A1A1A] rounded-full py-3 justify-around border border-white/5">

        {/* Like */}
        <TouchableOpacity
          onPress={onLikePress}
          className="flex-row items-center px-2 py-1"
          hitSlop={8}
        >
          {isLiked ? (
            <GradientHeartIcon size={iconSize + 2} focused={true} />
          ) : (
            <Ionicons
              name="heart-outline"
              size={iconSize}
              color="white"
            />
          )}
          {!likesHidden && <Text className="text-white font-normal ml-1.5 text-[12px]">{likes}</Text>}
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          onPress={onCommentPress}
          className="flex-row items-center px-2 py-1"
          hitSlop={8}
          disabled={commentsDisabled}
        >
          <Ionicons name="chatbubble-outline" size={iconSize - 2} color={commentsDisabled ? "#555" : "white"} />
          {!commentsDisabled && <Text className="text-white font-normal ml-1.5 text-[12px]">{comments}</Text>}
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          onPress={onSharePress}
          className="flex-row items-center px-2 py-1"
          hitSlop={8}
        >
          <Ionicons name="paper-plane-outline" size={iconSize - 2} color="white" />
          {!sharesHidden && <Text className="text-white font-normal ml-1.5 text-[12px]">{shares}</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={onSavePress}
        className="bg-[#1A1A1A] w-14 h-14 rounded-full items-center justify-center border border-white/5"
        hitSlop={8}
      >
        <Ionicons
          name={isSaved ? "bookmark" : "bookmark-outline"}
          size={iconSize - 2}
          color="white"
        />
      </TouchableOpacity>
    </View>
  );
};

export default PostActions;
