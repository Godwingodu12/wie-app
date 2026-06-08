import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 👇 Imports your existing components
import GroupCard from '@/components/Connection/GroupCard'; 
import { GradientButton } from '@/components/Connection/UI/Buttons'; 

import { connectionService } from '@/services/connectionService';
import { ActivityIndicator } from 'react-native';

export default function WhoLookingForScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // 🔥 1. Start with null so no card is selected by default
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 🔥 2. Toggle Function: If the same ID is clicked, set to null (unselect)
  const handleSelect = (id: string) => {
    setSelected(prev => (prev === id ? null : id));
  };

  const handleNext = async () => {
    // Prevent moving forward if nothing is selected (Optional)
    if (!selected) return; 

    setIsLoading(true);
    try {
      // Save selection if needed and update roadmap progress
      await connectionService.createLocationPurpose({
        whoLookingFor: selected,
        status: 'draft'
      });
      await AsyncStorage.setItem('user_looking_for', selected);
      
      router.push('/(protected)/(connection)/LocationReasonScreen'); 
    } catch (e) {
      console.error(e);
      router.push('/(protected)/(connection)/LocationReasonScreen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#09090b]" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View className="flex-row items-center h-[60px] px-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        
        {/* Progress Bar */}
        <View className="flex-1 h-1 bg-[#1c1c1e] mx-4 rounded-full">
          <View className="h-full bg-white w-[14%] rounded-full" />
        </View>
        <Text className="text-[#a8a29e] text-[13px] font-semibold">01/07</Text>
      </View>

      {/* CONTENT */}
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-white text-[28px] font-bold my-6 leading-tight">
          Who are you looking for?
        </Text>

        {/* GRID LAYOUT */}
        <View className="flex-row flex-wrap justify-between">
          
          <GroupCard 
            id="boys"
            title="Boys"
            subtitle="Looking to connect with boys"
            isSelected={selected === 'boys'}
            onPress={(id) => handleSelect(id)} // 🔥 Using toggle function
            imageSource={require('@/assets/images/connection/boys.png')} 
          />

          <GroupCard 
            id="girls"
            title="Girls"
            subtitle="Looking to connect with girls"
            isSelected={selected === 'girls'}
            onPress={(id) => handleSelect(id)} // 🔥 Using toggle function
            imageSource={require('@/assets/images/connection/girls.png')} 
          />

          <View className="w-full items-center mt-2">
            <GroupCard 
              id="mixed"
              title="Mixed"
              subtitle="Open to meeting anyone"
              isSelected={selected === 'mixed'}
              onPress={(id) => handleSelect(id)} // 🔥 Using toggle function
              imageSource={require('@/assets/images/connection/mixed.png')} 
            />
          </View>

        </View>
      </ScrollView>

      {/* FOOTER BUTTON */}
      <View 
        className="bg-transparent pt-2 px-5 absolute bottom-0 left-0 right-0"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
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
  );
}
