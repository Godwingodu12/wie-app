import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { connectionService } from '@/services/connectionService';
import { getImageSource } from '@/utils/imageUtils';

const { width, height } = Dimensions.get('window');

export default function ProfileDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  
  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [userAge, setUserAge] = useState('');
  const [userQualifications, setUserQualifications] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync data from Backend with Storage fallback
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // 1. Try fetch from Backend
        const response = await connectionService.getProfile();
        if (response.success && response.data) {
           const d = response.data;
           setUserName(d.displayName || d.display_name || 'User Name');
           setUserAge(d.age?.toString() || '');
           setUserLocation(d.location?.city || '');
           
           // Backend might send photos as array of objects or array of strings
           if (d.photos && d.photos.length > 0) {
              const photoUrls = d.photos.map((p: any) => getImageSource(typeof p === 'string' ? p : p.url));
              setUserPhotos(photoUrls);
           }
           
           setUserQualifications(d.qualifications || []);
        } else {
          // 2. Fallback to Local Storage
          const keys = ['userPhotos', 'userName', 'userLocation', 'userAge', 'userQualifications'];
          const stores = await AsyncStorage.multiGet(keys);
          stores.forEach(([key, value]) => {
            if (!value) return;
            if (key === 'userPhotos') {
              const localPhotos = JSON.parse(value);
              const processedLocal = localPhotos.map((p: any) => getImageSource(typeof p === 'string' ? p : p.url));
              setUserPhotos(processedLocal);
            }
            if (key === 'userName') setUserName(value);
            if (key === 'userLocation') setUserLocation(value);
            if (key === 'userAge') setUserAge(value);
            if (key === 'userQualifications') setUserQualifications(JSON.parse(value));
          });
        }
      } catch (e) { 
        console.error("Failed to load profile:", e); 
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Sliding Animation logic
  useEffect(() => {
    if (userPhotos.length > 1) {
      const interval = setInterval(() => {
        let nextIndex = (currentIndex + 1) % userPhotos.length;
        setCurrentIndex(nextIndex);
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [userPhotos, currentIndex]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#09090b] items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#09090b]">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* SLIDING BACKGROUND IMAGES */}
      <View className="absolute top-0 left-0 right-0 h-[60%]">
        <FlatList
          ref={flatListRef}
          data={userPhotos.length > 0 ? userPhotos : ['https://via.placeholder.com/600']}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={{ width, height: '100%' }}>
              <Image source={item} className="w-full h-full" resizeMode="cover" />
            </View>
          )}
        />
        <LinearGradient
          colors={['transparent', 'rgba(9,9,11,0.5)', '#09090b']}
          className="absolute bottom-0 left-0 right-0 h-48"
        />
      </View>

      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        
        {/* HEADER NAVIGATION - NO STROKE STYLE */}
        <View style={{ paddingTop: insets.top + 10 }} className="px-5 flex-row justify-between items-center z-[100]">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 rounded-full bg-black/20 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View>
            <TouchableOpacity 
              onPress={() => setShowMenu(!showMenu)} 
              className="w-10 h-10 rounded-full bg-black/20 items-center justify-center"
            >
              <Ionicons name="ellipsis-vertical" size={20} color="white" />
            </TouchableOpacity>
            
            {/* DROPDOWN MENU */}
            {showMenu && (
              <View 
                className="absolute top-12 right-0 bg-[#18181b] p-1 rounded-2xl border border-zinc-800 w-40 shadow-2xl z-[110]"
              >
                <TouchableOpacity 
                  onPress={() => { setShowMenu(false); router.push('/(protected)/(connection)/edit-profile'); }} 
                  className="flex-row items-center p-3 border-b border-zinc-900"
                >
                  <Ionicons name="person-outline" size={18} color="white" />
                  <Text className="text-white ml-3 font-medium">Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => { setShowMenu(false); router.push('/(protected)/(connection)/settings'); }} 
                  className="flex-row items-center p-3"
                >
                  <Ionicons name="settings-outline" size={18} color="white" />
                  <Text className="text-white ml-3 font-medium">Settings</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* CONTENT OFFSET */}
        <View style={{ height: height * 0.40 }} />

        {/* PROFILE SECTION */}
        <View className="px-6 pb-24">
          <View className="w-20 h-20 rounded-full border-2 border-[#09090b] overflow-hidden mb-5 bg-zinc-900 shadow-xl">
             <Image 
               source={userPhotos[0] || getImageSource(null)} 
               className="w-full h-full"
             />
          </View>

          <Text className="text-white text-4xl font-bold tracking-tight">{userName || 'User Name'}</Text>
          <Text className="text-zinc-500 text-base mt-1 mb-8 font-medium">
            @{ (userName || 'user').toLowerCase().replace(/\s+/g, '_') }
          </Text>

          {/* BADGES */}
          <View className="flex-row flex-wrap gap-2 mb-10">
            {userAge ? (
              <View className="flex-row items-center bg-[#18181b] px-4 py-2.5 rounded-xl border border-zinc-900">
                <Ionicons name="time-outline" size={14} color="#71717a" />
                <Text className="text-zinc-300 ml-2 font-semibold">{userAge} years</Text>
              </View>
            ) : null}
            {userLocation ? (
              <View className="flex-row items-center bg-[#18181b] px-4 py-2.5 rounded-xl border border-zinc-900">
                <Ionicons name="location-outline" size={14} color="#71717a" />
                <Text className="text-zinc-300 ml-2 font-semibold">{userLocation}</Text>
              </View>
            ) : null}
            
            {userQualifications.map((qual, idx) => (
              <View key={idx} className="flex-row items-center bg-[#18181b] px-4 py-2.5 rounded-xl border border-zinc-900">
                <Ionicons name="school-outline" size={14} color="#71717a" />
                <Text className="text-zinc-300 ml-2 font-semibold">{qual}</Text>
              </View>
            ))}
          </View>

          {/* OVAL PHOTOS SECTION - SHOWS ALL PHOTOS */}
          <Text className="text-white text-xl font-bold mb-5">My photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {userPhotos.map((source, index) => (
              <TouchableOpacity key={index} onPress={() => flatListRef.current?.scrollToIndex({ index, animated: true })}>
                <Image source={source} className="w-24 h-32 rounded-[40px] mr-4" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              onPress={() => router.push('/(protected)/(connection)/photos')} 
              className="w-24 h-32 rounded-[40px] bg-[#18181b] items-center justify-center border border-dashed border-zinc-800"
            >
              <View className="bg-zinc-800 rounded-xl p-1 mb-1">
                 <Ionicons name="add" size={24} color="white" />
              </View>
              <Text className="text-zinc-500 text-[10px] font-bold">Add photo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
