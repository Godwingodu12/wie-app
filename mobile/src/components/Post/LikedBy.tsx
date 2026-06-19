import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';

interface LikedByProps {
  postId: string;
  likeCount: number;
  likedBy?: {
    userId: string;
    username: string;
    profile_picture?: string;
  };
}

const LikedBy: React.FC<LikedByProps> = ({ postId, likeCount, likedBy }) => {
  if (likeCount === 0) return null;

  const handleUsernamePress = () => {
    if (likedBy?.userId) {
      router.push({
        pathname: '/Profile/OtherProfile',
        params: { id: likedBy.userId, username: likedBy.username }
      });
    }
  };

  const handleOthersPress = () => {
    // Open likes list - this might need a new screen or modal
    console.log('Open likes list for post:', postId);
  };

  return (
    <View className="flex-row items-center mt-2 px-0">
      {likedBy?.profile_picture && (
        <Image 
          source={{ uri: likedBy.profile_picture }} 
          className="w-4 h-4 rounded-full mr-2"
        />
      )}
      <Text className="text-white text-[12px]">
        Liked by{' '}
        <Text 
          className="font-bold" 
          onPress={handleUsernamePress}
        >
          {likedBy?.username || 'someone'}
        </Text>
        {likeCount > 1 && (
          <Text>
            {' '}and{' '}
            <Text 
              className="font-bold" 
              onPress={handleOthersPress}
            >
              {likeCount === 2 ? '1 other' : 'others'}
            </Text>
          </Text>
        )}
      </Text>
    </View>
  );
};

export default LikedBy;
