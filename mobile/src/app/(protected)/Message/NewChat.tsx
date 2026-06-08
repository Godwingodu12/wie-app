import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Keyboard, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { SearchBar } from '@/components/Searchbar';
import { UserListItem } from '@/components/Profile/UserListItem';
import { wieUserService } from '@/services/wieUserService';
import { chatService } from '@/services/chatService';

const NewChatSearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      const results = await wieUserService.searchUsers(query);
      setUsers(results || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleCancelSearch = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
    Keyboard.dismiss();
  };

  const navigateToChat = async (user: any) => {
    try {
      const chatData = await chatService.createOrGetChat(user._id || user.id);
      
      router.push({
        pathname: '/Message/ChatDetailsScreen',
        params: {
          id: chatData.chat?._id || chatData._id,
          name: user.username || user.name,
          avatar: user.profile_picture || user.avatar,
          status: 'Active now'
        }
      });
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center px-5 py-4">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mr-4 bg-zinc-900 p-2 rounded-full border border-zinc-800"
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-rubik-bold">New Message</Text>
      </View>

      <View className="px-4 mb-4">
        <SearchBar 
          value={searchQuery}
          onChangeText={setSearchQuery}
          isFocused={isSearchFocused}
          setIsFocused={setIsSearchFocused}
          onCancel={handleCancelSearch}
          placeholder="Search people you follow..."
        />
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item._id || item.id}
        renderItem={({ item }) => (
          <View className="relative">
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => navigateToChat(item)}
              className="flex-row items-center"
            >
              <View pointerEvents="none" className="flex-1">
                <UserListItem
                  id={item.id || item._id}
                  name={item.name || item.username}
                  username={item.username}
                  avatar={item.profile_picture}
                  isFollowing={true} 
                />
              </View>

              <View 
                className="absolute right-4 bg-zinc-800 rounded-lg items-center justify-center border border-zinc-700"
                style={{ width: 100, height: 34 }}
              >
                <Text className="text-zinc-400 font-rubik-medium text-[11px]">
                  Message
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
        ListHeaderComponent={() => (
          <View className="px-5 py-2">
            <Text className="text-zinc-600 font-rubik-medium uppercase text-[10px] tracking-widest">
              {searchQuery ? 'Search Results' : 'Type to Search'}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="white" className="mt-10" />
          ) : (
            <View className="mt-20 items-center px-10">
              <Text className="text-zinc-500 font-rubik-regular text-center">
                {searchQuery ? 'No results found.' : ''}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default NewChatSearchPage;
