import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientButton } from '@/components/Connection/UI/Buttons'; 
import { YearsCard } from '@/components/Connection/UI/YearsCard'; 

export default function RelationshipDurationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // 🔥 1. Start with no default selection
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);

  // 🔥 2. Toggle logic: If they click the same option, it unselects it. Otherwise, it selects the new one.
  const handleToggle = (value: string) => {
    setSelectedDuration(prev => prev === value ? null : value);
  };

  const handleNext = () => {
    if (!selectedDuration) return; // Will not navigate if nothing is selected
    router.push('/(protected)/(connection)/RelationshipStageScreen'); 
  };

  const handleSkip = () => {
    router.push('/(protected)/(connection)/RelationshipStageScreen');
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
        
        <View className="flex-1 h-1 bg-[#1c1c1e] mx-4 rounded-full">
          <View className="h-full bg-white w-[28%] rounded-full" />
        </View>
        <Text className="text-[#a8a29e] text-[13px] font-semibold">02/07</Text>
      </View>

      {/* CONTENT */}
      <View className="px-5 flex-1">
        <Text className="text-white text-[28px] font-bold mt-2 mb-8 leading-tight">
          Duration of your previous relationship?
        </Text>

        {/* GRID LAYOUT - Subtitles Removed */}
        <View className="flex-row flex-wrap justify-between gap-y-4">
            
          <YearsCard 
              title="0-1 year"
              isSelected={selectedDuration === '0-1'}
              onSelect={() => handleToggle('0-1')}
          />

          <YearsCard 
              title="1-2 years"
              isSelected={selectedDuration === '1-2'}
              onSelect={() => handleToggle('1-2')}
          />

          <YearsCard 
              title="2-3 years"
              isSelected={selectedDuration === '2-3'}
              onSelect={() => handleToggle('2-3')}
          />

          <YearsCard 
              title="3+ years"
              isSelected={selectedDuration === '3+'}
              onSelect={() => handleToggle('3+')}
          />

        </View>
      </View>

      {/* FOOTER */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-[#09090b] px-5 border-t border-[#1c1c1e]"
        style={{ 
            paddingTop: 16,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 30 
        }}
      >
        <View className="flex-row justify-between items-center">
          <TouchableOpacity 
            onPress={handleSkip}
            className="flex-1 mr-3 h-[54px] justify-center items-center rounded-full border border-[#333]"
          >
            <Text className="text-white text-[16px] font-semibold">Skip</Text>
          </TouchableOpacity>

          <View className="flex-1 ml-3 h-[54px]">
             <GradientButton title="Next" onPress={handleNext} />
          </View>
        </View>
      </View>
    </View>
  );
}
