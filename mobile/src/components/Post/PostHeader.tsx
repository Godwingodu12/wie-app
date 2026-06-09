import { Image, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import React from 'react'
import Avatar from './Avatar'
import { Ionicons } from '@expo/vector-icons'
import icons from '@/constants/icons'
import { COLORS } from '@/constants/theme'
import { router } from 'expo-router'
import { useFollowSync } from '@/hooks/useFollowSync'

interface Props {
  userId?: string;
  isFollowing?: boolean;
  isSelf?: boolean;
  username: string;
  name?: string;
  isVerified?: boolean;
  timestamp: string;
  musicTitle?: string;
  profileImage?: string;
}

const PostHeader: React.FC<Props> = ({ userId, isFollowing: initialIsFollowing = false, isSelf = false, username, name, isVerified = false, timestamp, musicTitle, profileImage }) => {
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

  const displayName = username || name || 'user';

  return (
    <View className='mt-4'>
      <View className='flex-row items-center justify-between'>

        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={handleProfilePress}
          className='flex-row items-center flex-1'
        >
          <Avatar hasStory image={profileImage} />

          <View className='ml-3 flex-1 justify-center'>
            <View className='flex-row items-center'>
              <Text
                className='text-[12px] text-white font-medium mr-1'
                numberOfLines={1}
              >
                {displayName}
              </Text>
              {isVerified && <Ionicons name="checkmark-circle" size={14} color="#3b82f6" />}
            </View>

            <View className='flex-row items-center mt-0.5'>
              <Ionicons name='musical-note' color={COLORS.black_secondary_text} size={10} />
              <Text
                className='text-black_secondary_text text-[10px] font-light ml-1'
                numberOfLines={1}
              >
                {musicTitle || "Original Audio"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <View className='flex-row items-center'>
          {!isSelf && userId && !isFollowing && (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={toggleFollow}
              disabled={isLoading}
              className={`px-4 py-1.5 rounded-full mr-3 min-w-[70px] items-center justify-center ${
                isRequested ? 'bg-[#1C2024] border border-zinc-800' : 'bg-[#3b82f6]'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-[12px] font-normal">
                  {isRequested ? 'Requested' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity hitSlop={12}>
            <Image source={icons.more} style={{ width: 20, height: 20 }} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>

      <Text className='text-gray-400 text-[12px] font-normal mt-1 ml-[52px]'>
        {timestamp}
      </Text>
    </View>
  )
}

export default PostHeader
