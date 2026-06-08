import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { connectionService } from '@/services/connectionService';

export default function ConnectionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState<'new' | 'requests'>('new');
  const [profilePicUri, setProfilePicUri] = useState<string | null>(null);
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Sync profile picture and fetch request count
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 1. Load Profile Pic
        const savedPhotos = await AsyncStorage.getItem('userPhotos');
        if (savedPhotos) {
          const photos = JSON.parse(savedPhotos);
          if (photos.length > 0) {
            const firstPhoto = typeof photos[0] === 'string' ? photos[0] : photos[0].url;
            setProfilePicUri(firstPhoto);
          }
        }
        
        // 2. Fetch Request Count
        const response = await connectionService.getReceivedRequests();
        if (response.success && response.data) {
          const receivedRequests = response.data.requests || response.data;
          setRequestCount(Array.isArray(receivedRequests) ? receivedRequests.length : 0);
        }
      } catch (error) {
        console.log("Error loading data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
      return (
          <View className="flex-1 bg-black items-center justify-center">
              <ActivityIndicator size="large" color="#8b5cf6" />
          </View>
      );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#09090b]" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View className="flex-1">
        
        {/* HEADER */}
        <View className="flex-row justify-between items-center px-5 mt-2 h-[50px]">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="p-2 -ml-2"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => router.push('/(protected)/(connection)/ProfileDetailsScreen')}
            className="w-10 h-10 rounded-full bg-[#27272a] overflow-hidden border border-[#3f3f46] justify-center items-center"
          >
             {profilePicUri ? (
                 <Image source={{ uri: profilePicUri }} className="w-full h-full" />
             ) : (
                 <Ionicons name="person" size={20} color="#71717a" />
             )}
          </TouchableOpacity>
        </View>

        {/* TOGGLE TABS */}
        <View className="flex-row items-center self-center bg-[#18181b] rounded-full p-1 mt-4 border border-[#27272a]">
          <TouchableOpacity 
            onPress={() => setActiveTab('new')}
            className={`px-6 py-2.5 rounded-full ${activeTab === 'new' ? 'bg-[#1e293b]' : 'bg-transparent'}`}
          >
            <Text className={`text-sm font-semibold ${activeTab === 'new' ? 'text-[#93c5fd]' : 'text-[#71717a]'}`}>
                New connection
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/(protected)/(connection)/requests')}
            className="flex-row items-center px-6 py-2.5 rounded-full"
          >
            <Text className="text-sm font-semibold mr-2 text-[#71717a]">
                Requests
            </Text>
            {requestCount > 0 && (
              <View className="bg-red-500 w-5 h-5 rounded-full items-center justify-center">
                  <Text className="text-white text-[10px] font-bold">{requestCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* CENTER CONTENT */}
        <View className="flex-1 items-center justify-center px-8">
            <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => router.push('/(protected)/(connection)/ProfileMatchScreen')}
                className="relative w-64 h-64 mb-6 justify-center items-center"
            >
                <Image 
                    source={require('@/assets/images/connection/person_left.png')}
                    className="absolute w-12 h-12 rounded-full"
                    style={{ top: '20%', left: '30%' }} 
                />
                <Image 
                    source={require('@/assets/images/connection/person_right.png')}
                    className="absolute w-[50px] h-[50px] rounded-full"
                    style={{ bottom: '15%', right: '1%' }}
                />
                <Image 
                    source={require('@/assets/images/connection/chat_bubbles_3d.png')} 
                    className="absolute w-full h-full"
                    style={{ top: '-30%', left: '13%' }} 
                    resizeMode="contain"
                />
            </TouchableOpacity>

            <Text className="text-[#a1a1aa] text-center text-[15px] leading-6 mb-10 px-4 mt-6">
                Find and connect with individuals who share your passions, interests, and goals.
            </Text>

            <TouchableOpacity 
                onPress={() => router.push('/(protected)/(connection)/ProfileMatchScreen')}
                className="w-[200px] h-[54px] rounded-full overflow-hidden shadow-lg shadow-purple-500/20"
            >
                <LinearGradient
                    colors={['#937cf5', '#a855f7', '#8b5cf6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="flex-1 items-center justify-center"
                >
                    <Text className="text-white font-bold text-[16px]">Find a person</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
      </View>

      {/* RESTORED BOTTOM TAB BAR */}
      <View 
        className="absolute left-6 right-6 flex-row justify-between items-center h-[72px] bg-[#1c1c1e] rounded-[36px] px-8 shadow-lg shadow-black/50"
        style={{ bottom: insets.bottom + 20 }}
      >
          <TouchableOpacity 
            onPress={() => router.replace('/(protected)/(tabs)')}
            className="p-2"
          >
            <Ionicons name="home-outline" size={24} color="#71717a" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => router.replace('/(protected)/(tabs)/explore')}
            className="p-2"
          >
            <Ionicons name="search-outline" size={24} color="#71717a" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setActiveTab('new')}>
             <MaterialCommunityIcons name="molecule" size={30} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.replace('/(protected)/(tabs)/events')}
            className="p-2"
          >
            <Ionicons name="ticket-outline" size={24} color="#71717a" />
          </TouchableOpacity>
          
          {/* RESTORED EARTH ICON */}
          <TouchableOpacity 
            onPress={() => router.replace('/(protected)/(tabs)/explore')}
            className="p-2"
          >
            <Ionicons name="earth-outline" size={24} color="#71717a" />
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
