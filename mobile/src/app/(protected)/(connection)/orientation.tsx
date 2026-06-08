import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import your custom buttons
import { GradientButton, OutlineButton } from '@/components/Connection/UI/Buttons';

import { connectionService } from '@/services/connectionService';
import { ActivityIndicator } from 'react-native';

const OrientationScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const options = [
    { 
      id: 'straight', 
      label: 'Straight', 
      image: require('@/assets/images/connection/straight.png') 
    },
    { 
      id: 'gay', 
      label: 'Gay', 
      image: require('@/assets/images/connection/gay.png') 
    },
    { 
      id: 'lesbian', 
      label: 'Lesbian', 
      image: require('@/assets/images/connection/lesbian.png') 
    },
  ];

  const handleSelect = (id: string) => {
    if (selected === id) {
      setSelected(null);
    } else {
      setSelected(id);
    }
  };

  const handleNext = async () => {
    if (!selected) {
        router.push('/(protected)/(connection)/interests');
        return;
    }

    setIsLoading(true);
    try {
        await connectionService.updateOrCreateProfile({
            sexualOrientation: {
                type: selected.toLowerCase(),
                private: false
            }
        });
        router.push('/(protected)/(connection)/interests');
    } catch (e) {
        console.error("Error saving orientation", e);
        router.push('/(protected)/(connection)/interests');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#09090b]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View style={{ paddingTop: insets.top }} className="flex-1 px-6">
        
        {/* HEADER */}
        <View className="flex-row items-center h-[60px] mb-2.5">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1 h-1 bg-[#1c1c1e] mx-[15px] rounded-sm">
            <View className="h-full bg-white rounded-sm w-[28%]" />
          </View>
          <Text className="text-[#a8a29e] text-[13px] font-semibold">02/07</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="mt-5 mb-[30px]">
            <Text className="text-white text-[32px] font-bold leading-10">How do you describe your sexual orientation?</Text>
            <Text className="text-[#71717a] text-base mt-3 leading-6">
              We ask this to help personalize your experience. 
              <Text className="text-[#ca8a04]"> This information is not visible for others.</Text>
            </Text>
          </View>

          {/* OPTIONS GRID */}
          <View className="flex-row flex-wrap justify-center gap-4">
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                activeOpacity={0.8}
                onPress={() => handleSelect(option.id)}
                className={`w-[45%] h-[150px] rounded-3xl justify-center items-center p-2.5 ${
                  selected === option.id ? 'bg-[#f4f4f5]' : 'bg-[#18181b]'
                }`}
              >
                <Image 
                  source={option.image} 
                  className="w-[70px] h-[70px] mb-3"
                  resizeMode="contain" 
                />
                <Text 
                  className={`text-base font-semibold ${
                    selected === option.id ? 'text-black' : 'text-[#a1a1aa]'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
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
            onPress={() => router.push('/(protected)/(connection)/interests')} 
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
    </View>
  );
};

export default OrientationScreen;
