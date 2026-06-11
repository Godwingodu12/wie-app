import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const SearchInsideChat = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // In a real app, filter messages here
    if (text.trim().length > 2) {
      // Simulate search results
      setResults([
        { id: '1', text: 'Hey, are we still meeting today?', timestamp: 'Yesterday' },
        { id: '2', text: 'Did you see the latest update?', timestamp: 'Monday' },
      ]);
    } else {
      setResults([]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Search Header */}
      <View className="px-5 py-4 border-b border-white/5">
        <View className="flex-row items-center bg-[#1F1F23] rounded-2xl px-4 py-1 border border-white/5">
           <TouchableOpacity onPress={() => router.back()}>
             <Ionicons name="arrow-back" size={22} color="white" />
           </TouchableOpacity>
           <TextInput
             autoFocus
             placeholder="Search messages..."
             placeholderTextColor="#52525B"
             className="flex-1 ml-3 h-[48px] text-white text-[16px] font-rubik-regular"
             value={searchQuery}
             onChangeText={handleSearch}
           />
           {searchQuery.length > 0 && (
             <TouchableOpacity onPress={() => handleSearch('')}>
               <Ionicons name="close-circle" size={20} color="#52525B" />
             </TouchableOpacity>
           )}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            className="mb-6 bg-[#1F1F23]/50 p-4 rounded-2xl border border-white/5"
            onPress={() => router.back()}
          >
            <View className="flex-row justify-between mb-2">
              <Text className="text-[#7C4DFF] text-[12px] font-rubik-bold">MATCH FOUND</Text>
              <Text className="text-zinc-500 text-[11px] font-rubik-medium">{item.timestamp}</Text>
            </View>
            <Text className="text-white text-[15px] font-rubik-regular leading-[22px]">
              {item.text}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="mt-20 items-center px-10">
            <Ionicons name="search" size={64} color="#1F1F23" />
            <Text className="text-zinc-500 font-rubik-regular text-center mt-4">
              {searchQuery ? 'No messages found.' : 'Search for messages in this chat.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default SearchInsideChat;
