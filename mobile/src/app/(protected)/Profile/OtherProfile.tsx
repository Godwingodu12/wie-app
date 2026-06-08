import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import ProfileHeader from '@/components/Profile/ProfileHeader';
import ProfileActions from './ProfileAction';
import HighlightsSection from '@/components/Profile/HIghtlightList';
import { TabSwitcher, TabType } from '@/components/Profile/TabSwitcher';
import { MediaGrid } from '@/components/Profile/MediaGrid';
import ProfileOptionsSheet from '@/components/Profile/ProfileOptionsSheet';
import { followService } from '@/services/followService';
import { mediaService } from '@/services/mediaService';
import { chatService } from '@/services/chatService';
import { wieUserService } from '@/services/wieUserService';
import { useFollowSync } from '@/hooks/useFollowSync';
import { useUser } from '@/context/UserContext';
import { getImageSource } from '@/utils/imageUtils';

const OtherProfile = () => {
  const { user: currentUser, loading: isUserLoading } = useUser();
  const params = useLocalSearchParams();
  const userId = (params.id as string)?.trim();
  
  // Robust isMe detection
  const isMe = userId?.toLowerCase() === currentUser?.id?.toLowerCase();
  
  const fetchIdRef = useRef<string | null>(null);

  const [username, setUsername] = useState((params.username as string) || 'user');
  const [name, setName] = useState((params.name as string) || username);
  const [avatar, setAvatar] = useState((params.avatar as string) || '');
  const [bio, setBio] = useState("User Profile Bio");

  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('Post');
  const [loading, setLoading] = useState(true);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [backendPostCount, setBackendPostCount] = useState(0);
  const [isPrivateAccount, setIsPrivateAccount] = useState(params.isPrivate === 'true');
  const [posts, setPosts] = useState<any[]>([]);
  const [activeStories, setActiveStories] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [hasStory, setHasStory] = useState(false);

  const initialFollowing = params.isFollowing === 'true' || params.isFollowing === true;
  const initialRequested = params.isRequested === 'true' || params.isRequested === true;

  const { isFollowing, isRequested, toggleFollow, isLoading: isFollowLoading, setFollowState } = useFollowSync(
    userId || '',
    initialFollowing,
    initialRequested
  );

  const prevIsFollowingRef = useRef(isFollowing);

  useEffect(() => {
    if (isFollowing !== prevIsFollowingRef.current) {
      if (isFollowing) {
        setFollowersCount(prev => prev + 1);
      } else if (prevIsFollowingRef.current) {
        setFollowersCount(prev => (prev > 0 ? prev - 1 : 0));
      }
      prevIsFollowingRef.current = isFollowing;
    }
  }, [isFollowing]);

  useEffect(() => {
    if (!userId || isUserLoading) return;

    const fetchData = async () => {
      const currentFetchId = userId;
      fetchIdRef.current = currentFetchId;

      setPosts([]);
      setHighlights([]);
      setBackendPostCount(0);
      setLoading(true);
      setHasStory(false);

      try {
        const userProfile = await wieUserService.getUserById(userId);
        if (fetchIdRef.current !== currentFetchId) return;

        if (userProfile) {
          setUsername(userProfile.username);
          setName(userProfile.name);
          setAvatar(userProfile.profile_picture);
          setBio(userProfile.bio || "User Profile Bio");
          setFollowersCount(userProfile.followers_count || 0);
          setFollowingCount(userProfile.following_count || 0);
          setBackendPostCount(userProfile.posts_count || 0);
          if (userProfile.accountPrivacy !== undefined) {
            setIsPrivateAccount(userProfile.accountPrivacy === 'private');
          }
        }

        if (!isMe) {
          const statusData = await followService.checkFollowStatus(userId);
          if (fetchIdRef.current !== currentFetchId) return;
          if (statusData) {
            setFollowState(
              statusData.isFollowing || statusData.status === 'active' || statusData.status === 'following',
              statusData.isPending || statusData.status === 'pending'
            );
          }
        }

        console.log(`[OtherProfile] Fetching fluxes for userId: ${userId}`);
        const [postsResponse, userDiaries] = await Promise.all([
          mediaService.getUserPosts(userId).catch(err => {
            console.error(`[OtherProfile] getUserPosts ERROR:`, err);
            return { data: [], pagination: { total: 0 } };
          }),
          mediaService.getUserDiaries(userId).catch(err => {
            console.error(`[OtherProfile] getUserDiaries ERROR:`, err);
            return [];
          })
        ]);

        if (fetchIdRef.current !== currentFetchId) return;

        const fluxes = postsResponse?.data || [];
        const serverTotal = postsResponse?.pagination?.total ?? 0;
        console.log(`[OtherProfile] Received ${fluxes.length} fluxes for grid, total: ${serverTotal}`);

        const mappedPosts = fluxes
          .filter((f: any) => {
            const isStory = f.isStory === true;
            return !isStory && !f.isDeleted;
          })
          .map((f: any) => {
            const hasMultipleMedia = f.mediaItems && f.mediaItems.length > 1;
            const isVideo = f.mediaType === 'video' || (f.mediaItems && f.mediaItems[0]?.mediaType === 'video');
            const mediaUrl = f.mediaUrl || (f.mediaItems && f.mediaItems[0]?.url);

            return {
              id: f._id || f.id,
              type: isVideo ? 'reel' : (hasMultipleMedia ? 'album' : 'post'),
              image: f.thumbnailUrl || mediaUrl,
              source: getImageSource(mediaUrl),
              stats: (f.viewCount || 0).toString(),
              mediaItems: f.mediaItems || []
            };
          });

        console.log(`[OtherProfile] Setting ${mappedPosts.length} posts to grid`);
        setPosts(mappedPosts);

        // Sync header count with total from server
        setBackendPostCount(serverTotal);
        
        // Check for ACTIVE stories (for the profile picture ring)
        const currentStories = fluxes
          .filter((f: any) => {
            const isStory = f.isStory === true;
            const isExpired = f.isExpired === true;
            return isStory && !isExpired && !f.isDeleted;
          })
          .map((f: any) => ({
            id: f._id,
            userId: f.userId,
            type: 'story',
            mediaUrl: f.mediaUrl,
            mediaType: f.mediaType || 'image',
            createdAt: f.createdAt,
            user: {
              id: userId,
              username: userProfile?.username || username,
              profile_picture: userProfile?.profile_picture || avatar
            }
          }));

        setActiveStories(currentStories);
        if (currentStories.length > 0) {
          setHasStory(true);
        }

        if (userDiaries && Array.isArray(userDiaries)) {
          const mappedHighlights = userDiaries.map((d: any) => ({
            id: d._id,
            image: d.coverImage || (d.fluxes?.[0]?.mediaUrl),
            title: d.name || 'Highlight'
          }));
          setHighlights(mappedHighlights);
        }
      } catch (error) {
        console.error("Failed to fetch other profile data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, isMe, isUserLoading]);

  const handleBlock = () => {
    Alert.alert("Block", `Are you sure you want to block @${username}?`);
  };

  const handleFollowToggle = async () => {
    if (isFollowLoading || isMe) return;
    await toggleFollow();
  };

  const handleDeletePost = async (id: string) => {
    try {
      await mediaService.deletePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (error: any) {
      console.error("Failed to delete post", error);
    }
  };

  const handleMessagePress = async () => {
    if (isMe) return;
    try {
      const chatData = await chatService.createOrGetChat(userId);
      router.push({
        pathname: '/Message/ChatDetailsScreen',
        params: {
          id: chatData.chat?._id || chatData._id,
          name: username,
          avatar: avatar,
        }
      });
    } catch (error) {
      console.error("Failed to start chat", error);
    }
  };

  const hasAnyContent = posts.length > 0;
  const availableTabs: TabType[] = [];
  if (hasAnyContent) {
    availableTabs.push('Post');
    if (posts.some(item => item.type === 'reel')) availableTabs.push('Reels');
  }

  const getFilteredData = () => {
    switch (activeTab) {
      case 'Reels': return posts.filter(item => item.type === 'reel');
      default: return posts;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className='flex-1 bg-black justify-center items-center'>
        <ActivityIndicator color="white" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-black'>
      <View className='flex-row justify-between px-3 items-center py-4'>
        <View className='flex-row gap-3 items-center'>
          <TouchableOpacity onPress={() => router.back()} className='w-10 h-10 bg-[#1C2024] rounded-full items-center justify-center'>
            <Ionicons name='arrow-back' size={24} color="white" />
          </TouchableOpacity>
          <Text className='text-white font-rubik-bold text-lg'>@{username}</Text>
        </View>
        <TouchableOpacity onPress={() => setIsOptionsVisible(true)} className='w-10 h-10 bg-[#1C2024] rounded-full items-center justify-center'>
          <Ionicons name='options' size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader
          userId={userId}
          name={name}
          username={username}
          profilePic={avatar}
          followers={followersCount}
          posts={Math.max(backendPostCount, posts.length)}
          following={followingCount}
          canViewCounts={true}
          canTapCounts={isMe || !isPrivateAccount || isFollowing}
          showAddBtn={isMe}
          isMe={isMe}
          bio={bio}
          hasStory={hasStory}
          onStoryPress={() => {
            if (hasStory && activeStories.length > 0) {
              router.push({
                pathname: '/Post/StoryViewer',
                params: {
                  userId: userId,
                  username: username,
                  avatar: avatar,
                  stories: JSON.stringify(activeStories),
                  initialIndex: '0'
                }
              });
            }
          }}
        />

        {!isMe && (
          <ProfileActions
            isFollowing={isFollowing}
            isRequested={isRequested}
            canShowMessage={!isPrivateAccount || isFollowing}
            onFollowToggle={handleFollowToggle}
            onMessagePress={handleMessagePress}
          />
        )}

        {(isMe || !isPrivateAccount || isFollowing) ? (
          <View>
            <HighlightsSection 
              data={highlights} 
              showAddButton={isMe} 
              onItemPress={(item) => {
                const index = highlights.findIndex(h => h.id === item.id);
                router.push({
                  pathname: '/Post/StoryViewer',
                  params: {
                    userId: userId,
                    username: username,
                    avatar: avatar,
                    stories: JSON.stringify(highlights),
                    initialIndex: index.toString()
                  }
                });
              }}
            />
            {hasAnyContent ? (
              <>
                <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} availableTabs={availableTabs} />
                <View className="mt-2">
                  <MediaGrid 
                    data={getFilteredData()} 
                    activeTab={activeTab} 
                    isReels={activeTab === 'Reels'} 
                    onItemDelete={isMe ? handleDeletePost : undefined}
                  />
                </View>
              </>
            ) : (
              <NoContentPlaceholder username={username} />
            )}
          </View>
        ) : (
          <PrivateAccountPlaceholder />
        )}
      </ScrollView>

      <ProfileOptionsSheet
        visible={isOptionsVisible}
        onClose={() => setIsOptionsVisible(false)}
        username={username}
        onBlock={handleBlock}
        onCopyProfileURL={() => {}}
        onReport={() => {}}
      />
    </SafeAreaView>
  );
};

const NoContentPlaceholder = ({ username }: { username: string }) => (
  <View className="mt-20 items-center px-10">
    <View className="w-20 h-20 rounded-full border border-zinc-800 items-center justify-center mb-4">
      <Ionicons name="images-outline" size={36} color="#71717a" />
    </View>
    <Text className="text-white font-rubik-bold text-xl">No Posts Yet</Text>
    <Text className="text-gray-500 text-center mt-2 font-rubik">When @{username} shares content, it will appear here.</Text>
  </View>
);

const PrivateAccountPlaceholder = () => (
  <View className="mt-20 items-center px-10">
    <View className="w-20 h-20 rounded-full border border-zinc-800 items-center justify-center mb-4">
      <Ionicons name="lock-closed-outline" size={36} color="white" />
    </View>
    <Text className="text-white font-rubik-bold text-xl">This Account is Private</Text>
    <Text className="text-gray-500 text-center mt-2 font-rubik">Follow this account to see their photos and videos.</Text>
  </View>
);

export default OtherProfile;
