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

// 👇 Import your Buttons
import { GradientButton } from '@/components/Connection/UI/Buttons'; 
// 👇 Import the NEW Component
import { YesNoCard } from '@/components/Connection/UI/YesNoCard'; 

export default function RelationshipHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // State: 'yes' or 'no'
  const [hasRelationship, setHasRelationship] = useState<string | null>(null);

  const handleNext = () => {
    if (!hasRelationship) return;
    
    console.log("History:", hasRelationship);
    // 👇 Navigate to the Interests page
    router.push('/(protected)/(connection)/RelationshipDurationScreen'); 
  };

  const handleSkip = () => {
    router.push('/(protected)/(connection)/RelationshipDurationScreen');
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
        
        {/* Progress Bar (Step 3/7) */}
        <View className="flex-1 h-1 bg-[#1c1c1e] mx-4 rounded-full">
          <View className="h-full bg-white w-[42%] rounded-full" />
        </View>
        <Text className="text-[#a8a29e] text-[13px] font-semibold">03/07</Text>
      </View>

      {/* CONTENT */}
      <View className="px-5 flex-1">
        <Text className="text-white text-[28px] font-bold mt-2 mb-8 leading-tight">
          Have you had any relationship before?
        </Text>

        {/* 👇 USING THE COMPONENT */}
        <View className="flex-row justify-between">
            <YesNoCard 
                label="Yes" 
                imageSource={require('@/assets/images/connection/yes_option.png')}
                isSelected={hasRelationship === 'yes'}
                onSelect={() => setHasRelationship('yes')}
            />
            <YesNoCard 
                label="No" 
                imageSource={require('@/assets/images/connection/no_option.png')}
                isSelected={hasRelationship === 'no'}
                onSelect={() => setHasRelationship('no')}
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
