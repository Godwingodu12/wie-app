import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GradientButton } from '@/components/Connection/UI/Buttons'; 
import { connectionService } from '@/services/connectionService';

const TRAVEL_ROWS = [
  [
    { id: 'budget', label: 'Budget Backpacking', icon: 'bag-personal', color: '#7d5fff', flex: 1 },
    { id: 'hotel', label: 'Comfortable Hotels', icon: 'office-building', color: '#fbc531', flex: 1 }
  ],
  [
    { id: 'camping', label: 'Camping & Outdoors', icon: 'tent', color: '#ff6b81', flex: 1 },
    { id: 'photo', label: 'Photography-focused', icon: 'camera', color: '#ff4757', flex: 1 }
  ],
  [
    { id: 'food', label: 'Food & Culinary', icon: 'silverware-variant', color: '#ff7f50', flex: 0.8 }, 
    { id: 'history', label: 'Historical & Cultural', icon: 'bank', color: '#e1b12c', flex: 1.2 } 
  ],
  [
    { id: 'beach', label: 'Beach & Relaxation', icon: 'lighthouse', color: '#fd79a8', flex: 1 },
    { id: 'adventure', label: 'Adventure & Sports', icon: 'airballoon', color: '#ff3f34', flex: 1 }
  ],
  [
    { id: 'party', label: 'Nightlife & Parties', icon: 'party-popper', color: '#f1c40f', flex: 1.15 },
    { id: 'wellness', label: 'Wellness & Retreat', icon: 'meditation', color: '#ffa502', flex: 0.85 }
  ]
];

export default function TravelStyleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSelection = (id: string) => {
    if (selectedStyles.includes(id)) {
      setSelectedStyles(selectedStyles.filter(item => item !== id));
    } else {
      setSelectedStyles([...selectedStyles, id]);
    }
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      const profile = await connectionService.getProfile();
      if (profile && profile.data) {
         // Update travel purpose styles (placeholder for more complex logic)
      }
      await AsyncStorage.setItem('user_travel_styles', JSON.stringify(selectedStyles));
      router.push('/(protected)/(connection)/ConnectionsScreen'); 
    } catch (err) {
      console.error("Failed to save travel styles", err);
      router.push('/(protected)/(connection)/ConnectionsScreen'); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09090b]" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View className="flex-row items-center h-[60px] px-4 mb-2">
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View className="flex-1 h-1 bg-[#1c1c1e] mx-4 rounded-full">
          <View className="h-full bg-white w-[42%] rounded-full" />
        </View>
        <Text className="text-[#a8a29e] text-[13px] font-semibold">03/07</Text>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-white text-[28px] font-bold mt-2 mb-2">
          What&apos;s your travel style?
        </Text>
        <Text className="text-[#888] text-[14px] mb-8 leading-5">
          We ask this to help personalize your travel experience.
        </Text>

        <View className="gap-2.5">
          {TRAVEL_ROWS.map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row gap-2.5">
              {row.map((item) => {
                const isSelected = selectedStyles.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleSelection(item.id)}
                    activeOpacity={0.8}
                    style={{ flex: item.flex }} 
                    className={`flex-row items-center px-3 h-[52px] rounded-full border ${
                      isSelected 
                        ? 'bg-[#1C1C1E] border-[#8A2BE2]' 
                        : 'bg-[#1C1C1E] border-transparent'
                    }`}
                  >
                    <MaterialCommunityIcons 
                      name={item.icon as any} 
                      size={18}
                      color={item.color} 
                      style={{ marginRight: 6 }} 
                    />
                    
                    <Text 
                      className="text-white text-[11px] font-medium flex-1" 
                      numberOfLines={1} 
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.75}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View 
        className="absolute bottom-0 left-0 right-0 bg-[#09090b] px-4"
        style={{ 
            paddingTop: 16,
            paddingBottom: insets.bottom + 20 
        }}
      >
        <View className="flex-row justify-between items-center">
          <TouchableOpacity 
            className="flex-1 mr-3 h-[54px] justify-center items-center rounded-full border border-[#333]"
            onPress={() => router.push('/(protected)/(connection)/ConnectionsScreen')}
          >
            <Text className="text-white text-[16px] font-semibold">Skip</Text>
          </TouchableOpacity>

          <View className="flex-1 ml-3 h-[54px]">
             {isLoading ? (
                <View className="h-full justify-center items-center bg-[#1c1c1e] rounded-full">
                   <ActivityIndicator color="#8b5cf6" />
                </View>
              ) : (
                <GradientButton title="Next" onPress={handleNext} />
              )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
