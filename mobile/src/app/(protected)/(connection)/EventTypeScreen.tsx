import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar, 
  ScrollView 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// --- DATA ---
const EVENT_TYPES = [
  { id: '1', label: 'Music', icon: '🎸' },
  { id: '2', label: 'Sports', icon: '🏃' },
  { id: '3', label: 'Tech Fest', icon: '💻' },
  { id: '4', label: 'Cultural', icon: '🎭' },
  { id: '5', label: 'Art & Design', icon: '🎨' },
  { id: '6', label: 'Literary', icon: '📚' },
  { id: '7', label: 'Food & Drink', icon: '🍳' },
  { id: '8', label: 'Gaming', icon: '🎮' },
  { id: '9', label: 'Fitness & Wellness', icon: '🧘' },
];

import { connectionService } from '@/services/connectionService';
import { ActivityIndicator } from 'react-native';

export default function EventTypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // State to track selected tags (Multi-select)
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSelection = (id: string) => {
    if (selectedEvents.includes(id)) {
      setSelectedEvents(selectedEvents.filter(item => item !== id));
    } else {
      setSelectedEvents([...selectedEvents, id]);
    }
  };

  const handleNext = async () => {
    if (selectedEvents.length === 0) return;
    
    setIsLoading(true);
    try {
        const selectedLabels = EVENT_TYPES
            .filter(item => selectedEvents.includes(item.id))
            .map(item => item.label);

        await connectionService.createConcertPurpose({
            eventTypes: selectedLabels,
            status: 'draft'
        });
        router.push('/(protected)/(connection)/UpcomingEventScreen'); 
    } catch (e) {
        console.error("Error saving event types", e);
        router.push('/(protected)/(connection)/UpcomingEventScreen'); 
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <View className="flex-1 bg-[#09090b]">
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />
        
        {/* --- HEADER --- */}
        <View className="flex-row items-center h-[60px] px-5 mb-2">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1 h-1 bg-[#27272a] mx-4 rounded-full overflow-hidden">
            <View className="h-full bg-white w-[28%] rounded-full" />
          </View>
          <Text className="text-[#78716c] text-[13px] font-semibold">02/07</Text>
        </View>

        {/* --- CONTENT --- */}
        <View className="px-5 mt-2 mb-6">
            <Text className="text-white text-[28px] font-bold leading-tight">
              Which type of events do you enjoy?
            </Text>
        </View>

        <ScrollView 
          className="flex-1 px-5" 
          contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}
        >
          {EVENT_TYPES.map((item) => {
            const isSelected = selectedEvents.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => toggleSelection(item.id)}
                activeOpacity={0.7}
                // Changed rounded-2xl to rounded-full for pill shape
                className={`flex-row items-center px-5 py-4 rounded-full border ${
                  isSelected 
                    ? 'bg-[#2e2e30] border-[#8b5cf6]' 
                    : 'bg-[#161618] border-[#27272a]'
                }`}
              >
                <Text className="text-[18px] mr-2">{item.icon}</Text>
                <Text className={`font-medium text-[15px] ${isSelected ? 'text-white' : 'text-[#a1a1aa]'}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* --- FOOTER BUTTONS --- */}
        <View className="px-5 mb-10 flex-row justify-between items-center gap-4 pt-4">
            {/* Skip Button */}
            <TouchableOpacity 
                onPress={() => router.push('/(protected)/(tabs)')}
                className="flex-1 py-4 rounded-full border border-[#3f3f46] items-center justify-center bg-[#18181b]"
            >
                <Text className="text-white font-semibold text-[16px]">Skip</Text>
            </TouchableOpacity>

            {/* Next Button (Gradient) */}
            <TouchableOpacity 
                onPress={handleNext}
                className="flex-1 h-[58px] rounded-full overflow-hidden"
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
