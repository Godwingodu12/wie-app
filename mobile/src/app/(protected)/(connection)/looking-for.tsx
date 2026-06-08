import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const LOOKING_FOR_OPTIONS = [
  { id: 'travel', label: 'Travel', image: require('@/assets/images/connection/travel.png') }, 
  { id: 'relationship', label: 'Relationship', image: require('@/assets/images/connection/relationship.png') },
  { id: 'location', label: 'Location matching', image: require('@/assets/images/connection/location.png') },
  { id: 'professional', label: 'Professional', image: require('@/assets/images/connection/professional.png') },
  { id: 'concert', label: 'Concert Vibing', image: require('@/assets/images/connection/concert.png') },
  { id: 'skill', label: 'Develop Skill', image: require('@/assets/images/connection/skill.png') },
  { id: 'outing', label: 'Day Outing', image: require('@/assets/images/connection/outing.png') },
];

const LookingForScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null); // 🔥 Added for red validation

  const handleToggleSelect = (id: string) => {
    setError(null); // Clear error when user interacts
    if (selectedId === id) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
    }
  };

  const handleNext = () => {
    if (!selectedId) {
      setError("Please select one option to continue"); // 🔥 Red validation message
      return;
    }

    switch (selectedId) {
      case 'travel': router.push('/(protected)/(connection)/looking-for-travel'); break;
      case 'relationship': router.push('/(protected)/(connection)/RelationshipGoalsScreen'); break;
      case 'location': router.push('/(protected)/(connection)/WhoLookingForScreen'); break;
      case 'professional': router.push('/(protected)/(connection)/BusinessConnectionScreen'); break;
      case 'concert': router.push('/(protected)/(connection)/EventTypeScreen'); break;
      case 'skill': router.push('/(protected)/(connection)/DevelopSkillScreen'); break;
      case 'outing': router.push('/(protected)/(connection)/DayOutingScreen'); break;
      default: router.push('/(protected)/(tabs)'); break;
    }
  };

  return (
    <View className="flex-1 bg-[#09090b]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View style={{ paddingTop: insets.top }} className="flex-1 px-5">
        <View className="flex-row items-center h-[60px] mb-2.5">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="mt-2.5 mb-8">
            <Text className="text-white text-[32px] font-bold leading-tight">
              Right now i&apos;m{"\n"}Looking for...
            </Text>
            <Text className="text-[#71717a] text-base mt-2.5">
              Increase the compatibility by sharing yours!.
            </Text>
          </View>

          <View className="flex-row flex-wrap justify-between gap-y-4">
            {LOOKING_FOR_OPTIONS.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleToggleSelect(item.id)}
                  activeOpacity={0.9}
                  className={`w-[48%] h-[110px] rounded-3xl items-center justify-center p-3 border ${
                    isSelected ? 'bg-white border-white' : 'bg-[#161618] border-[#27272a]'
                  }`}
                >
                  <Image source={item.image} className="w-10 h-10 mb-2" resizeMode="contain" />
                  <Text className={`text-[13px] font-medium text-center ${isSelected ? 'text-black' : 'text-[#a1a1aa]'}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 🔥 RED VALIDATION ERROR (Matches previous pages) */}
          {error && (
            <View className="mt-6 items-center">
              <Text className="text-[#ef4444] text-sm font-medium">{error}</Text>
            </View>
          )}

        </ScrollView>
      </View>

      <View 
        className="px-5 bg-[#09090b] pt-2.5 pb-5 absolute bottom-0 w-full"
        style={{ paddingBottom: insets.bottom + 10 }}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={handleNext} className="w-full">
          <LinearGradient
            colors={['#8b5cf6', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 9999, height: 56, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text className="text-white text-lg font-bold tracking-wide">Next</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LookingForScreen;
