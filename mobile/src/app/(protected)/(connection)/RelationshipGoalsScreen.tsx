import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Image 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientButton } from '@/components/Connection/UI/Buttons'; 

// --- DATA WITH PICTURE NAMES ---
const RELATIONSHIP_OPTIONS = [
  { 
    id: 'long_term', 
    label: 'Long-term Relationship', 
    desc: 'Serious commitment with future plans',
    // 👇 PICTURE NAME 1: Save your heart icon as 'heart.png' in assets/images
    image: require('@/assets/images/connection/heart.png'), 
  },
  { 
    id: 'fling', 
    label: 'Fling', 
    desc: 'Short-term, fun connection',
    // 👇 PICTURE NAME 2: Save your sparkle icon as 'sparkles.png'
    image: require('@/assets/images/connection/sparkles.png'),
  },
  { 
    id: 'feelings', 
    label: 'We will see the feelings', 
    desc: 'Hopeful romantic, open to possibilities',
    // 👇 PICTURE NAME 3: Save your moon icon as 'moon.png'
    image: require('@/assets/images/connection/moon.png'),
  },
  { 
    id: 'fwb', 
    label: 'Friends with benefits', 
    desc: 'Casual connection without labels',
    // 👇 PICTURE NAME 4: Save your chat icon as 'chat.png'
    image: require('@/assets/images/connection/chat.png'),
  },
];

import { connectionService } from '@/services/connectionService';
import { ActivityIndicator } from 'react-native';

export default function RelationshipGoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    if (!selectedGoal) return;
    
    setIsLoading(true);
    try {
        await connectionService.createRelationshipPurpose({
            goal: selectedGoal,
            status: 'draft' // Mark as draft until last step
        });
        router.push('/(protected)/(connection)/RelationshipHistoryScreen'); 
    } catch (e) {
        console.error("Error saving relationship goal", e);
        router.push('/(protected)/(connection)/RelationshipHistoryScreen');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#09090b]" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View className="flex-row items-center h-[60px] px-5 mb-2">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        
        {/* Progress Bar */}
        <View className="flex-1 h-1 bg-[#1c1c1e] mx-4 rounded-full">
          <View className="h-full bg-white w-[28%] rounded-full" />
        </View>
        <Text className="text-[#a8a29e] text-[13px] font-semibold">02/07</Text>
      </View>

      {/* CONTENT */}
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-white text-[28px] font-bold mt-2 mb-8 leading-tight">
          What kind of relationship are you looking for?
        </Text>

        {/* CARDS LIST */}
        <View className="gap-4">
          {RELATIONSHIP_OPTIONS.map((item) => {
            const isSelected = selectedGoal === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedGoal(item.id)}
                activeOpacity={0.9}
                className={`w-full items-center justify-center py-6 px-4 rounded-[20px] border ${
                  isSelected 
                    ? 'bg-[#E1E1E6] border-white' // Selected style (Light)
                    : 'bg-[#1C1C1E] border-[#2A2A2D]' // Default style (Dark)
                }`}
              >
                {/* PICTURE RENDERING */}
                <Image 
                  source={item.image}
                  style={{ width: 40, height: 40, marginBottom: 12, resizeMode: 'contain' }}
                />

                {/* Title */}
                <Text className={`text-[16px] font-bold mb-1 text-center ${
                    isSelected ? 'text-black' : 'text-white'
                }`}>
                  {item.label}
                </Text>

                {/* Description */}
                <Text className={`text-[12px] text-center ${
                    isSelected ? 'text-[#555]' : 'text-[#888]'
                }`}>
                  {item.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-[#09090b] px-5 border-t border-[#1c1c1e]"
        style={{ 
            paddingTop: 16,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 30 
        }}
      >
         {isLoading ? (
             <View className="h-[56px] justify-center items-center bg-[#1c1c1e] rounded-full">
                 <ActivityIndicator color="#8b5cf6" />
             </View>
         ) : (
            <GradientButton title="Next" onPress={handleNext} />
         )}
      </View>
    </View>
  );
}
