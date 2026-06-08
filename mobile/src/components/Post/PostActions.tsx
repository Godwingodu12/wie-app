import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
}) => {
  const { width } = useWindowDimensions();
  // Adjust icon size slightly for very small screens
  const iconSize = width < 380 ? 18 : 22;

  return (
    <View className="flex-row items-center mt-2 px-3 gap-x-3">
      <View className="flex-row items-center flex-1 bg-[#1A1A1A] rounded-full py-3 justify-around border border-white/5">

        {/* Like */}
        <TouchableOpacity
          onPress={onLikePress}
          className="flex-row items-center px-2 py-1"
          hitSlop={8}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={iconSize}
            color={isLiked ? "#ef4444" : "white"}
          />
          <Text className="text-white font-normal ml-1.5 text-[12px]">{likes}</Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          onPress={onCommentPress}
          className="flex-row items-center px-2 py-1"
          hitSlop={8}
        >
          <Ionicons name="chatbubble-outline" size={iconSize - 2} color="white" />
          <Text className="text-white font-normal ml-1.5 text-[12px]">{comments}</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          onPress={onSharePress}
          className="flex-row items-center px-2 py-1"
          hitSlop={8}
        >
          <Ionicons name="paper-plane-outline" size={iconSize - 2} color="white" />
          <Text className="text-white font-normal ml-1.5 text-[12px]">{shares}</Text>
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
