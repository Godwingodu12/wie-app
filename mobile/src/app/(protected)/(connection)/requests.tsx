import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  FlatList, 
  StatusBar,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectionService } from '@/services/connectionService';
import { getImageSource } from '@/utils/imageUtils';

export default function RequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePicUri, setProfilePicUri] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const response = await connectionService.getReceivedRequests();
      if (response.success && response.data) {
        // Backend returns { success: true, data: { requests: [...], pagination: {...} } }
        const receivedRequests = response.data.requests || response.data;
        setRequests(Array.isArray(receivedRequests) ? receivedRequests : []);
      }
    } catch (e) {
      console.error("Failed to fetch requests:", e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    const loadProfilePic = async () => {
      try {
        const savedPhotos = await AsyncStorage.getItem('userPhotos');
        if (savedPhotos) {
          const photos = JSON.parse(savedPhotos);
          if (photos.length > 0) {
            const firstPhoto = typeof photos[0] === 'string' ? photos[0] : photos[0].url;
            setProfilePicUri(firstPhoto);
          }
        }
      } catch (error) {
        console.log("Error loading photo", error);
      }
    };
    loadProfilePic();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests().finally(() => setRefreshing(false));
  };

  const handleAccept = async (requestId: string) => {
    try {
      await connectionService.acceptRequest(requestId);
      setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (e) {
      console.error("Failed to accept request:", e);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await connectionService.rejectRequest(requestId);
      setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (e) {
      console.error("Failed to reject request:", e);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const sender = item.fromConnectionProfileId;
    let photoUrl = sender?.photos?.[0]?.url || sender?.photos?.[0];
    const imageSource = getImageSource(photoUrl);

    return (
      <View className="flex-row items-center justify-between px-6 py-4">
        <View className="flex-row items-center flex-1">
          <View className="w-14 h-14 rounded-full bg-[#27272a] overflow-hidden items-center justify-center border border-zinc-900">
            <Image 
              source={imageSource}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          </View>
          <View className="ml-4">
            <Text className="text-white text-[17px] font-bold">{sender?.displayName || sender?.display_name || 'User'}</Text>
            <Text className="text-zinc-500 text-sm mt-0.5">@{sender?.username || 'unknown'}</Text>
          </View>
        </View>

        <View className="flex-row gap-2">
            <TouchableOpacity 
                onPress={() => handleReject(item._id)}
                className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center"
            >
                <Ionicons name="close" size={20} color="#71717a" />
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={() => handleAccept(item._id)}
                className="rounded-full overflow-hidden"
            >
                <LinearGradient
                    colors={['#937cf5', '#a855f7', '#8b5cf6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="px-6 py-2.5 items-center justify-center"
                >
                    <Text className="text-white font-bold text-sm">Accept</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09090b]" edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      
      <View className="px-5 flex-row justify-between items-center mt-2 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => router.push('/(protected)/(connection)/ProfileDetailsScreen')}
          className="w-10 h-10 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 justify-center items-center"
        >
          {profilePicUri ? (
            <Image source={{ uri: profilePicUri }} className="w-full h-full" />
          ) : (
            <Ionicons name="person" size={20} color="#71717a" />
          )}
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center self-center bg-[#131313] rounded-full p-1 mb-8">
        <TouchableOpacity 
          onPress={() => router.replace('/(protected)/(connection)/ConnectionsScreen')} 
          className="px-6 py-2 rounded-full"
        >
          <Text className="text-zinc-400 font-semibold text-sm">New connection</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center px-6 py-2 rounded-full bg-[#3b414d]">
          <Text className="text-white font-semibold text-sm mr-2">Requests</Text>
          <View className="bg-[#ef4444] w-5 h-5 rounded-full items-center justify-center">
             <Text className="text-white text-[11px] font-bold">{requests.length}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8b5cf6" className="mt-10" />
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center mt-20 px-10">
                <Ionicons name="mail-open-outline" size={60} color="#27272a" />
                <Text className="text-zinc-500 text-center mt-4">No pending requests at the moment.</Text>
            </View>
          }
        />
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <View 
        className="absolute left-6 right-6 flex-row justify-between items-center h-[72px] bg-[#1c1c1e] rounded-[36px] px-8 shadow-2xl shadow-black/50"
        style={{ bottom: insets.bottom > 0 ? insets.bottom : 20 }}
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

        <TouchableOpacity onPress={() => router.replace('/(protected)/(connection)/ConnectionsScreen')}>
          <MaterialCommunityIcons name="molecule" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.replace('/(protected)/(tabs)/events')}
          className="p-2"
        >
          <Ionicons name="ticket-outline" size={24} color="#71717a" />
        </TouchableOpacity>

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
