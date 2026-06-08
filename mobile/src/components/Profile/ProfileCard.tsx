import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFollowSync } from '@/hooks/useFollowSync';
import { getImageSource } from '@/utils/imageUtils';

interface ProfileCardProps {
  id: string;
  name: string;
  username: string;
  avatar: string;
  followers: string;
  following: string;
  mutualAvatars: string[];
  isNew?: boolean;
  onDismiss?: (id: string) => void;
  onFollow?: (id: string) => void;
  isFollowing?: boolean;
  isRequested?: boolean;
}

const ProfileCard = ({ 
  id, 
  name, 
  username, 
  avatar, 
  followers, 
  following, 
  mutualAvatars, 
  isNew, 
  onDismiss, 
  onFollow,
  isFollowing: initialIsFollowing = false,
  isRequested: initialIsRequested = false
}: ProfileCardProps) => {
  const { isFollowing, isRequested, toggleFollow, isLoading } = useFollowSync(id, initialIsFollowing, initialIsRequested);
  const [imageError, setImageError] = useState(false);

  const handlePress = () => {
    router.push({
      pathname: '/Profile/OtherProfile',
      params: { 
        id, 
        name, 
        username, 
        avatar, 
        isFollowing: String(isFollowing),
        type: 'user' 
      }
    });
  };

  const handleFollow = async () => {
    const prevFollowing = isFollowing;
    await toggleFollow();
    // If we just followed (transitioned from not following to following/requested)
    if (!prevFollowing) {
        setTimeout(() => {
            onFollow?.(id);
        }, 300);
    }
  };

  // Use specialized UI avatar as fallback for suggested profiles
  const uiAvatarFallback = { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || username || 'User')}&background=8b5cf6&color=fff&size=150` };
  const avatarSource = imageError ? uiAvatarFallback : getImageSource(avatar, uiAvatarFallback);

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={handlePress}
      className="w-56 bg-[#1A1A1A] rounded-[24px] p-4 items-center shadow-2xl"
    >
      <View className="relative mb-2">
        <Image 
          source={avatarSource} 
          style={{ width: 80, height: 80, borderRadius: 40 }}
          className="bg-neutral-800"
          contentFit="cover"
          transition={200}
          onError={() => setImageError(true)}
        />
        {isNew && (
          <View className="absolute -bottom-1 self-center bg-primary px-3 py-0.5 rounded-full border-2 border-[#121417]">
            <Text className="text-white text-[10px] font-rubik-bold">New</Text>
          </View>
        )}
      </View>

      <View className="items-center">
        <Text className="text-white text-base font-rubik-bold mt-1 text-center" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-gray-500 text-xs mb-2 font-rubik">@{username}</Text>
      </View>

      <View className="flex-row justify-between w-full mb-3 px-4">
        <View className="items-center">
          <Text className="text-white text-sm font-rubik-bold">{followers}</Text>
          <Text className="text-gray-500 text-[9px] font-rubik">followers</Text>
        </View>
        <View className="items-center">
          <Text className="text-white text-sm font-rubik-bold">{following}</Text>
          <Text className="text-gray-500 text-[9px] font-rubik">following</Text>
        </View>
      </View>

      {mutualAvatars && mutualAvatars.length > 0 && (
        <View className="flex-row items-center mb-4">
          {mutualAvatars.map((url, index) => (
            <View 
              key={index} 
              className="w-5 h-5 rounded-full border border-[#121417] -ml-1.5 overflow-hidden" 
              style={{ zIndex: 5 - index }}
            >
              <Image source={getImageSource(url)} style={{ width: '100%', height: '100%' }} />
            </View>
          ))}
        </View>
      )}

      <View className="flex-row items-center gap-x-4 mt-2">
        <TouchableOpacity 
          onPress={() => onDismiss && onDismiss(id)}
          className="bg-[#2A2D35] w-10 h-10 rounded-full items-center justify-center"
        >
          <Ionicons name="close" size={18} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleFollow}
          disabled={isFollowing || isLoading}
          className={`${isFollowing ? 'bg-zinc-800' : 'bg-primary'} w-10 h-10 rounded-full items-center justify-center shadow-lg shadow-indigo-500/50`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name={isFollowing ? "checkmark" : (isRequested ? "time" : "person-add")} size={16} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default ProfileCard;
