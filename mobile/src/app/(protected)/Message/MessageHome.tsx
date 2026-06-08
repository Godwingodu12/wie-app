import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Keyboard, Modal, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router'; 

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
          name: chat.participant?.username || 'Unknown',
          avatar: chat.participant?.profile_picture || 'https://via.placeholder.com/150',
          lastMessage: chat.lastMessage?.content || 'No messages yet',
          time: chat.lastMessage?.createdAt ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          isPinned: false,
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

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Selection Mode Top Bar */}
      {isSelectionMode && (
        <View className="bg-zinc-900 border-b border-zinc-800">
          <View className="flex-row items-center justify-between px-5 py-4">
            <View className="flex-row items-center flex-1">
              <TouchableOpacity onPress={exitSelectionMode} className="mr-4">
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text className="text-white text-lg font-rubik-bold">
                {selectedItems.size} {selectedItems.size === 1 ? 'selected' : 'selected'}
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
          
          <View className="flex-row items-center px-5 pb-4 gap-3">
            <TouchableOpacity 
              onPress={() => setDeleteSelectedModalVisible(true)}
              className="flex-1 flex-row items-center justify-center bg-red-600/20 border border-red-600/50 rounded-xl py-3 px-4"
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text className="text-red-500 font-rubik-semibold ml-2 text-base">
                Delete Selected
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setDeleteAllModalVisible(true)}
              className="flex-1 flex-row items-center justify-center bg-red-600/20 border border-red-600/50 rounded-xl py-3 px-4"
            >
              <Ionicons name="trash" size={20} color="#FF3B30" />
              <Text className="text-red-500 font-rubik-semibold ml-2 text-base">
                Delete All
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Header Section */}
      {!isSelectionMode && (
        <View className="flex-row justify-between items-center px-5 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/'); 
                }
              }} 
              className="mr-2"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={28} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-3xl font-rubik-bold tracking-tight">Messages</Text>
          </View>

          <TouchableOpacity 
            className="bg-zinc-900 p-2.5 rounded-full border border-zinc-800"
            activeOpacity={0.7}
            onPress={()=>router.push('/Message/NewChat')}
          >
            <Ionicons name="create-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Section */}
      {!isSelectionMode && (
        <>
          <View className="px-4 mb-2">
            <SearchBar 
              value={searchQuery}
              onChangeText={setSearchQuery}
              isFocused={isSearchFocused}
              setIsFocused={setIsSearchFocused}
              onCancel={handleCancelSearch}
              placeholder="Search peoples..."
            />
          </View>

          <MessageTabs activeTab={activeTab} onTabChange={setActiveTab} />
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
