import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Keyboard, Modal, Pressable, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router'; 
import { LinearGradient } from 'expo-linear-gradient';

import { SearchBar } from '@/components/Searchbar';
import { MessageTabs } from '@/components/Message/MessageTab';
import { MessageListItem } from '@/components/Message/MessageItem';
import { chatService } from '@/services/chatService';

const MessagesPage = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [deleteSelectedModalVisible, setDeleteSelectedModalVisible] = useState(false);
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = async () => {
    try {
      const data = await chatService.getChatList();
      if (data && data.chats) {
        const mappedChats = data.chats.map((chat: any) => ({
          id: chat._id,
          name: chat.participant?.username || chat.name || 'Unknown',
          avatar: chat.participant?.profile_picture || chat.avatar || 'https://via.placeholder.com/150',
          lastMessage: chat.lastMessage?.content || 'No messages yet',
          time: chat.lastMessage?.createdAt ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          isPinned: chat.isPinned || false,
          unreadCount: chat.unreadCount || 0,
          status: chat.lastMessage?.status || 'sent',
          isOnline: chat.participant?.isOnline || false,
        }));
        setMessages(mappedChats);
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChats();
  }, []);

  // --- Search Logic Start ---
  const filteredMessages = useMemo(() => {
    return messages.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (activeTab === 'All') return matchesSearch;
      if (activeTab === 'Personal') return matchesSearch && !item.isGroup;
      if (activeTab === 'Groups') return matchesSearch && item.isGroup;
      return matchesSearch;
    });
  }, [searchQuery, messages, activeTab]);
  // --- Search Logic End ---

  const handleCancelSearch = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
    Keyboard.dismiss();
  };

  const isSelectionMode = selectedItems.size > 0;

  const handleLongPress = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handlePress = (item: any) => {
    if (isSelectionMode) {
      handleLongPress(item.id);
    } else {
      router.push({
        pathname: '/Message/ChatDetailsScreen', 
        params: { 
          id: item.id,
          name: item.name,
          avatar: item.avatar,
          status: item.isOnline ? 'Active now' : 'Offline'
        }
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === messages.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(messages.map(item => item.id)));
    }
  };

  const handleDeleteSelected = () => {
    setMessages((prev) => prev.filter(item => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
    setDeleteSelectedModalVisible(false);
  };

  const handleDeleteAll = () => {
    setMessages([]);
    setSelectedItems(new Set());
    setDeleteAllModalVisible(false);
  };

  const exitSelectionMode = () => {
    setSelectedItems(new Set());
  };

  const TabButton = ({ label }: { label: string }) => {
    const isActive = activeTab === label;
    if (isActive) {
      return (
        <TouchableOpacity onPress={() => setActiveTab(label)} activeOpacity={0.9}>
          <LinearGradient
            colors={['#C084FC', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="px-4 py-1.5 rounded-full shadow-sm"
          >
            <Text className="text-white font-rubik-bold text-[13.5px]">{label}</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity 
        onPress={() => setActiveTab(label)}
        className="px-3 py-1.5 rounded-full"
      >
        <Text className="text-white/90 font-rubik-bold text-[13.5px]">{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0B0C10]">
      {/* Selection Mode Top Bar */}
      {isSelectionMode && (
        <View className="bg-[#1F1F23] border-b border-white/5">
          <View className="flex-row items-center justify-between px-5 py-4">
            <View className="flex-row items-center flex-1">
              <TouchableOpacity onPress={exitSelectionMode} className="mr-4">
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text className="text-white text-lg font-rubik-bold">
                {selectedItems.size} selected
              </Text>
            </View>
            <TouchableOpacity 
              onPress={handleSelectAll}
              className="px-3 py-1.5 rounded-lg bg-zinc-800"
            >
              <Text className="text-white font-rubik-medium text-sm">
                {selectedItems.size === messages.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Header Section */}
      {!isSelectionMode && (
        <View className="flex-row justify-between items-center px-5 py-4">
          <Text className="text-white text-2xl font-rubik-bold">Messages</Text>
          <TouchableOpacity 
            className="p-1"
            activeOpacity={0.7}
            onPress={()=>router.push('/Message/NewChat')}
          >
            <Ionicons name="create-outline" size={26} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Section */}
      {!isSelectionMode && (
        <>
          <View className="px-5 mb-4">
            <View className="flex-row items-center bg-[#1C1C1E] rounded-full px-5 py-2 border border-white/5">
               <Ionicons name="search" size={24} color="white" />
               <TextInput 
                 placeholder="Search events, people, posts..."
                 placeholderTextColor="white"
                 className="flex-1 ml-3 text-white text-[15px] font-rubik-regular"
                 value={searchQuery}
                 onChangeText={setSearchQuery}
                 onFocus={() => setIsSearchFocused(true)}
               />
               {isSearchFocused && (
                 <TouchableOpacity onPress={handleCancelSearch}>
                   <Ionicons name="close-circle" size={18} color="#71717A" />
                 </TouchableOpacity>
               )}
            </View>
          </View>

          <View className="px-5 mb-4 items-center">
            <View className="bg-[#1C1C1E] rounded-full p-1 flex-row items-center justify-between w-[88%]">
               <TabButton label="All" />
               <TabButton label="Personal" />
               <TabButton label="Groups" />
               <TabButton label="Requests" />
            </View>
          </View>
          
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
            locations={[0, 0.33, 0.61, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ height: 1, width: '100%', marginBottom: 8 }}
          />
        </>
      )}

      {/* Message List */}
      <FlatList
        data={filteredMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="white" className="mt-10" />
          ) : (
            <Text className="text-zinc-500 text-center mt-10">No messages found.</Text>
          )
        }
        renderItem={({ item }) => (
          <MessageListItem 
            name={item.name}
            avatar={item.avatar}
            lastMessage={item.lastMessage}
            time={item.time}
            isPinned={item.isPinned}
            unreadCount={item.unreadCount}
            status={item.status as any}
            isOnline={item.isOnline}
            isLastMessageFromUs={!!item.status}
            isSelected={selectedItems.has(item.id)}
            onPress={() => handlePress(item)}
            onLongPress={() => handleLongPress(item.id)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Delete Selected Confirmation Modal */}
      <Modal
        visible={deleteSelectedModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteSelectedModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/80 justify-center items-center px-8"
          onPress={() => setDeleteSelectedModalVisible(false)}
        >
          <Pressable
            className="w-full bg-zinc-900 border border-zinc-800 rounded-[32px] p-8"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-white text-2xl font-rubik-bold mb-2 text-center">
              Delete Selected?
            </Text>
            <Text className="text-zinc-400 text-base text-center mb-8 mt-2">
              Are you sure you want to delete {selectedItems.size} {selectedItems.size === 1 ? 'conversation' : 'conversations'}? This action cannot be undone.
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setDeleteSelectedModalVisible(false)}
                className="flex-1 h-14 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700"
              >
                <Text className="text-white font-rubik-medium text-lg">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteSelected}
                className="flex-1 h-14 rounded-full bg-red-600 items-center justify-center"
              >
                <Text className="text-white font-rubik-bold text-lg">Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete All Confirmation Modal */}
      <Modal
        visible={deleteAllModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteAllModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/80 justify-center items-center px-8"
          onPress={() => setDeleteAllModalVisible(false)}
        >
          <Pressable
            className="w-full bg-zinc-900 border border-zinc-800 rounded-[32px] p-8"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-white text-2xl font-rubik-bold mb-2 text-center">
              Delete All?
            </Text>
            <Text className="text-zinc-400 text-base text-center mb-8 mt-2">
              Are you sure you want to delete all conversations? This action cannot be undone.
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setDeleteAllModalVisible(false)}
                className="flex-1 h-14 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700"
              >
                <Text className="text-white font-rubik-medium text-lg">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAll}
                className="flex-1 h-14 rounded-full bg-red-600 items-center justify-center"
              >
                <Text className="text-white font-rubik-bold text-lg">Delete All</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default MessagesPage;
