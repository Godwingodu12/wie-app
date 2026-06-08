import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 👇 verify this path matches your project structure
import { GradientButton } from '@/components/Connection/UI/Buttons';

// --- types ---
interface OptionCardProps {
  title: string;
  subtitle: string;
  isSelected: boolean;
  onPress: () => void;
}

// --- internal component: option card ---
const OptionCard = ({ title, subtitle, isSelected, onPress }: OptionCardProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    className={`w-full h-[90px] rounded-[22px] mb-4 border justify-center px-4 ${
      isSelected 
        ? 'bg-white border-white' 
        : 'bg-[#161618] border-[#27272a]'
    }`}
  >
    <Text className={`text-[18px] font-bold text-center mb-1 ${
      isSelected ? 'text-black' : 'text-white'
    }`}>
      {title}
    </Text>
    
    <Text 
      numberOfLines={1}
      className={`text-[8px] text-center tracking-wide ${
        isSelected ? 'text-[#3f3f46]' : 'text-[#71717a]'
      }`}
    >
      {subtitle}
    </Text>
  </TouchableOpacity>
);

export default function PersonNearLocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // 🔥 1. Initialized as null so nothing is selected on first load
  const [selected, setSelected] = useState<string | null>(null);

  // 🔥 2. Toggle logic: if same item is clicked, set to null
  const handleSelect = (id: string) => {
    setSelected(prev => (prev === id ? null : id));
  };

  const handleNext = () => {
    // Optional: Only navigate if something is selected
    if (selected) {
      router.push('/(protected)/(connection)/ActivitySelectionScreen');
    }
  };

  return (
    <View className="flex-1 bg-[#09090b]" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* header */}
      <View className="flex-row items-center h-[60px] px-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View className="flex-1 h-[2px] bg-[#1c1c1e] mx-4 rounded-full overflow-hidden">
          <View className="h-full bg-white w-[28%] rounded-full" />
        </View>
        
        <Text className="text-[#a8a29e] text-[13px] font-medium">02/07</Text>
      </View>

      {/* content */}
      <View className="flex-1 px-5 mt-6">
        <Text className="text-white text-[18px] font-semibold leading-tight mb-10">
          Is that person near your location right{"\n"} now?
        </Text>

        <View className="w-full">
          <OptionCard
            title="Yes"
            subtitle="They should be within 1-5 km of you"
            isSelected={selected === 'yes'}
            onPress={() => handleSelect('yes')}
          />

          <OptionCard
            title="No"
            subtitle="They can be anywhere in my city/region"
            isSelected={selected === 'no'}
            onPress={() => handleSelect('no')}
          />

          <OptionCard
            title="Maybe"
            subtitle="They can be anywhere flexible on distance in my city/region"
            isSelected={selected === 'maybe'}
            onPress={() => handleSelect('maybe')}
          />
        </View>
      </View>

      {/* footer buttons */}
      <View 
        className="px-5 flex-row justify-between items-center mb-4"
        style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 30 }}
      >
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="flex-1 mr-2 h-[56px] justify-center items-center rounded-full border border-[#27272a] bg-transparent"
        >
          <Text className="text-white text-[16px] font-semibold">Skip</Text>
        </TouchableOpacity>
        
        <View className="flex-1 ml-2 h-[56px]">
          {/* You might want to pass an 'isActive' or 'disabled' prop to the GradientButton based on 'selected' */}
          <GradientButton title="Next" onPress={handleNext} />
        </View>
      </View>
    </View>
  );
}
