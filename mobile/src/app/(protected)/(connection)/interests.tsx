import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  ScrollView, 
  StatusBar, 
  Text, 
  TouchableOpacity, 
  View, 
  LayoutAnimation, 
  Platform, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { connectionService } from '@/services/connectionService';

// Import Custom Buttons
import { GradientButton, OutlineButton } from '@/components/Connection/UI/Buttons';

// --- DATA: Categories & Sub-Interests ---
const INTERESTS_DATA = [
  { 
    id: 'arts', 
    label: 'Creative Arts', 
    icon: '🎨',
    sub: [
      { id: 'photography', label: 'Photography', icon: '📷' },
      { id: 'painting', label: 'Painting', icon: '🖼️' },
      { id: 'writing', label: 'Writing', icon: '✍️' },
      { id: 'design', label: 'Design', icon: '📐' }
    ]
  },
  { 
    id: 'sports', 
    label: 'Sports & Fitness', 
    icon: '🏃',
    sub: [
      { id: 'cricket', label: 'Cricket', icon: '🏏' },
      { id: 'football', label: 'Football', icon: '⚽' },
      { id: 'gym', label: 'Gym', icon: '💪' },
      { id: 'yoga', label: 'Yoga', icon: '🧘' },
      { id: 'running', label: 'Running', icon: '👟' },
    ]
  },
  { 
    id: 'music', 
    label: 'Music & Entertainment', 
    icon: '🎵',
    sub: [
      { id: 'concert', label: 'Concert', icon: '🎸' },
      { id: 'djing', label: 'DJing', icon: '🎧' },
      { id: 'singing', label: 'Singing', icon: '🎤' },
    ]
  },
  { 
    id: 'food', 
    label: 'Food & Cooking', 
    icon: '🍳', 
    sub: [
      { id: 'baking', label: 'Baking', icon: '🥨' },
      { id: 'food_blog', label: 'Food Blogging', icon: '📸' },
      { id: 'rest_hop', label: 'Restaurant Hopping', icon: '🍽️' },
    ] 
  },
  { 
    id: 'travel', 
    label: 'Travel & Adventure', 
    icon: '✈️', 
    sub: [
      { id: 'trekking', label: 'Trekking', icon: '🥾' },
      { id: 'road_trips', label: 'Road Trips', icon: '🛣️' },
      { id: 'backpacking', label: 'Backpacking', icon: '🎒' },
    ] 
  },
  { 
    id: 'tech', 
    label: 'Technology', 
    icon: '💻', 
    sub: [
      { id: 'coding', label: 'Coding', icon: '👨‍💻' },
      { id: 'gaming', label: 'Gaming', icon: '🎮' },
      { id: 'ai_ml', label: 'AI/ML', icon: '🤖' },
    ] 
  },
  { 
    id: 'learning', 
    label: 'Learning & Intellectual', 
    icon: '📘', 
    sub: [
      { id: 'reading', label: 'Reading', icon: '📖' },
      { id: 'science', label: 'Science', icon: '🔬' },
      { id: 'history', label: 'History', icon: '📜' },
    ] 
  },
  { 
    id: 'nature', 
    label: 'Nature & Animals', 
    icon: '🐾', 
    sub: [
      { id: 'pet_care', label: 'Pet Care', icon: '🐶' },
      { id: 'bird_watching', label: 'Bird Watching', icon: '🐦' },
      { id: 'gardening', label: 'Gardening', icon: '🌱' },
    ] 
  },
  { 
    id: 'social', 
    label: 'Social & Community', 
    icon: '🤝', 
    sub: [
      { id: 'volunteering', label: 'Volunteering', icon: '🤲' },
      { id: 'event_planning', label: 'Event Planning', icon: '📅' },
      { id: 'networking', label: 'Networking', icon: '👔' },
    ] 
  },
  { 
    id: 'wellness', 
    label: 'Wellness & Mindfulness', 
    icon: '🧘', 
    sub: [
      { id: 'meditation', label: 'Meditation', icon: '🕉️' },
      { id: 'therapy', label: 'Therapy', icon: '🗣️' },
      { id: 'self_dev', label: 'Self-Development', icon: '📚' },
    ] 
  },
  { 
    id: 'media', 
    label: 'Media & Content', 
    icon: '🎬', 
    sub: [
      { id: 'vlogging', label: 'Vlogging', icon: '📹' },
      { id: 'podcasting', label: 'Podcasting', icon: '🎙️' },
      { id: 'streaming', label: 'Streaming', icon: '📡' },
    ] 
  },
  { 
    id: 'home', 
    label: 'Home & Lifestyle', 
    icon: '🏡', 
    sub: [
      { id: 'interior', label: 'Interior Design', icon: '🛋️' },
      { id: 'diy', label: 'DIY', icon: '🔨' },
      { id: 'fashion', label: 'Fashion', icon: '👗' },
    ] 
  },
];

import Animated, { 
  FadeIn, 
  FadeOut, 
  Layout, 
  EntryAnimationsValues, 
  ExitAnimationsValues 
} from 'react-native-reanimated';

const InterestsScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Toggle Selection (Sub-Interests)
  const toggleSelection = (id: string) => {
    setHasError(false);
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Toggle Expansion (Main Categories)
  const toggleExpand = (id: string) => {
    setHasError(false);
    if (expandedIds.includes(id)) {
      setExpandedIds(expandedIds.filter(item => item !== id));
    } else {
      setExpandedIds([...expandedIds, id]);
    }
  };

  const handleNext = async () => {
    if (selectedIds.length === 0) {
      setHasError(true);
      return;
    }
    
    setIsLoading(true);
    try {
      // Map selected IDs back to categories for the backend structure
      const formattedInterests = INTERESTS_DATA.map(cat => ({
        category: cat.label,
        tags: cat.sub.filter(sub => selectedIds.includes(sub.id)).map(sub => sub.label)
      })).filter(cat => cat.tags.length > 0);

      await connectionService.updateOrCreateProfile({
        interests: formattedInterests
      });

      router.push('/(protected)/(connection)/profile-security'); 
    } catch (error) {
      console.error("API Error:", error);
      // Fallback to push to allow testing UI even if backend is not ready
      router.push('/(protected)/(connection)/profile-security');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09090b]" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View className="flex-1 px-5">
        
        {/* HEADER */}
        <View className="flex-row items-center h-[60px] mb-2.5">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1 h-1 bg-[#1c1c1e] mx-[15px] rounded-sm">
            <View className="h-full bg-white rounded-sm w-[95%]" />
          </View>
          <Text className="text-[#a8a29e] text-[13px] font-semibold">07/07</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
          
          {/* TITLE */}
          <View className="mt-2.5 mb-6">
            <Text className="text-white text-[32px] font-bold leading-tight">Add your interests</Text>
            <Text className="text-[#71717a] text-base mt-2.5">
              We ask this to help personalize your experience.
            </Text>
          </View>

          {/* CHIP CLOUD LAYOUT WITH RED ERROR BORDER */}
          <View 
            className={`flex-row flex-wrap gap-3 p-2 rounded-2xl border ${
              hasError ? 'border-red-500' : 'border-transparent'
            }`}
          >
            {INTERESTS_DATA.map((category) => {
              const isExpanded = expandedIds.includes(category.id);
              const hasSelection = category.sub.some(sub => selectedIds.includes(sub.id));

              return (
                <View key={category.id} className="flex-row flex-wrap gap-3">
                  
                  {/* MAIN CATEGORY CHIP */}
                  <TouchableOpacity
                    onPress={() => toggleExpand(category.id)}
                    activeOpacity={0.7}
                    className={`flex-row items-center pl-4 pr-5 py-3.5 rounded-full border ${
                      isExpanded || hasSelection
                        ? 'bg-[#3f3f46] border-[#52525b]' 
                        : 'bg-[#18181b] border-[#27272a]' 
                    }`}
                  >
                    <Text className="text-[18px] mr-2.5">{category.icon}</Text>
                    <Text className="text-[14px] font-medium text-[#e4e4e7]">
                      {category.label}
                    </Text>
                    {isExpanded && (
                      <View className="w-1.5 h-1.5 rounded-full bg-[#a1a1aa] ml-2" />
                    )}
                  </TouchableOpacity>

                  {/* SUB-CATEGORY CHIPS */}
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
                          className={`flex-row items-center px-4 py-3 rounded-full border ${
                            isSelected 
                              ? 'bg-[#1e1b4b] border-[#6366f1]' 
                              : 'bg-[#1c1c1e] border-[#27272a]' 
                          }`}
                        >
                          <Text className="text-[14px] mr-2">{subItem.icon}</Text>
                          <Text className={`text-[13px] font-medium ${isSelected ? 'text-white' : 'text-[#a1a1aa]'}`}>
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
            onPress={() => router.push('/(protected)/(connection)/profile-security')} 
          />
        </View>
        
        <View className="flex-1">
          {isLoading ? (
            <View className="h-[56px] justify-center items-center bg-[#1c1c1e] rounded-full">
               <ActivityIndicator color="#8b5cf6" />
            </View>
          ) : (
            <GradientButton 
              title="Next" 
              onPress={handleNext} 
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default InterestsScreen;
