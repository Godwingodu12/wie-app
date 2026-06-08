import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Custom Components 
import { ConnectionCard } from '@/components/Connection/UI/ConnectionCard'; 
import { GradientButton } from '@/components/Connection/UI/Buttons'; 
import { connectionService } from '@/services/connectionService';

const ConnectionScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Load saved selection on mount
  useEffect(() => {
    const loadSelection = async () => {
      try {
        const savedSelection = await AsyncStorage.getItem('user_connection_type');
        if (savedSelection) {
          setSelectedType(savedSelection);
        }
      } catch (e) {
        console.error("Failed to load connection selection", e);
      }
    };
    loadSelection();
  }, []);

  // 2. TOGGLE SELECTION HANDLER
  const handleToggleSelection = async (type: string) => {
    const newSelection = selectedType === type ? null : type;
    setSelectedType(newSelection);

    try {
      if (newSelection) {
        await AsyncStorage.setItem('user_connection_type', newSelection);
      } else {
        await AsyncStorage.removeItem('user_connection_type');
      }
    } catch (e) {
      console.error("Failed to update selection", e);
    }
  };

  const handleNext = async () => {
    if (!selectedType) return;

    setIsLoading(true);
    try {
      // Progress roadmap to step 3
      await AsyncStorage.setItem('travel_step_reached', '3');
      
      // Map frontend type to backend enum
      const companionType = selectedType === 'single' ? 'single-person' : 
                            selectedType === 'two' ? 'two-person' : 'group';

      // We'll create a travel purpose draft
      try {
        const profile = await connectionService.getProfile();
        if (profile && profile.data) {
           await connectionService.createTravelPurpose({
             connectionProfileId: profile.data._id,
             hasSpecificDestination: false,
             companionType: companionType,
             destinations: []
           });
        }
      } catch (err) {
        console.error("Failed to save travel purpose to backend:", err);
        // We don't block the user flow if the purpose save fails in development
      }

      router.push('/(protected)/(connection)/GroupSelectionScreen'); 
    } catch (e) {
      console.error("Failed to save roadmap progress", e);
      router.push('/(protected)/(connection)/GroupSelectionScreen'); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09090b]" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View className="flex-1">
        
        {/* HEADER */}
        <View className="flex-row items-center h-[60px] px-5 mb-2 shrink-0">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View className="flex-1 h-1 bg-[#1c1c1e] mx-[15px] rounded-sm">
            <View className="h-full bg-white rounded-sm w-[42%]" />
          </View>
          <Text className="text-[#a8a29e] text-[13px] font-semibold">03/07</Text>
        </View>

        <ScrollView 
          className="flex-1 px-5" 
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <View className="my-5 mb-8">
            <Text className="text-white text-[28px] font-bold leading-9">
              What type of travel connection are you looking for?
            </Text>
          </View>

          {/* --- CARDS LAYOUT --- */}
          <View className="gap-y-4">
            <View className="flex-row justify-between">
              <ConnectionCard
                title="Group of Peoples"
                subtitle="4+ member"
                isSelected={selectedType === 'group'}
                onPress={() => handleToggleSelection('group')} 
                imageSource={require('@/assets/images/connection/group.png')}
              />

              <ConnectionCard
                title="Single person"
                subtitle="Find one travel buddy"
                isSelected={selectedType === 'single'}
                onPress={() => handleToggleSelection('single')} 
                imageSource={require('@/assets/images/connection/single.png')}
              />
            </View>

            <View className="items-center w-full">
                <ConnectionCard
                  title="Two person"
                  subtitle="Join an existing duo"
                  isSelected={selectedType === 'two'}
                  onPress={() => handleToggleSelection('two')} 
                  imageSource={require('@/assets/images/connection/two.png')}
                />
            </View>
          </View>

        </ScrollView>

        <View 
          className="bg-black pt-2 px-5" 
          style={{ paddingBottom: insets.bottom + 20 }}
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
    </SafeAreaView>
  );
};

export default ConnectionScreen;
