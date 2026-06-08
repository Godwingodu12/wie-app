import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar, 
  Image,
  ScrollView,
  Dimensions
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const GAP = 12;
const ITEM_WIDTH = (width - 40 - GAP) / 2; // (Screen Width - Padding - Gap) / 2 columns

// --- DATA ---
const OUTING_OPTIONS = [
  { 
    id: '1', 
    label: 'Cafe/Restaurant visit', 
    image: require('@/assets/images/connection/outing_cafe.png') 
  },
  { 
    id: '2', 
    label: 'Nature Walk/Hiking', 
    image: require('@/assets/images/connection/outing_nature.png') 
  },
  { 
    id: '3', 
    label: 'Shopping/Market Visit', 
    image: require('@/assets/images/connection/outing_shopping.png') 
  },
  { 
    id: '4', 
    label: 'Museum/Gallery Visit', 
    image: require('@/assets/images/connection/outing_museum.png') 
  },
  { 
    id: '5', 
    label: 'Photography Walk', 
    image: require('@/assets/images/connection/outing_camera.png') 
  },
];

import { connectionService } from '@/services/connectionService';
import { ActivityIndicator } from 'react-native';

export default function DayOutingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleNext = async () => {
    if (!selectedId) return;
    
    setIsLoading(true);
    try {
        const selectedLabel = OUTING_OPTIONS.find(o => o.id === selectedId)?.label || '';
        await connectionService.createDayOutingPurpose({
            outingType: selectedLabel,
            status: 'draft'
        });
        router.push('/(protected)/(connection)/WhenPlanningForOutingScreen'); 
    } catch (e) {
        console.error("Error saving day outing", e);
        router.push('/(protected)/(connection)/WhenPlanningForOutingScreen'); 
    } finally {
        setIsLoading(false);
    }
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
            <View className="h-full bg-white w-[28%] rounded-full" />
          </View>
          
          <Text className="text-[#78716c] text-[13px] font-semibold">02/07</Text>
        </View>

        {/* TITLE */}
        <View className="px-5 mt-2 mb-6">
            <Text className="text-white text-[28px] font-bold leading-tight">
              What kind of day outing are{"\n"}you planning?
            </Text>
        </View>

        {/* GRID CONTENT */}
        <ScrollView 
            contentContainerStyle={{ 
                paddingHorizontal: 20, 
                paddingBottom: 120 // Extra space for footer
            }}
            showsVerticalScrollIndicator={false}
        >
            <View className="flex-row flex-wrap justify-between" style={{ gap: GAP }}>
                {OUTING_OPTIONS.map((item) => {
                    const isSelected = selectedId === item.id;
                    return (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => handleSelect(item.id)}
                            activeOpacity={0.9}
                            style={{ width: ITEM_WIDTH, height: ITEM_WIDTH }}
                            className={`rounded-2xl justify-center items-center p-3 border transition-all ${
                                isSelected 
                                    ? 'bg-[#f4f4f5] border-white' // Selected: Light BG
                                    : 'bg-[#18181b] border-[#27272a]' // Unselected: Dark BG
                            }`}
                        >
                            {/* Icon Image */}
                            <Image 
                                source={item.image}
                                style={{ 
                                    width: '60%', 
                                    height: '60%', 
                                    resizeMode: 'contain', 
                                    marginBottom: 12 
                                }}
                            />
                            
                            {/* Label */}
                            <Text 
                                className={`text-[13px] font-medium text-center leading-4 ${
                                    isSelected ? 'text-black' : 'text-[#d4d4d8]'
                                }`}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>

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
