import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Keyboard, ActivityIndicator, TextInput, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { wieUserService } from '@/services/wieUserService';

const GroupMemberSelection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
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

  const toggleUser = (user: any) => {
    const isSelected = selectedUsers.some(u => (u._id || u.id) === (user._id || user.id));
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => (u._id || u.id) !== (user._id || user.id)));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const removeUser = (user: any) => {
    setSelectedUsers(selectedUsers.filter(u => (u._id || u.id) !== (user._id || user.id)));
  };

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
          <View>
            <Text className="text-white text-2xl font-rubik-bold tracking-tight">New group</Text>
            {selectedUsers.length > 0 && (
              <Text className="text-zinc-500 text-[12px]">{selectedUsers.length} of 100 selected</Text>
            )}
          </View>
        </View>
      </View>

      {/* Selected Users Preview */}
      {selectedUsers.length > 0 && (
        <View className="px-5 pb-4 border-b border-white/5">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {selectedUsers.map((user) => (
              <View key={user._id || user.id} className="items-center w-14">
                <View className="relative">
                  <Image 
                    source={user.profile_picture ? { uri: user.profile_picture } : { uri: 'https://via.placeholder.com/150' }}
                    className="w-14 h-14 rounded-full bg-zinc-800"
                  />
                  <TouchableOpacity 
                    onPress={() => removeUser(user)}
                    className="absolute -top-1 -right-1 bg-[#1F1F23] rounded-full border border-white/10"
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <Text className="text-white text-[10px] mt-1 text-center" numberOfLines={1}>
                  {user.username || user.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search Bar */}
      <View className="px-5 mt-4 mb-2">
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
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {
          const isSelected = selectedUsers.some(u => (u._id || u.id) === (item._id || item.id));
          return (
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => toggleUser(item)}
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
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'bg-[#7C4DFF] border-[#7C4DFF]' : 'border-zinc-700'}`}>
                 {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
            </TouchableOpacity>
          );
        }}
        ListHeaderComponent={() => (
          <View className="px-5 py-2">
            <Text className="text-zinc-600 font-rubik-medium uppercase text-[10px] tracking-widest">
              Suggested
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

      {/* Next Button */}
      {selectedUsers.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 p-6 pb-10 bg-black/80">
          <TouchableOpacity 
            onPress={() => router.push({
              pathname: '/Message/CreateGroup',
              params: { members: JSON.stringify(selectedUsers.map(u => u._id || u.id)) }
            })}
            className="h-[56px] bg-[#7C4DFF] rounded-full items-center justify-center shadow-lg"
          >
            <Text className="text-white font-rubik-bold text-lg">Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default GroupMemberSelection;
