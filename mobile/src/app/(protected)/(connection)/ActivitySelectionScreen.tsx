import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import Custom Buttons
import { GradientButton, OutlineButton } from '@/components/Connection/UI/Buttons';

// Enable Layout Animation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- DATA: Activity Categories & Sub-Categories (Fixed based on Image 27 & 28) ---
const ACTIVITY_DATA = [
  { 
    id: 'entertainment', 
    label: 'Entertainment Shows', 
    icon: '🍿',
    sub: [
      { id: 'movies', label: 'Movies', icon: '🎬' },
      { id: 'theater', label: 'Theater', icon: '🎭' },
      { id: 'comedy', label: 'Comedy shows', icon: '🎭' }
    ]
  },
  { 
    id: 'sports', 
    label: 'Sports', 
    icon: '🏃',
    sub: [
      { id: 'cricket', label: 'Cricket', icon: '🏏' },
      { id: 'football', label: 'Football', icon: '⚽' },
      { id: 'gym', label: 'Gym', icon: '🏋️' },
      { id: 'yoga', label: 'Yoga', icon: '🧘' },
    ]
  },
  { 
    id: 'tech', 
    label: 'Tech Fest', 
    icon: '💹',
    sub: [
      { id: 'tech_events', label: 'Tech events', icon: '💹' },
      { id: 'startup', label: 'Startup meetups', icon: '🤝' },
      { id: 'hackathons', label: 'Hackathons', icon: '💻' },
    ]
  },
  { 
    id: 'concert', 
    label: 'Concert', 
    icon: '🎵',
    sub: [
      { id: 'music_concert', label: 'Music concert', icon: '🥁' },
      { id: 'dj_night', label: 'DJ night', icon: '🎧' },
      { id: 'live_perf', label: 'Live performance', icon: '🎤' },
    ]
  },
  { 
    id: 'camping', 
    label: 'Payout/Camping', 
    icon: '🌅',
    sub: [
      { id: 'outdoor', label: 'Outdoor activity', icon: '🏕️' },
      { id: 'camping_sub', label: 'Camping', icon: '⛺' },
      { id: 'hiking', label: 'Hiking', icon: '⛰️' },
    ] 
  },
];

import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

const ActivitySelectionScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  // Toggle Selection (Sub-Activities)
  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Toggle Expansion (Main Categories)
  const toggleExpand = (id: string) => {
    if (expandedIds.includes(id)) {
      setExpandedIds(expandedIds.filter(item => item !== id));
    } else {
      setExpandedIds([...expandedIds, id]);
    }
  };

  const handleNext = () => {
    if (selectedIds.length === 0) {
      Alert.alert("Selection Required", "Please select at least one activity.");
      return;
    }
    router.push('/(protected)/(tabs)'); 
  };

  return (
    <View className="flex-1 bg-[#09090b]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View style={{ paddingTop: insets.top }} className="flex-1 px-5">
        
        {/* HEADER - Consistent with 02/07 flow */}
        <View className="flex-row items-center h-[60px] mb-2.5">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1 h-[2px] bg-[#1c1c1e] mx-[15px] rounded-full">
            <View className="h-full bg-white rounded-full w-[28%]" />
          </View>
          <Text className="text-[#a8a29e] text-[13px] font-semibold">02/07</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
          
          {/* TITLE BASED ON IMAGE 27 */}
          <View className="mt-2.5 mb-8">
            <Text className="text-white text-[24px] font-bold leading-tight">
              Are you currently at or heading to any specific activity/event?
            </Text>
          </View>

          {/* CHIP CLOUD LAYOUT */}
          <View className="flex-row flex-wrap gap-3">
            {ACTIVITY_DATA.map((category) => {
              const isExpanded = expandedIds.includes(category.id);
              const hasSelection = category.sub.some(sub => selectedIds.includes(sub.id));

              return (
                <View key={category.id} className="flex-row flex-wrap gap-3">
                  
                  {/* MAIN CATEGORY CHIP (Based on Image 27) */}
                  <TouchableOpacity
                    onPress={() => toggleExpand(category.id)}
                    activeOpacity={0.7}
                    className={`flex-row items-center pl-3 pr-4 py-2.5 rounded-full border ${
                      isExpanded || hasSelection
                        ? 'bg-[#3f3f46] border-[#52525b]' 
                        : 'bg-[#1c1c1e] border-[#27272a]'
                    }`}
                  >
                    <View className="w-8 h-8 rounded-full bg-[#333] items-center justify-center mr-2">
                      <Text className="text-[16px]">{category.icon}</Text>
                    </View>
                    <Text className="text-[14px] font-medium text-[#e4e4e7]">
                      {category.label}
                    </Text>
                  </TouchableOpacity>

                  {/* SUB-CATEGORY CHIPS (Based on Image 28) */}
                  {isExpanded && category.sub.map((subItem) => {
                    const isSelected = selectedIds.includes(subItem.id);
                    return (
                      <Animated.View 
                        key={subItem.id}
                        entering={FadeIn.duration(200)}
                        exiting={FadeOut.duration(200)}
                        layout={Layout.springify()}
                      >
                        <TouchableOpacity
                          onPress={() => toggleSelection(subItem.id)}
                          activeOpacity={0.7}
                          className={`flex-row items-center px-4 py-2.5 rounded-full border ${
                            isSelected 
                              ? 'bg-white border-white' 
                              : 'bg-[#1c1c1e] border-[#27272a]'
                          }`}
                        >
                          <Text className="text-[16px] mr-2">{subItem.icon}</Text>
                          <Text className={`text-[14px] font-medium ${isSelected ? 'text-black' : 'text-[#a1a1aa]'}`}>
                            {subItem.label}
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                  
                </View>
              );
            })}
          </View>

        </ScrollView>
      </View>

      {/* FOOTER BUTTONS */}
      <View 
        className="flex-row px-5 gap-3 bg-[#09090b] pt-2.5 absolute bottom-0 w-full"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        <View className="flex-1">
          <OutlineButton 
            title="Skip" 
            onPress={() => router.push('/(protected)/(tabs)')} 
          />
        </View>
        
        <View className="flex-1">
          <GradientButton 
            title="Next" 
            onPress={handleNext} 
          />
        </View>
      </View>
    </View>
  );
};

export default ActivitySelectionScreen;
