import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import BlueGrdBtn from '../BlueGrdBtn';
import { useFollowSync } from '@/hooks/useFollowSync';

export const UserListItem = ({ id, name, username, avatar, isFollowing: initialFollowing, isPrivate, isRequested: initialRequested = false, type, followsMe }: any) => {
  const { isFollowing, isRequested, toggleFollow, isLoading } = useFollowSync(
    id,
    Boolean(initialFollowing),
    Boolean(initialRequested)
  );
  
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const scale = (size: number) => (width / 375) * size;
  const avatarSize = isTablet ? 64 : Math.min(scale(56), 64);

  // Define fixed button dimensions for consistency
  const BUTTON_WIDTH = isTablet ? 120 : 100;
  const BUTTON_HEIGHT = isTablet ? 40 : 34;

  const handleFollowPress = async () => {
    await toggleFollow();
  };

  const getButtonTitle = () => {
    if (isRequested) return 'Requested';
    if (isFollowing) return 'Following';
    if (followsMe && !isFollowing) return 'Follow Back';
    if (type === 'followers' || type === 'received') return 'Follow Back';
    return 'Follow';
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => router.push({
        pathname: '/Profile/OtherProfile',
        params: { 
          id: String(id), 
          name, 
          username, 
          avatar, 
          isFollowing: String(isFollowing),
          isRequested: String(isRequested),
          isPrivate: String(isPrivate),
          type 
        }
      })}
    >
      <View className="flex-row items-center justify-between px-4 py-3 w-full">
        <View className="flex-row items-center flex-1 mr-3">
          <Image 
            source={{ uri: avatar }} 
            style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
            className="bg-zinc-900" 
          />
          
          <View className="ml-3 flex-1">
            <Text 
                numberOfLines={1} 
                className="text-white font-rubik-semibold text-base"
                style={{ fontSize: isTablet ? 16 : 16 }}
            >
                {name}
            </Text>
            <Text 
                numberOfLines={1} 
                className="text-gray-400 font-rubik text-sm"
                style={{ fontSize: isTablet ? 13 : 13 }}
            >
                @{username}
            </Text>
          </View>
        </View>

        {/* Action Button Section with Fixed Width */}
        <View style={{ width: BUTTON_WIDTH }}>
          {!(isFollowing || isRequested) ? (
            <TouchableOpacity
                disabled={isLoading}
                onPress={handleFollowPress}
                className="bg-[#3b82f6] rounded-lg items-center justify-center border border-[#3b82f6]"
                style={{ 
                  height: BUTTON_HEIGHT, 
                  width: BUTTON_WIDTH
                }}
            >
              {isLoading ? (
                 <ActivityIndicator size="small" color="white" />
              ) : (
                <Text 
                  numberOfLines={1}
                  className="text-white font-rubik-medium text-center"
                  style={{ fontSize: isTablet ? 13 : 13 }}
                >
                  {getButtonTitle()}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
                disabled={isLoading}
                onPress={handleFollowPress} 
                className="bg-[#1C2024] rounded-lg items-center justify-center border border-zinc-800"
                style={{ 
                  height: BUTTON_HEIGHT, 
                  width: BUTTON_WIDTH // Apply fixed width here
                }}
            >
              {isLoading ? (
                 <ActivityIndicator size="small" color="white" />
              ) : (
                <Text 
                  numberOfLines={1}
                  className="text-white font-rubik-medium text-center"
                  style={{ fontSize: isTablet ? 11 : 11 }} // Slightly smaller font to ensure long text fits
                >
                  {getButtonTitle()}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

