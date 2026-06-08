import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar, 
  Image,
  Dimensions
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const GAP = 16;
// Calculate width for 2 columns with padding and gap
const ITEM_WIDTH = (width - 40 - GAP) / 2; 

// --- DATA ---
const COMPANION_OPTIONS = [
  { 
    id: '1', 
    title: 'Group of Peoples', 
    subtitle: '4+ member',
    // Make sure this image exists in your assets folder
    image: require('@/assets/images/connection/group_people.png') 
  },
  { 
    id: '2', 
    title: 'Single person', 
    subtitle: 'Find one travel buddy',
    // Make sure this image exists in your assets folder
    image: require('@/assets/images/connection/single_person.png') 
  },
];

export default function OutingGroupSingleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | null>('1'); // Default select first

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleNext = () => {
    console.log("Selected Companion:", selectedId);
    router.push('/(protected)/(connection)/OutingGroupSelectionScreen'); 
  };

  return (
    <View className="flex-1 bg-[#09090b]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View className="flex-1" style={{ paddingTop: insets.top }}>
        
        {/* HEADER */}
        <View className="flex-row items-center h-[60px] px-5 mb-2">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          {/* Progress Bar */}
          <View className="flex-1 h-1 bg-[#27272a] mx-4 rounded-full overflow-hidden">
            <View className="h-full bg-white w-[42%] rounded-full" />
          </View>
          
          <Text className="text-[#78716c] text-[13px] font-semibold">02/07</Text>
        </View>

        {/* TITLE */}
        <View className="px-5 mt-2 mb-10">
            <Text className="text-white text-[28px] font-bold leading-tight">
              Who would you like to go{"\n"}with?
            </Text>
        </View>

        {/* CARDS CONTAINER */}
        <View className="px-5 flex-row justify-between" style={{ gap: GAP }}>
            {COMPANION_OPTIONS.map((item) => {
                const isSelected = selectedId === item.id;
                return (
                    <TouchableOpacity
                        key={item.id}
                        onPress={() => handleSelect(item.id)}
                        activeOpacity={0.9}
                        style={{ width: ITEM_WIDTH, height: ITEM_WIDTH * 1.3 }} // Taller aspect ratio
                        className={`rounded-3xl justify-center items-center p-4 border transition-all ${
                            isSelected 
                                ? 'bg-[#f4f4f5] border-transparent' // Selected: White BG
                                : 'bg-[#18181b] border-[#27272a]'   // Unselected: Dark BG
                        }`}
                    >
                        {/* Image */}
                        <Image 
                            source={item.image}
                            style={{ 
                                width: '80%', 
                                height: '50%', 
                                resizeMode: 'contain', 
                                marginBottom: 20 
                            }}
                        />
                        
                        {/* Title */}
                        <Text 
                            className={`text-[15px] font-bold text-center mb-1 ${
                                isSelected ? 'text-black' : 'text-[#e4e4e7]'
                            }`}
                        >
                            {item.title}
                        </Text>

                        {/* Subtitle */}
                        <Text 
                            className={`text-[12px] font-medium text-center ${
                                isSelected ? 'text-[#52525b]' : 'text-[#71717a]'
                            }`}
                        >
                            {item.subtitle}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>

        {/* FOOTER BUTTONS */}
        <View
            className="absolute bottom-0 w-full px-5 pt-4 pb-8 flex-row justify-between items-center gap-4 bg-[#09090b]"
            style={{ paddingBottom: insets.bottom > 20 ? insets.bottom : 20 }}
        >
            {/* Skip Button */}
            <TouchableOpacity
                onPress={() => router.push('/(protected)/(tabs)')}
                className="flex-1 h-[54px] justify-center items-center rounded-full border border-[#3f3f46] bg-[#18181b]"
            >
                <Text className="text-white font-semibold text-[16px]">Skip</Text>
            </TouchableOpacity>

            {/* Next Button (Gradient) */}
            <TouchableOpacity
                onPress={handleNext}
                className="flex-1 h-[54px] rounded-full overflow-hidden"
            >
                 <LinearGradient
                    colors={['#A855F7', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                 >
                    <Text className="text-white font-bold text-[16px]">Next</Text>
                 </LinearGradient>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
