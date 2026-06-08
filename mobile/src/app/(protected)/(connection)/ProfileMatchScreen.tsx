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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { connectionService } from '@/services/connectionService';
import { getImageSource } from '@/utils/imageUtils';

const { width, height } = Dimensions.get('window');

export default function ProfileMatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [purposeCode, setPurposeCode] = useState('travel');

  const currentProfileData = suggestions[currentIdx];

  // 1. Load Suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const savedPurpose = await AsyncStorage.getItem('user_purpose_code') || 'travel';
        setPurposeCode(savedPurpose);
        
        const response = await connectionService.getSuggestions(savedPurpose);
        if (response.success && response.data) {
          setSuggestions(response.data);
        }
      } catch (e) { 
        console.error("Failed to fetch suggestions:", e); 
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  // 2. PHOTO CHANGING ANIMATION
  useEffect(() => {
    if (currentProfileData?.photos?.length > 1 || currentProfileData?.profile?.photos?.length > 1) {
      const interval = setInterval(() => {
        const photosLen = (currentProfileData.profile?.photos || currentProfileData.photos).length;
        const nextIndex = (currentPhotoIndex + 1) % photosLen;
        setCurrentPhotoIndex(nextIndex);

        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [currentProfileData, currentPhotoIndex]);

  const handleNext = () => {
    if (currentIdx < suggestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setCurrentPhotoIndex(0);
    } else {
      // Loop back or show empty state
      setCurrentIdx(0);
      setCurrentPhotoIndex(0);
    }
  };

  const handleConnect = async () => {
    if (!currentProfileData || sending) return;
    setSending(true);
    
    const targetProfile = currentProfileData.profile || currentProfileData;
    const purposeId = currentProfileData.purpose?._id || currentProfileData._id;

    try {
      await connectionService.sendRequest(
        targetProfile._id, 
        purposeCode, 
        purposeId
      );
      handleNext();
    } catch (e) {
      console.error("Failed to send request:", e);
      handleNext();
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#09090b] items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!currentProfileData) {
    return (
      <SafeAreaView className="flex-1 bg-[#09090b] items-center justify-center px-10">
        <MaterialCommunityIcons name="account-search" size={80} color="#27272a" />
        <Text className="text-white text-xl font-bold mt-6 text-center">No more matches found</Text>
        <Text className="text-zinc-500 text-center mt-2">Try updating your interests or travel style to find more people.</Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-10 px-8 py-3 bg-[#1e293b] rounded-full"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Handle case where profile data might be spread at root or nested under .profile
  const profile = currentProfileData.profile || currentProfileData;
  const matchPercentage = currentProfileData.matchScore || 0;
  
  // Handle profile.photos which is an array of objects {url, publicId...} or strings
  const photos = (profile.photos && profile.photos.length > 0)
    ? profile.photos.map((p: any) => getImageSource(typeof p === 'string' ? p : p.url)) 
    : ['https://via.placeholder.com/600'];

  return (
    <View className="flex-1 bg-[#09090b]">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View className="absolute top-0 left-0 right-0 h-[52%]">
        <FlatList
          ref={flatListRef}
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => `photo-${index}`}
          renderItem={({ item }) => (
            <View style={{ width, height: '100%' }}>
              <Image source={item} className="w-full h-full" resizeMode="cover" />
            </View>
          )}
        />
        <LinearGradient
          colors={['transparent', 'rgba(9,9,11,0.4)', '#09090b']}
          className="absolute bottom-0 left-0 right-0 h-60"
        />
      </View>

      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: insets.top + 10 }} className="px-5 flex-row justify-between items-center z-[100]">
          <TouchableOpacity onPress={() => router.back()} className="w-11 h-11 rounded-full bg-white/20 items-center justify-center">
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity className="w-11 h-11 rounded-full bg-white/20 items-center justify-center">
            <Ionicons name="ellipsis-vertical" size={22} color="white" />
          </TouchableOpacity>
        </View>

        <View style={{ height: height * 0.33 }} />

        <View className="px-6">
          <View className="w-20 h-20 rounded-full border-[3px] border-[#09090b] overflow-hidden -mt-10 mb-5 bg-[#18181b] z-50">
             <Image source={photos[0]} className="w-full h-full" />
          </View>

          <Text className="text-white text-[38px] font-bold tracking-tight">{profile.displayName || profile.display_name || 'User'}</Text>
          <Text className="text-zinc-500 text-lg mt-0 mb-8 font-medium">@{profile.username || (profile.displayName || 'user').toLowerCase().replace(/\s+/g, '_')}</Text>

          {/* BADGES */}
          <View className="flex-row flex-wrap gap-2 mb-10">
            {[
              profile.age ? `${profile.age} years` : null,
              profile.location?.city,
              profile.personalDescription ? profile.personalDescription.substring(0, 30) : null
            ].filter(Boolean).map((label, idx) => (
              <View key={idx} className="flex-row items-center bg-[#101010] px-5 py-2.5 rounded-full border border-zinc-900/30">
                <MaterialCommunityIcons name="hexagon-outline" size={14} color="#52525b" />
                <Text className="text-zinc-400 ml-2 font-medium text-[14px]">{label}</Text>
              </View>
            ))}
          </View>

          {/* INTERESTS TAGS */}
          <View className="flex-row flex-wrap gap-2 mb-10">
            {profile.interests?.flatMap((i: any) => i.tags).map((tag: string, idx: number) => (
              <View key={idx} className="bg-zinc-900 px-4 py-2 rounded-full">
                <Text className="text-zinc-300 text-xs">{tag}</Text>
              </View>
            ))}
          </View>

          {/* MATCH SLIDER */}
          <View className="mb-24">
            <View className="flex-row justify-between items-baseline mb-5">
               <View className="flex-row items-baseline">
                 <Text className="text-white text-5xl font-bold tracking-tighter">{matchPercentage}%</Text>
                 <Text className="text-zinc-500 text-base ml-3 mb-2 font-medium">Profile match</Text>
               </View>
               <Text className="text-zinc-500 text-[11px] font-bold uppercase tracking-[2px]">MAX</Text>
            </View>

            <View className="h-12 bg-[#0a0a0a] rounded-full flex-row items-center px-1.5 relative border border-zinc-900/40 overflow-hidden">
              <View 
                style={{ width: `${matchPercentage}%`, height: '100%', backgroundColor: 'rgba(255,255,255,0.12)', position: 'absolute', left: 0 }} 
              />
              <View style={{ width: `${matchPercentage}%` }} className="flex-row justify-end items-center z-10">
                <View className="w-9 h-9 rounded-full bg-white shadow-2xl shadow-white/80" />
              </View>
              <View className="absolute right-7">
                <Feather name="sun" size={20} color="#3f3f46" />
              </View>
            </View>
          </View>
        </View>
        <View className="h-44" />
      </ScrollView>

      {/* FOOTER */}
      <View style={{ paddingBottom: insets.bottom + 15 }} className="px-6 flex-row gap-4 absolute bottom-0 left-0 right-0 py-5 bg-[#09090b]">
        <TouchableOpacity 
          onPress={handleNext}
          className="flex-1 h-16 rounded-full border border-zinc-800 items-center justify-center"
        >
          <Text className="text-white text-lg font-bold">Next</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleConnect}
          disabled={sending}
          className="flex-1 h-16 rounded-full overflow-hidden"
        >
          <LinearGradient
            colors={['#937cf5', '#a855f7', '#8b5cf6']}
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }}
            className="w-full h-full items-center justify-center"
          >
            {sending ? <ActivityIndicator color="white" /> : <Text className="text-white text-lg font-bold">Connect</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
