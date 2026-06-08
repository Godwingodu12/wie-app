import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, FlatList, StatusBar, Keyboard, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MotiView, AnimatePresence } from 'moti';
import Reanimated, { FadeOut, Layout } from 'react-native-reanimated';
import { SearchBar } from '@/components/Searchbar';
import { TabHeader } from '@/components/Header/TabHeader';
import { wieUserService } from '@/services/wieUserService';
import { UserListItem } from '@/components/Profile/UserListItem';

const INITIAL_RECENT = [
  { id: 'recent-1', type: 'tag', name: '#NightLife', subtitle: 'Trending' },
  { id: 'recent-2', type: 'tag', name: '#LiveMusic', subtitle: 'Trending' },
];

const TRENDING = ['#TechFest', '#ArtGallery', '#Startup'];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentSearches, setRecentSearches] = useState(INITIAL_RECENT);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // --- SAVE SEARCH LOGIC ---
  const addToRecent = (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setRecentSearches((prev) => {
      // Prevent duplicates: remove if exists, then add to top
      const filtered = prev.filter((i) => i.id !== item.id);
      return [item, ...filtered];
    });

    // Navigate to profile if it's a person
    if (item.type === 'person') {
      router.push({
        pathname: '/Profile/OtherProfile',
        params: { 
          id: item.id,
          username: item.subtitle.replace('@', ''),
          name: item.name,
          avatar: item.image
        }
      });
    }

    // Clear search and dismiss keyboard after selection
    setQuery('');
    setIsFocused(false);
    Keyboard.dismiss();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

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

    // Debounce
    const timer = setTimeout(performSearch, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const handleCancelAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setQuery('');
    setSearchResults([]);
    setIsFocused(false);
    Keyboard.dismiss();
  };

  const removeRecentItem = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecentSearches(prev => prev.filter(item => item.id !== id));
  };

  const renderItem = ({ item, isSearchResult }: { item: any, isSearchResult: boolean }) => {
    if (item.type === 'person') {
      return (
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
      );
    }

    return (
      <Reanimated.View 
        layout={Layout.springify()} 
        exiting={FadeOut.duration(200)}
        className="flex-row items-center justify-between py-3"
      >
        <TouchableOpacity 
          onPress={() => isSearchResult ? addToRecent(item) : setQuery(item.name.replace('#', ''))} 
          className="flex-row items-center flex-1"
        >
          {item.type === 'tag' ? (
            <View className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center">
              <Text className='font-rubik-extrabold text-white text-lg'>#</Text>
            </View>
          ) : (
            <Image 
              source={{ uri: item.image }} 
              className={`w-14 h-14 bg-zinc-800 rounded-xl`} 
            />
          )}
          <View className="ml-4 flex-1">
            <Text className="text-white font-rubik-bold text-base" numberOfLines={1}>{item.name}</Text>
            <Text className="text-zinc-500 text-xs font-rubik-regular">{item.subtitle}</Text>
          </View>
        </TouchableOpacity>
        
        {!isSearchResult && (
          <TouchableOpacity onPress={() => removeRecentItem(item.id)} className="p-2">
            <Ionicons name="close" size={20} color="#52525b" />
          </TouchableOpacity>
        )}
      </Reanimated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      <TabHeader />

      <View className="px-5 pt-2 pb-4 border-b border-zinc-900 bg-black z-10">
        <SearchBar 
          value={query} 
          onChangeText={setQuery}
          isFocused={isFocused}
          setIsFocused={setIsFocused}
          onCancel={handleCancelAction}
        />
      </View>

      <View className="flex-1 px-5">
        <AnimatePresence exitBeforeEnter>
          {query.length === 0 ? (
            <MotiView 
              key="recent-container"
              from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1"
            >
              <View className="flex-row justify-between items-center mt-6 mb-2">
                <Text className="text-white font-rubik-bold text-lg">Recent</Text>
                {recentSearches.length > 0 && (
                  <TouchableOpacity onPress={() => setRecentSearches([])}>
                    <Text className="text-indigo-400 font-rubik-medium text-sm">Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>

              <FlatList
                data={recentSearches}
                keyExtractor={item => `recent-${item.id}`}
                renderItem={(props) => renderItem({ ...props, isSearchResult: false })}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818CF8" colors={["#818CF8"]} />
                }
                ListFooterComponent={() => (
                  <View className="mt-8 pb-10">
                    <Text className="text-zinc-400 font-rubik-bold text-xs uppercase tracking-widest mb-4">Trending</Text>
                    {TRENDING.map((topic) => (
                      <TouchableOpacity 
                        key={topic} 
                        className="flex-row items-center py-3" 
                        onPress={() => setQuery(topic.replace('#',''))}
                      >
                        <View className="w-10 h-10 rounded-full bg-zinc-900 items-center justify-center mr-3">
                          <Ionicons name="trending-up" size={16} color="#4ade80" />
                        </View>
                        <Text className="text-white font-rubik-medium text-base">{topic}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </MotiView>
          ) : loading ? (
            <MotiView 
              key="loading-container"
              from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 items-center justify-center"
            >
              <MotiView
                from={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1.1, opacity: 1 }}
                transition={{ loop: true, type: 'timing', duration: 800 }}
              >
                <Ionicons name="search" size={48} color="#6366F1" />
              </MotiView>
              <Text className="text-zinc-400 font-rubik-medium mt-4">Searching for &quot;{query}&quot;</Text>
            </MotiView>
          ) : searchResults.length === 0 ? (
            <MotiView 
              key="no-results-container"
              from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex-1 items-center justify-center px-10"
            >
              <Ionicons name="search-outline" size={50} color="#3f3f46" />
              <Text className="text-white font-rubik-bold text-xl mt-4">No results</Text>
              <Text className="text-zinc-500 text-center mt-2">Try searching for something else.</Text>
            </MotiView>
          ) : (
            <MotiView 
              key="results-container"
              from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1"
            >
              <FlatList
                data={searchResults}
                keyExtractor={item => `result-${item.id}`}
                renderItem={(props) => renderItem({ ...props, isSearchResult: true })}
                contentContainerStyle={{ paddingTop: 20 }}
                showsVerticalScrollIndicator={false}
              />
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </SafeAreaView>
  );
}
