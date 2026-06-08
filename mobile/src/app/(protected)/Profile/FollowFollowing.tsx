import { View, Text, TouchableOpacity, FlatList, useWindowDimensions, Keyboard, ActivityIndicator } from 'react-native';
import React, { useMemo, useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { FollowTabs } from '@/components/Profile/FollowTabs';
import { SearchBar } from '@/components/Searchbar';
import { UserListItem } from '@/components/Profile/UserListItem';
import { useLocalSearchParams, router } from 'expo-router';
import { SelectionBottomSheet } from '@/components/BottomSheet';
import { followService } from '@/services/followService';

const FollowFollowing = () => {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  
  const [activeTab, setActiveTab] = useState((params.initialTab as string) || 'Followers');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSortVisible, setIsSortVisible] = useState(false);
  const [sortBy, setSortBy] = useState('Default');

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isTablet = width > 768;
  const iconButtonSize = isTablet ? 50 : 42;
  const horizontalPadding = isTablet ? 24 : 12;

  const parseBool = (v: unknown) => {
    if (Array.isArray(v)) v = v[0];
    if (typeof v === 'string') v = v.trim().toLowerCase();
    return v === 'true' || v === true;
  };

  const isMe = parseBool(params.isMe);
  const username = params.username;
  const userId = params.userId as string;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        let responseData: any = {};
        let list: any[] = [];

        // Map tabs to endpoints
        if (activeTab === 'Followers' || activeTab === 'Mutual' || activeTab === 'Received') {
          responseData = await followService.getFollowers(userId);
          list = responseData.followers || responseData.data || [];
        } else if (activeTab === 'Following' || activeTab === 'Requested') {
          responseData = await followService.getFollowing(userId);
          list = responseData.following || responseData.data || [];
        }
        
        if (list && Array.isArray(list)) {
          // Normalize backend data to match UserListItem expectations
          const mapped = list.map((u: any) => ({
            id: u._id || u.id,
            name: u.name || u.username,
            username: u.username,
            avatar: u.profile_picture || u.avatar || 'https://via.placeholder.com/150',
            isFollowing: u.isFollowing || false,
            isPrivate: u.isPrivate || false,
            isRequested: u.isRequested || false,
            followsMe: u.followsMe || false,
          }));
          setUsers(mapped);
        } else {
           setUsers([]);
        }
      } catch (error) {
        console.error("Failed to fetch follow list:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, activeTab]);

  const handleCancelSearch = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
    Keyboard.dismiss();
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user: any) => {
      // Very basic filtering, ideally the backend returns exactly what's needed for the tab
      const matchesSearch =
        (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [users, searchQuery]);

  return (
    <SafeAreaView className='flex-1 bg-black'>
      {/* Header */}
      <View style={{ paddingHorizontal: horizontalPadding }} className='flex-row justify-between items-center py-4'>
        <View className='flex-row gap-3 items-center flex-1'>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: iconButtonSize, height: iconButtonSize }}
            className='bg-[#1C2024] rounded-full items-center justify-center'
          >
            <Ionicons name='arrow-back' size={isTablet ? 28 : 24} color={COLORS.white} />
          </TouchableOpacity>
          <Text numberOfLines={1} className='text-white font-bold flex-1' style={{ fontSize: isTablet ? 24 : 20 }}>
            @{username}
          </Text>
        </View>

        {isMe && (
          <View className='flex-row gap-3 ml-2'>
            <TouchableOpacity style={{ width: iconButtonSize, height: iconButtonSize }} className='bg-[#1C2024] rounded-full items-center justify-center'>
              <Ionicons name='add' size={isTablet ? 28 : 24} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={{ width: iconButtonSize, height: iconButtonSize }} className='bg-[#1C2024] rounded-full items-center justify-center'>
              <Ionicons name='options' size={isTablet ? 28 : 24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FollowTabs activeTab={activeTab} onTabChange={setActiveTab} isOwnProfile={isMe} />
      
      <View className='mt-2 px-4'>
        <SearchBar 
          value={searchQuery} 
          onChangeText={setSearchQuery} 
          isFocused={isSearchFocused}
          setIsFocused={setIsSearchFocused}
          onCancel={handleCancelSearch}
          onPressOptions={() => setIsSortVisible(true)}
          placeholder='Search here..' 
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserListItem
            id={item.id}
            name={item.name}
            username={item.username}
            avatar={item.avatar}
            isFollowing={item.isFollowing}
            isPrivate={item.isPrivate}
            isRequested={item.isRequested}
            followsMe={item.followsMe}
            type={item.type}
          />
        )}
        ListEmptyComponent={
          loading ? (
             <ActivityIndicator color="white" className="mt-10" />
          ) : (
            <View className="mt-20 px-10">
              <Text className="text-gray-500 text-center">No users found</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 40, alignSelf: 'center', width: '100%' }}
        showsVerticalScrollIndicator={false}
      />

      <SelectionBottomSheet
        isVisible={isSortVisible}
        onClose={() => setIsSortVisible(false)}
        title="Sort by"
        options={['Default', 'Date followed: Latest', 'Date followed: Earliest']}
        selectedValue={sortBy}
        onSelect={setSortBy}
      />
    </SafeAreaView>
  );
};

export default FollowFollowing;
