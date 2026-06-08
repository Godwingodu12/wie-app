import React, { useEffect, useState, useCallback, useRef } from "react";
import { FlatList, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { TabHeader } from "@/components/Header/TabHeader";
import StoryList from "@/components/StoryList";
import EventCategoryList from "@/components/EventCategoryList";
import { EVENT_CATEGORIES } from "@/constants/eventCategoryData";
import CompletePost from "@/components/Post/CompletePost";
import HorizontalUserList from "@/components/Profile/HorizontalUserList";
import FeaturedEventCard from "@/components/Events/FeaturedEventCard";
import HorizontalEventList from "@/components/Events/HorizontalEventList";
import { ReelsList } from "@/components/Reel/ReelsList";

import { mediaService } from "@/services/mediaService";
import { wieUserService } from "@/services/wieUserService";
import { ticketUserService } from "@/services/ticketUserService";
import { useUser } from "@/context/UserContext";

export default function Home() {
  const { user: currentUser } = useUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (pageNum > 1) setLoadingMore(true);
      
      const [dynamicResp, exploreResp, reelsResp, storiesResp] = await Promise.all([
        mediaService.getPostFeed(pageNum, 15).catch(() => ({ data: [] })),
        mediaService.getExploreFeed(pageNum, 30).catch(() => ({ data: [] })),
        pageNum === 1 ? mediaService.getReelsFeed(1, 15).catch(() => []) : Promise.resolve([]),
        pageNum === 1 ? mediaService.getFluxFeed().catch(() => []) : Promise.resolve([])
      ]);

      const parseList = (resp: any) => {
        if (!resp) return [];
        if (Array.isArray(resp)) return resp;
        return resp.data || resp.fluxes || resp.posts || resp.users || resp.reels || [];
      };

      const dynamicFeed = parseList(dynamicResp);
      const exploreFeed = parseList(exploreResp);
      const rawReels = parseList(reelsResp);
      const rawStories = parseList(storiesResp);

      const allPostsMap = new Map();
      const allStoriesMap = new Map();

      // ── STORY PROCESSING (Top Tray - Flux) ──
      const processStoryItems = (items: any[]) => {
        if (!items || !Array.isArray(items)) return;
        items.forEach((item) => {
          if (!item) return;
          const fluxes = Array.isArray(item.fluxes) ? item.fluxes : [item];
          fluxes.forEach((f: any) => {
            if (!f) return;
            // If it's from the flux/feed (rawStories), we treat it as a story
            
            const owner = f.owner || f.user || item.user || {};
            const userId = String(owner.id || owner._id || f.userId || item.userId || "");
            if (!userId) return;

            const isSelf = userId === String(currentUser?.id || "");

            if (!allStoriesMap.has(userId) || isSelf) {
              allStoriesMap.set(userId, {
                id: isSelf ? 'me' : `story_${userId}`,
                image: owner.profile_picture || owner.avatar || f.avatar || f.profile_picture || 'https://via.placeholder.com/150',
                username: owner.username || f.username || (isSelf ? currentUser?.username : 'User'),
                hasStory: true,
                isSeen: false
              });
            }
          });
        });
      };

      // ── POST PROCESSING (Main Feed) ──
      const processPostItems = (items: any[], source: string) => {
        if (!items || !Array.isArray(items)) return;
        items.forEach((item) => {
          if (!item) return;
          // Handle both raw flux objects and nested fluxes arrays
          const fluxes = Array.isArray(item.fluxes) ? item.fluxes : [item];
          
          fluxes.forEach((f: any) => {
            if (!f) return;
            // Filter out stories if they happen to be in the post feed
            if (f.isStory === true) return; 
            
            const fid = String(f._id || f.id || "");
            if (!fid || fid === 'undefined' || fid === 'null') return;

            const owner = f.owner || f.user || item.user || {};
            const userId = String(owner.id || owner._id || f.userId || item.userId || "");
            const isSelf = userId === String(currentUser?.id || "");

            if (!allPostsMap.has(fid) || isSelf) {
              allPostsMap.set(fid, {
                type: 'post',
                userId: userId,
                isFollowing: f.isFollowing !== undefined ? f.isFollowing : (source === 'following'),
                isSelf: isSelf,
                id: fid,
                username: owner.username || f.username || (isSelf ? currentUser?.username : 'User'),
                name: owner.name || owner.display_name || f.name || (isSelf ? currentUser?.name : ''),
                isVerified: owner.is_verified || owner.isVerified || f.is_verified || f.isVerified || false,
                avatar: owner.profile_picture || owner.profilePicture || owner.avatar || f.avatar || f.profile_picture || (isSelf ? currentUser?.profile_picture : null),
                location: f.locationLabel || f.location || 'Bhopal, India',
                rawDate: f.createdAt,
                timestamp: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '2h ago',
                musicTitle: f.musicTitle || 'Original Audio',
                media: (f.mediaItems && f.mediaItems.length > 0)
                  ? f.mediaItems.map((m: any) => ({ 
                      url: typeof m === 'string' ? m : (m.url || m.mediaUrl || m.fluxMediaUrl || f.mediaUrl || f.fluxMediaUrl), 
                      thumbnail: typeof m === 'string' ? m : (m.thumbnailUrl || m.url || m.mediaUrl || f.thumbnailUrl || f.mediaUrl), 
                      type: typeof m === 'string' ? (m.match(/\.(mp4|mov|webm|avi)(\?|$)/i) ? 'video' : 'image') : (m.mediaType || m.type || f.mediaType || 'image') 
                    }))
                  : [{ 
                      url: f.mediaUrl || f.fluxMediaUrl || f.url, 
                      thumbnail: f.thumbnailUrl || f.mediaUrl || f.fluxMediaUrl, 
                      type: f.mediaType || f.type || 'image' 
                    }],
                initialLikes: f.likeCount !== undefined ? f.likeCount : (f.likes?.length || 0),
                hasLiked: f.hasLiked || false,
                comments: (f.commentCount !== undefined ? f.commentCount : (f.comments?.length || 0)).toString(),
                shares: (f.shareCount || 0).toString(),
                caption: f.caption || ""
              });
            }
          });
        });
      };


      // Execute partitioned processing
      processStoryItems(rawStories);
      processPostItems(dynamicFeed, 'following');
      processPostItems(exploreFeed, 'explore');

      const newSortedPosts = Array.from(allPostsMap.values())
        .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
      
      const newReels = rawReels.map((r: any) => ({
        id: r._id || r.id,
        mediaUrl: r.mediaUrl,
        thumbnailUrl: r.thumbnailUrl || r.mediaUrl
      }));

      if (pageNum === 1) {
        const [usersResp, evtsResp] = await Promise.all([
          wieUserService.getSuggestedUsers().catch(() => []),
          ticketUserService.getInitialEvents().catch(() => [])
        ]);
        
        const rawSuggestedUsers = parseList(usersResp);
        const usersMap = new Map();
        rawSuggestedUsers.forEach((u: any) => {
          const uid = String(u.id || u._id);
          if (uid && uid !== 'undefined' && !usersMap.has(uid) && uid !== String(currentUser?.id)) {
            usersMap.set(uid, u);
          }
        });
        const users = Array.from(usersMap.values());

        const rawEvents = parseList(evtsResp);
        const evtsMap = new Map();
        rawEvents.forEach((e: any) => {
          const eid = String(e.id || e._id);
          if (eid && eid !== 'undefined' && !evtsMap.has(eid)) evtsMap.set(eid, e);
        });
        const eventsList = Array.from(evtsMap.values());

        setSuggestedUsers(users);
        setEvents(eventsList);

        let feed: any[] = [];
        feed.push(...newSortedPosts.slice(0, 4));
        if (users.length > 0) feed.push({ id: 'module_suggested_profiles', type: 'suggested_profiles', data: users });
        
        feed.push(...newSortedPosts.slice(4, 7));
        if (eventsList.length > 0) {
          feed.push({ id: 'module_featured_event', type: 'featured_event', data: eventsList[0] });
          if (eventsList.length > 1) feed.push({ id: 'module_nearby_events', type: 'nearby_events', data: eventsList.slice(1) });
        }

        feed.push(...newSortedPosts.slice(7, 12));
        if (newReels.length > 0) feed.push({ id: 'module_suggested_reels', type: 'suggested_reels', data: newReels.slice(0, 10) });
        
        feed.push(...newSortedPosts.slice(12));

        setPosts(feed);
        
        const selfStory = allStoriesMap.get(String(currentUser?.id || ""));
        const otherStories = Array.from(allStoriesMap.values()).filter(s => s.id !== 'me');
        setStories([
          selfStory || { 
            id: 'me', 
            image: currentUser?.profile_picture, 
            username: 'Your story', 
            hasStory: false, 
            isSeen: false 
          },
          ...otherStories
        ]);

        setHasMore(newSortedPosts.length > 0);
      } else {
        setPosts(prev => {
          const existingIds = new Set();
          prev.forEach(p => { if (p.type === 'post') existingIds.add(p.id); });
          const uniqueNew = newSortedPosts.filter(p => !existingIds.has(p.id));
          
          const regularPosts = prev.filter(p => p.type === 'post');
          const modules = prev.filter(p => p.type !== 'post');
          
          const combinedPosts = [...regularPosts, ...uniqueNew]
            .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
          
          let newFeed: any[] = [];
          newFeed.push(...combinedPosts.slice(0, 4));
          const usersMod = modules.find(m => m.type === 'suggested_profiles');
          if (usersMod) newFeed.push(usersMod);
          
          newFeed.push(...combinedPosts.slice(4, 7));
          const featuredEvtMod = modules.find(m => m.type === 'featured_event');
          if (featuredEvtMod) newFeed.push(featuredEvtMod);
          const nearbyEvtMod = modules.find(m => m.type === 'nearby_events');
          if (nearbyEvtMod) newFeed.push(nearbyEvtMod);

          newFeed.push(...combinedPosts.slice(7, 12));
          const reelsMod = modules.find(m => m.type === 'suggested_reels');
          if (reelsMod) newFeed.push(reelsMod);

          newFeed.push(...combinedPosts.slice(12));
          return newFeed;
        });
        setHasMore(newSortedPosts.length > 0);
      }
    } catch (error) {
      console.error('[Index] Error fetching feed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.id) {
      console.log('[Home] User profile loaded, fetching feed for:', currentUser.username);
      fetchData(1);
    } else {
      console.log('[Home] Waiting for user profile...');
    }
  }, [currentUser?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchData(1, true);
  }, [fetchData]); // Added fetchData to dependencies

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
    }
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    switch (item.type) {
      case 'post':
        return <CompletePost postData={item} />;
      case 'suggested_profiles':
        return (
          <View className="mb-6">
            <View className="flex-row justify-between items-center px-4 mb-3">
              <Text className="text-white font-rubik-bold text-lg">Suggested profiles</Text>
              <TouchableOpacity onPress={() => router.push('/(protected)/(tabs)/explore')}><Text className="text-primary text-[14px] font-normal">see all</Text></TouchableOpacity>
            </View>
            <HorizontalUserList users={item.data} />
          </View>
        );
      case 'featured_event':
        return (
          <View className="mb-6 px-4">
             <FeaturedEventCard event={item.data} />
          </View>
        );
      case 'nearby_events':
        return (
          <View className="mb-6">
            <View className="flex-row justify-between items-center px-4 mb-3">
              <Text className="text-white font-rubik-bold text-lg">Nearby events</Text>
              <TouchableOpacity onPress={() => router.push('/(protected)/(tabs)/events')}><Text className="text-primary text-[14px] font-normal">see all</Text></TouchableOpacity>
            </View>
            <HorizontalEventList events={item.data} />
          </View>
        );
      case 'suggested_reels':
        return (
          <View className="mb-6">
            <View className="flex-row justify-between items-center px-4 mb-3">
              <Text className="text-white font-rubik-bold text-lg">Suggested reels</Text>
              <TouchableOpacity><Text className="text-primary text-[14px] font-normal">see all</Text></TouchableOpacity>
            </View>
            <ReelsList reels={item.data} />
          </View>
        );
      default:
        return null;
    }
  }, []); // Stable renderItem

  const renderFooter = () => {
    if (!loadingMore) return <View className="h-10" />;
    return (
      <View className="py-6 items-center">
        <ActivityIndicator color="#8b5cf6" />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="#8b5cf6" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <TabHeader />
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
        }
        ListEmptyComponent={
          <View className="mt-20 items-center">
            <Text className="text-gray-500 font-rubik">No posts available yet</Text>
          </View>
        }
        ListHeaderComponent={
          <View className="pt-2">
            <View className="pl-4"><StoryList stories={stories} /></View>
            <View className="px-4 mt-6">
              <View className="flex-row justify-between items-center">
                <Text className="text-white font-rubik-bold text-xl">Event categories</Text>
                <TouchableOpacity onPress={() => router.push('/(protected)/(tabs)/events')}><Text className="text-primary text-[14px] font-normal">see all</Text></TouchableOpacity>
              </View>
            </View>
            <View className="pl-4"><EventCategoryList data={EVENT_CATEGORIES} /></View>
          </View>
        }
        ListFooterComponent={<View>{renderFooter()}</View>}
      />
    </SafeAreaView>
  );
}
