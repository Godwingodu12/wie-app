import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Keyboard, ActivityIndicator, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { wieUserService } from '@/services/wieUserService';
import { chatService } from '@/services/chatService';

const NewChatSearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Personal');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      // If query is empty, maybe show suggested users
      const results = query.trim() ? await wieUserService.searchUsers(query) : await wieUserService.getSuggestedUsers?.() || [];
      setUsers(results || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery]);

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

  const renderHeader = () => (
    <View>
      {/* Tabs */}
      <View className="px-5 py-4 flex-row gap-3">
        <TouchableOpacity 
          onPress={() => setActiveTab('Personal')}
          className={`px-6 py-2.5 rounded-full ${activeTab === 'Personal' ? 'bg-white' : 'bg-[#1F1F23] border border-white/5'}`}
        >
          <Text className={`font-rubik-medium text-[14px] ${activeTab === 'Personal' ? 'text-black' : 'text-zinc-400'}`}>Personal</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('Groups')}
          className={`px-6 py-2.5 rounded-full ${activeTab === 'Groups' ? 'bg-white' : 'bg-[#1F1F23] border border-white/5'}`}
        >
          <Text className={`font-rubik-medium text-[14px] ${activeTab === 'Groups' ? 'text-black' : 'text-zinc-400'}`}>Groups</Text>
        </TouchableOpacity>
      </View>

      {/* Create Group Action */}
      {!searchQuery && (
        <TouchableOpacity 
          onPress={() => router.push('/Message/CreateGroup')}
          className="flex-row items-center px-5 py-4 mb-2"
        >
          <View className="w-12 h-12 rounded-full bg-[#7C4DFF]/10 items-center justify-center border border-[#7C4DFF]/20">
            <Ionicons name="people" size={24} color="#7C4DFF" />
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-white font-rubik-bold text-[16px]">Create group</Text>
            <Text className="text-zinc-500 text-[12px]">Chat with multiple people</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#3F3F46" />
        </TouchableOpacity>
      )}

      <View className="px-5 py-2">
        <Text className="text-zinc-600 font-rubik-medium uppercase text-[10px] tracking-widest">
          {searchQuery ? 'Search Results' : 'Suggested'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-3"
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-3xl font-rubik-bold tracking-tight">New chat</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-5 mb-2">
        <View className="flex-row items-center bg-[#1F1F23] rounded-2xl px-4 py-3 border border-white/5">
           <Ionicons name="search" size={20} color="#52525B" />
           <TextInput 
             placeholder="Search peoples..."
             placeholderTextColor="#52525B"
             className="flex-1 ml-3 text-white text-[16px] font-rubik-regular"
             value={searchQuery}
             onChangeText={setSearchQuery}
           />
        </View>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item._id || item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 50 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => navigateToChat(item)}
            className="flex-row items-center px-5 py-3"
          >
            <Image 
              source={item.profile_picture ? { uri: item.profile_picture } : { uri: 'https://via.placeholder.com/150' }}
              className="w-12 h-12 rounded-full bg-zinc-800"
            />
            <View className="ml-4 flex-1">
              <Text className="text-white font-rubik-bold text-[16px]">{item.username || item.name}</Text>
              <Text className="text-zinc-500 text-[12px]" numberOfLines={1}>{item.bio || 'WIE User'}</Text>
            </View>
            <View className="bg-[#1F1F23] px-4 py-1.5 rounded-full border border-white/5">
               <Text className="text-white font-rubik-medium text-[11px]">Message</Text>
            </View>
          </TouchableOpacity>
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
