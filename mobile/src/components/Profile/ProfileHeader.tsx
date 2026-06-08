import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import ProfileAvatar from './ProfileAvatar';
import { router } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ProfileHeaderProps {
    userId?: string;
    name: string;
    username: string;
    bio: string;
    followers: number;
    posts: number;
    following: number;
    profilePic?: string | null;
    website?: string | null;
    showAddBtn?: boolean;
    canViewCounts?: boolean;
    canTapCounts?: boolean;
    isMe?: boolean;
    hasStory?: boolean;
    onStoryPress?: () => void;
    onAddStoryPress?: () => void;
}

import Animated, { Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    userId,
    name,
    username,
    bio,
    followers,
    posts,
    following,
    profilePic,
    website,
    showAddBtn,
    canViewCounts = true,
    canTapCounts = true,
    isMe = true,
    hasStory = false,
    onStoryPress,
    onAddStoryPress,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleBio = () => {
        setIsExpanded(!isExpanded);
    };

    const navigateToFollow = (tab: 'Followers' | 'Following') => {
        router.push({
            pathname: '/Profile/FollowFollowing',
            params: {
                initialTab: tab,
                username: username,
                userId: userId,
                isMe: String(isMe)
            }
        });
    };

    return (
        <View className="bg-black px-3 pt-2">
            <View className="flex-row items-center mb-6">

                <ProfileAvatar
                    image={profilePic}
                    showAddButton={isMe && showAddBtn}
                    hasStory={hasStory}
                    onPress={onStoryPress}
                    onAddPress={onAddStoryPress}
                />

                <View className="ml-2 flex-1">
                    <Text className="text-white text-xl font-rubik-bold">{name}</Text>
                    <Text className="text-gray-400 text-md mt-1 font-rubik">@{username}</Text>
                </View>
            </View>

            {bio && bio.trim().length > 0 ? (
                <Animated.View layout={Layout.springify()} className="mb-4">
                    <Text
                        className="text-gray-200 text-sm leading-6 font-rubik"
                        numberOfLines={isExpanded ? undefined : 2}
                    >
                        {bio}
                    </Text>
                    {(bio.split('\n').length > 2 || bio.length > 60) && (
                        <TouchableOpacity onPress={toggleBio} activeOpacity={0.7}>
                            <Text className="text-gray-500 text-sm font-rubik">
                                {isExpanded ? 'show less' : '...more'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            ) : null}

            {website && (
                <TouchableOpacity className="flex-row items-center mb-4">
                    <Ionicons name="link-outline" size={16} color="#3b82f6" />
                    <Text className="text-blue-500 text-sm ml-1 font-rubik" numberOfLines={1}>
                        {website}
                    </Text>
                </TouchableOpacity>
            )}

            <View className="flex-row items-center justify-between">
                <View className='flex-1 items-center'>
                    <TouchableOpacity
                        className='items-center justify-center'
                        activeOpacity={canTapCounts ? 0.8 : 1}
                        disabled={!canTapCounts}
                        onPress={() => navigateToFollow('Followers')}
                    >
                        <Text className='text-2xl font-rubik-bold text-white'>
                            {canViewCounts ? followers : '—'}
                        </Text>
                        <Text className='font-rubik-medium text-sm text-gray-500'>Followers</Text>
                    </TouchableOpacity>
                </View>

                <View className="h-10 w-[1px] bg-gray-700" />

                <View className='flex-1 items-center'>
                    <View className='items-center justify-center'>
                        <Text className='text-2xl font-rubik-bold text-white'>{posts}</Text>
                        <Text className='font-rubik-medium text-sm text-gray-500'>Posts</Text>
                    </View>
                </View>

                <View className="h-10 w-[1px] bg-gray-700" />

                <View className='flex-1 items-center'>
                    <TouchableOpacity
                        className='items-center justify-center'
                        activeOpacity={canTapCounts ? 0.8 : 1}
                        disabled={!canTapCounts}
                        onPress={() => navigateToFollow('Following')}
                    >
                        <Text className='text-2xl font-rubik-bold text-white'>
                            {canViewCounts ? following : '—'}
                        </Text>
                        <Text className='font-rubik-medium text-sm text-gray-500'>Following</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default ProfileHeader;
