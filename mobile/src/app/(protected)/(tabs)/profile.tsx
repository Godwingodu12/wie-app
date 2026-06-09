import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, View, useWindowDimensions, Share, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import ProfileHeader from '@/components/Profile/ProfileHeader';
import ProfileButton from '@/components/Profile/MyprofileBtn'; 
import { TabSwitcher, TabType } from '@/components/Profile/TabSwitcher';
import { MediaGrid } from '@/components/Profile/MediaGrid';
import HighlightsSection from '@/components/Profile/HIghtlightList';
import { router, useFocusEffect } from 'expo-router';
import { useUser } from '@/context/UserContext';
import { followService } from '@/services/followService';
import { mediaService } from '@/services/mediaService';
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '@/context/ToastContext';

const Profile = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('Post');
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [hasStory, setHasStory] = useState(false);
  const [storyMedia, setStoryMedia] = useState<string | null>(null);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const { showToast } = useToast();

  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const contentMaxWidth = isTablet ? 850 : width;
  const headerIconSize = isTablet ? 50 : 42;

  const fetchProfileData = async () => {
    try {
      if (user?.id) {
        // Fetch follow stats
        const followStats = await followService.getFollowStats(user.id);
        if (followStats) {
          setFollowersCount(followStats.followers || user.followers_count || 0);
          setFollowingCount(followStats.following || user.following_count || 0);
        }

        // Fetch user's posts and diaries
        const [postsResponse, userDiaries] = await Promise.all([
          mediaService.getUserPosts(user.id),
          mediaService.getUserDiaries(user.id)
        ]);

        const myFluxes = postsResponse?.data || [];
        const serverTotal = postsResponse?.pagination?.total ?? 0;
        setTotalPosts(serverTotal);

        // Process Diaries for Highlights Section
        if (userDiaries && Array.isArray(userDiaries)) {
          const mappedHighlights = userDiaries.map((d: any) => ({
            id: d._id,
            image: d.coverImage || (d.fluxes?.[0]?.mediaUrl),
            title: d.name || 'Highlight'
          }));
          setStories(mappedHighlights); // Re-using stories state for highlights to match HighlightsSection prop
        } else {
          setStories([]);
        }

        if (myFluxes && myFluxes.length > 0) {
          const mappedPosts = myFluxes
            .filter((f: any) => {
              const isStory = f.isStory === true;
              return !isStory && !f.isDeleted;
            })
            .map((f: any) => {
              const hasMultipleMedia = f.mediaItems && f.mediaItems.length > 1;
              const isVideo = f.mediaType === 'video' || (f.mediaItems && f.mediaItems[0]?.mediaType === 'video');

              return {
                id: f._id || f.id,
                type: isVideo ? 'reel' : (hasMultipleMedia ? 'album' : 'post'),
                image: f.thumbnailUrl || f.mediaUrl || (f.mediaItems && f.mediaItems[0]?.url),
                source: { uri: f.mediaUrl || (f.mediaItems && f.mediaItems[0]?.url) },
                stats: (f.viewCount || 0).toString(),
                mediaItems: f.mediaItems || []
              };
            });
          setPosts(mappedPosts);

          // Check for ACTIVE stories (for the profile picture ring)
          const activeStoryFlux = myFluxes.find((f: any) => {
            const isStory = f.isStory === true;
            const isExpired = f.isExpired === true;
            return isStory && !isExpired && !f.isDeleted;
          });
          
          if (activeStoryFlux) {
            setHasStory(true);
            setStoryMedia(activeStoryFlux.mediaUrl);
            setStoryId(activeStoryFlux._id);
          } else {
            setHasStory(false);
            setStoryMedia(null);
            setStoryId(null);
          }
        } else {
          setPosts([]);
          setHasStory(false);
          setStoryMedia(null);
          setTotalPosts(0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [user?.id])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfileData();
  }, [user?.id]);

  const dynamicPostCount = posts.filter(item => ['post', 'album', 'reel'].includes(item.type)).length;
  const postCount = totalPosts > 0 ? Math.max(totalPosts, dynamicPostCount) : 0;

  const onShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out ${user.name}'s profile on our app! @${user.username}`,
      });
      
      if (result.action === Share.sharedAction) {
        showToast({ message: 'Profile link shared!', type: 'success' });
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch (error: any) {
      showToast({ message: error.message, type: 'error' });
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      await mediaService.deletePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      setTotalPosts(prev => Math.max(0, prev - 1));
      showToast({ message: 'Post deleted successfully', type: 'success' });
    } catch (error: any) {
      showToast({ message: error.message || 'Failed to delete post', type: 'error' });
    }
  };

  const getFilteredData = () => {
    switch (activeTab) {
      case 'Reels': return posts.filter(item => item.type === 'reel');
      case 'Feeds': return posts.filter(item => item.type === 'feed');
      case 'Tags': return posts.filter(item => item.type === 'tag');
      default: return posts.filter(item => ['post', 'album', 'reel'].includes(item.type));
    }
  };

  const handleAddStory = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      showToast({ message: 'Camera roll permission denied', type: 'error' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      router.push({
        pathname: '/Post/CreateStoryScreen',
        params: { imageUri: result.assets[0].uri }
      });
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-black'>
      <View style={{ alignSelf: 'center', width: '100%', maxWidth: contentMaxWidth, flex: 1 }}>
        <View className='flex-row justify-between px-4 items-center py-4'>
          <Text 
            numberOfLines={1} 
            className='text-white font-bold flex-1'
            style={{ fontSize: isTablet ? 26 : 20 }}
          >
            @{user.username}
          </Text>
          
          <View className='flex-row gap-3'>
            <TouchableOpacity 
              style={{ width: headerIconSize, height: headerIconSize }}
              className='bg-[#1C2024] rounded-full items-center justify-center'
              onPress={() => router.push('/Post/CreatePostScreen')}
            >
              <Ionicons name='add' size={isTablet ? 28 : 24} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ width: headerIconSize, height: headerIconSize }}
              className='bg-[#1C2024] rounded-full items-center justify-center'
              onPress={()=>{router.push('../SetOptions/SettingsMain')}}
            >
              <Ionicons name='options' size={isTablet ? 28 : 24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 60 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
          }
        >
          <ProfileHeader
            userId={user.id}
            name={user.name}
            username={user.username}
            bio={user.bio}
            followers={followersCount}
            posts={postCount}
            following={followingCount}
            profilePic={user.profile_picture}
            website={user.website}
            showAddBtn={true}
            hasStory={hasStory}
            onAddStoryPress={handleAddStory}
            onStoryPress={() => {
              if (hasStory && stories.length > 0) {
                router.push({
                  pathname: '/Post/StoryViewer',
                  params: {
                    userId: user.id,
                    username: user.username,
                    avatar: user.profile_picture || '',
                    stories: JSON.stringify(stories),
                    initialIndex: '0'
                  }
                });
              } else {
                handleAddStory();
              }
            }}
          />

          <View className='flex-row items-center justify-between gap-2 px-3 mt-6'>
            <ProfileButton 
              label="Edit Profile" 
              iconName="pencil-outline" 
              onPress={() => router.push('/Profile/EditProfileScreen')} 
            />
            <ProfileButton 
              label="Add Post" 
              iconName="add-circle-outline" 
              onPress={() => router.push('/Post/CreatePostScreen')}
            />
            <ProfileButton 
              label="Share" 
              iconName="share-social-outline" 
              onPress={onShare}
            />
          </View>

          <View className="px-4 mt-6">
            <Text className="text-white text-xl font-rubik-bold">Our Story</Text>
          </View>
          <HighlightsSection 
            data={stories} 
            showAddButton={true} 
            onAddPress={handleAddStory}
            onItemPress={(item) => {
              const index = stories.findIndex(s => s.id === item.id);
              router.push({
                pathname: '/Post/StoryViewer',
                params: {
                  userId: user.id,
                  username: user.username,
                  avatar: user.profile_picture || '',
                  stories: JSON.stringify(stories),
                  initialIndex: index.toString()
                }
              });
            }}
          />
          
          <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
          
          <View style={{ marginTop: 2 }}>
            <MediaGrid 
              data={getFilteredData()} 
              activeTab={activeTab} 
              isReels={activeTab === 'Reels'} 
              onItemDelete={handleDeletePost}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
