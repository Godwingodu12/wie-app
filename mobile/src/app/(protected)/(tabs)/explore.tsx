import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, FlatList, StatusBar, Keyboard, TouchableOpacity, RefreshControl, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MotiView, AnimatePresence } from 'moti';
import Reanimated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { SearchBar } from '@/components/Searchbar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { wieUserService } from '@/services/wieUserService';
import { UserListItem } from '@/components/Profile/UserListItem';
import { mediaService } from '@/services/mediaService';
import { ticketUserService } from '@/services/ticketUserService';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40) / 3;

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'view-grid-outline' },
  { id: 'reels', label: 'Reels', icon: 'play-circle-outline' },
  { id: 'events', label: 'Events', icon: 'ticket-outline' },
];

const EXPLORE_DATA = [
  { id: '1', type: 'image', uri: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=400', hasIcon: 'image' },
  { id: '2', type: 'image', uri: 'https://images.pexels.com/photos/164745/pexels-photo-164745.jpeg?auto=compress&cs=tinysrgb&w=400', hasIcon: 'image' },
  { id: '3', type: 'image', uri: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400', hasIcon: 'play' },
  { id: '4', type: 'image', uri: 'https://images.pexels.com/photos/1749822/pexels-photo-1749822.jpeg?auto=compress&cs=tinysrgb&w=400', hasIcon: 'image' },
  { id: '5', type: 'image', uri: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=400', hasIcon: 'image' },
  { id: '5b', type: 'image', uri: 'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg?auto=compress&cs=tinysrgb&w=400', hasIcon: 'image' },
  { id: 'event-1', type: 'event', title: 'Summer Music Fest', location: 'Central Park - Today', attendees: '245 Going', bookings: '100+ Bookings in last hour', uri: 'https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: '6', type: 'image', uri: 'https://images.pexels.com/photos/164936/pexels-photo-164936.jpeg?auto=compress&cs=tinysrgb&w=400', hasIcon: 'play' },
  { id: '7', type: 'image', uri: 'https://images.pexels.com/photos/164743/pexels-photo-164743.jpeg?auto=compress&cs=tinysrgb&w=400', hasIcon: 'image' },
  { id: '8', type: 'image', uri: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=500&q=80', hasIcon: 'image' },
  { id: '9', type: 'image', uri: 'https://images.pexels.com/photos/164879/pexels-photo-164879.jpeg?auto=compress&cs=tinysrgb&w=400', hasIcon: 'image' },
  { id: '10', type: 'image', uri: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=400', hasIcon: 'image' },
  { id: '10b', type: 'image', uri: 'https://images.pexels.com/photos/154147/pexels-photo-154147.jpeg?auto=compress&cs=tinysrgb&w=400', hasIcon: 'image' },
  { id: 'event-2', type: 'event', title: 'Summer Music Fest', location: 'Central Park - Today', attendees: '245 Going', bookings: '100+ Bookings in last hour', uri: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800' },
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [exploreData, setExploreData] = useState<any[]>(EXPLORE_DATA);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  const fetchExploreData = useCallback(async () => {
    setIsLoadingFeed(true);
    try {
      let fetchedItems: any[] = [];

      if (activeCategory === 'all') {
        const [exploreRes, eventRes] = await Promise.all([
          mediaService.getExploreFeed().catch(() => null),
          ticketUserService.getInitialEvents().catch(() => null)
        ]);

        const mappedPosts = exploreRes?.data?.map((p: any) => ({
          id: p._id || p.id,
          type: 'image',
          uri: p.thumbnailUrl || p.mediaUrl || p.mediaItems?.[0]?.url || 'https://picsum.photos/400',
          hasIcon: p.mediaType === 'video' ? 'play' : 'image'
        })) || [];

        const mappedEvents = eventRes?.map((e: any) => ({
          id: `event-${e._id || e.id}`,
          type: 'event',
          title: e.name || e.title,
          location: e.location?.name || 'Various Locations',
          attendees: `${e.interestedCount || 0} Going`,
          bookings: 'Book tickets now',
          uri: e.coverImage || e.images?.[0] || 'https://picsum.photos/800/600'
        })) || [];

        fetchedItems = [...mappedPosts];
        if (mappedEvents.length > 0) {
          fetchedItems.splice(5, 0, mappedEvents[0]);
          if (mappedEvents[1]) fetchedItems.push(mappedEvents[1]);
        }
      } else if (activeCategory === 'reels') {
        const reelsRes = await mediaService.getReelsFeed().catch(() => null);
        fetchedItems = reelsRes?.data?.map((p: any) => ({
          id: p._id || p.id,
          type: 'image',
          uri: p.thumbnailUrl || p.mediaUrl || p.mediaItems?.[0]?.url || 'https://picsum.photos/400',
          hasIcon: 'play'
        })) || [];
      } else if (activeCategory === 'events') {
        const eventRes = await ticketUserService.getInitialEvents().catch(() => null);
        fetchedItems = eventRes?.map((e: any) => ({
          id: `event-${e._id || e.id}`,
          type: 'event',
          title: e.name || e.title,
          location: e.location?.name || 'Various Locations',
          attendees: `${e.interestedCount || 0} Going`,
          bookings: 'Book tickets now',
          uri: e.coverImage || e.images?.[0] || 'https://picsum.photos/800/600'
        })) || [];
      }

      if (fetchedItems.length > 0) {
        setExploreData(fetchedItems);
      } else {
        let fallbackData = EXPLORE_DATA;
        if (activeCategory === 'reels') fallbackData = EXPLORE_DATA.filter(item => item.hasIcon === 'play');
        if (activeCategory === 'events') fallbackData = EXPLORE_DATA.filter(item => item.type === 'event');
        setExploreData(fallbackData);
      }
    } catch (error) {
      console.log('Error fetching explore data, using fallback.', error);
      let fallbackData = EXPLORE_DATA;
      if (activeCategory === 'reels') fallbackData = EXPLORE_DATA.filter(item => item.hasIcon === 'play');
      if (activeCategory === 'events') fallbackData = EXPLORE_DATA.filter(item => item.type === 'event');
      setExploreData(fallbackData);
    } finally {
      setIsLoadingFeed(false);
      setRefreshing(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchExploreData();
  }, [fetchExploreData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchExploreData();
  }, [fetchExploreData]);

  // Search Logic
  useEffect(() => {
    let active = true;

    const performSearch = async () => {
      if (query.trim().length === 0) {
        setSearchResults([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const results = await wieUserService.searchUsers(query);
        if (!active) return;
        
        if (results && results.length > 0) {
          const mapped = results.map((u: any) => ({
            id: u.id || u._id,
            type: 'person',
            name: u.name || u.username,
            subtitle: `@${u.username}`,
            image: u.profile_picture || 'https://via.placeholder.com/150',
            isFollowing: u.isFollowing || false,
            isRequested: u.isRequested || false,
            isPrivate: u.accountPrivacy === 'private' || u.isPrivate || false,
            year: u.year || '2024', // Default year if not present
          }));
          setSearchResults(mapped);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const renderCategoryItem = (item: any) => {
    const isSelected = activeCategory === item.id;
    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setActiveCategory(item.id);
        }}
        className="mr-3"
      >
        {isSelected ? (
          <LinearGradient
            colors={['#C084FC', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-row items-center px-6 py-2.5 rounded-full"
          >
            <MaterialCommunityIcons name={item.icon as any} size={20} color="white" />
            <Text className="text-white font-rubik-bold ml-2 text-[15px]">{item.label}</Text>
          </LinearGradient>
        ) : (
          <View className="flex-row items-center px-6 py-2.5 rounded-full bg-zinc-900/80 border border-white/5">
            <MaterialCommunityIcons name={item.icon as any} size={20} color="white" />
            <Text className="text-white font-rubik-medium ml-2 text-[15px]">{item.label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Logic to chunk data for mixed layout based on active category
  const chunkedData = React.useMemo(() => {
    let filteredData = EXPLORE_DATA;

    if (activeCategory === 'reels') {
      // Show only reels: for the demo, we convert all image items to reels so the grid is full
      filteredData = EXPLORE_DATA.filter(item => item.type === 'image').map(item => ({ ...item, hasIcon: 'play' }));
    } else if (activeCategory === 'events') {
      // Show only events: for the demo, we duplicate the events so the screen is full
      const events = EXPLORE_DATA.filter(item => item.type === 'event');
      filteredData = [...events, ...events.map(e => ({ ...e, id: e.id + '_copy' }))];
    }

    const chunked: any[] = [];
    let currentGridRow: any[] = [];

    filteredData.forEach((item) => {
      if (item.type === 'event') {
        if (currentGridRow.length > 0) {
          chunked.push({ type: 'grid_row', items: currentGridRow });
          currentGridRow = [];
        }
        chunked.push({ type: 'full_event', item });
      } else {
        currentGridRow.push(item);
        if (currentGridRow.length === 3) {
          chunked.push({ type: 'grid_row', items: currentGridRow });
          currentGridRow = [];
        }
      }
    });

    if (currentGridRow.length > 0) {
      chunked.push({ type: 'grid_row', items: currentGridRow });
    }

    return chunked;
  }, [activeCategory]);

  const renderSearchResult = ({ item }: { item: any }) => (
    <View className="mb-4">
      <UserListItem
        id={item.id}
        name={item.name}
        username={item.subtitle.replace('@', '')}
        avatar={item.image}
        isFollowing={item.isFollowing}
        isPrivate={item.isPrivate}
        isRequested={item.isRequested}
        followsMe={item.followsMe}
      />
      {item.year && (
        <View className="absolute right-4 top-1/2 -translate-y-1/2 bg-zinc-800 px-2 py-1 rounded">
          <Text className="text-zinc-400 text-[10px] font-rubik-medium">{item.year}</Text>
        </View>
      )}
    </View>
  );

  const renderChunk = ({ item }: { item: any }) => {
    if (item.type === 'full_event') {
      const event = item.item;
      return (
        <TouchableOpacity 
          activeOpacity={0.9}
          className="w-full h-72 rounded-[32px] overflow-hidden my-3 bg-zinc-900 shadow-2xl"
        >
          <Image source={{ uri: event.uri }} className="w-full h-full" resizeMode="cover" />
          
          {/* Frosted Glass Overlay with Gradient */}
          <View className="absolute bottom-0 left-0 right-0 h-40 overflow-hidden rounded-b-[32px]">
            <BlurView intensity={40} tint="dark" className="absolute inset-0" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              className="absolute inset-0"
            />
          </View>

          <View className="absolute inset-0 justify-end p-6">
            <View className="flex-row justify-between items-end">
              <View className="flex-1 mr-4">
                <Text className="text-white font-rubik-bold text-[22px] leading-7">{event.title}</Text>
                <Text className="text-zinc-300 font-rubik-regular text-[13px] mt-0.5">{event.location}</Text>
                
                <View className="flex-row items-center mt-4">
                  <View className="flex-row">
                    {[1, 2, 3].map((i) => (
                      <View key={i} className="w-6 h-6 rounded-full border-2 border-black bg-zinc-800 -ml-2 overflow-hidden first:ml-0">
                        <Image source={{ uri: `https://i.pravatar.cc/100?u=${i + 20}` }} className="w-full h-full" />
                      </View>
                    ))}
                  </View>
                  <Text className="text-white/90 font-rubik-medium text-[12px] ml-2">{event.attendees}</Text>
                </View>
              </View>
              
              <View className="items-end gap-3">
                <TouchableOpacity 
                  activeOpacity={0.8}
                  className="bg-white/15 px-5 py-2.5 rounded-full flex-row items-center border border-white/10"
                >
                  <MaterialCommunityIcons name="ticket-confirmation" size={16} color="white" />
                  <Text className="text-white font-rubik-bold text-[12px] ml-2">Book tickets</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  className="w-11 h-11 rounded-full bg-white/15 items-center justify-center border border-white/10"
                >
                  <Ionicons name="heart-outline" size={22} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            <Text className="text-zinc-400 font-rubik-regular text-[11px] mt-3 tracking-wide">{event.bookings}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View className="flex-row mb-1">
        {item.items.map((gridItem: any) => (
          <TouchableOpacity 
            key={gridItem.id}
            activeOpacity={0.8}
            style={{ width: COLUMN_WIDTH, height: COLUMN_WIDTH }}
            className="m-0.5 rounded-[20px] overflow-hidden relative bg-zinc-900 border border-white/5"
          >
            <Image source={{ uri: gridItem.uri }} className="w-full h-full" resizeMode="cover" />
            <View className="absolute top-2.5 right-2.5 bg-black/40 rounded-lg p-1.5 backdrop-blur-md">
              <MaterialCommunityIcons 
                name={gridItem.hasIcon === 'play' ? 'play-circle-outline' : 'image-outline'} 
                size={16} 
                color="white" 
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Header with Search Bar */}
      <View className="px-5 py-4 bg-black">
        <SearchBar 
          value={query} 
          onChangeText={setQuery}
          isFocused={isFocused}
          setIsFocused={setIsFocused}
          onCancel={() => {
            setQuery('');
            setSearchResults([]);
            setIsFocused(false);
            Keyboard.dismiss();
          }}
          placeholder="Search"
        />
      </View>

      <AnimatePresence exitBeforeEnter>
        {query.length > 0 ? (
          <MotiView 
            key="search-results"
            from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 px-5 bg-black"
          >
            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#8B5CF6" />
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={item => item.id}
                renderItem={renderSearchResult}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 10, paddingBottom: 100 }}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons name="search-outline" size={48} color="#3F3F46" />
                <Text className="text-zinc-500 font-rubik-medium mt-4">No results found for "{query}"</Text>
              </View>
            )}
          </MotiView>
        ) : (
          <MotiView 
            key="explore-content"
            from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1"
          >
            {/* Category Filters */}
            <View className="mb-4 bg-black">
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingHorizontal: 20 }}
              >
                {CATEGORIES.map(renderCategoryItem)}
              </ScrollView>
            </View>

            {/* Content Grid */}
            <View className="flex-1 px-4 bg-black">
              <FlatList
                data={chunkedData}
                keyExtractor={(_, index) => `chunk-${index}`}
                renderItem={renderChunk}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100, backgroundColor: 'black' }}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
                }
              />
            </View>
          </MotiView>
        )}
      </AnimatePresence>
    </SafeAreaView>
  );
}
