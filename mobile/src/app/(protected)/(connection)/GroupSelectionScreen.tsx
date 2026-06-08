import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  ImageSourcePropType,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

// 👇 1. IMPORT YOUR CUSTOM BUTTON COMPONENT
import { GradientButton } from '@/components/Connection/UI/Buttons'; 
import { connectionService } from '@/services/connectionService';

// --- Types ---
interface GroupCardProps {
  title: string;
  subtitle: string;
  imageSource: ImageSourcePropType;
  isSelected: boolean;
  onPress: () => void;
}

// --- Card Component (NativeWind Style) ---
const GroupCard = ({ title, subtitle, imageSource, isSelected, onPress }: GroupCardProps) => {
  const { width } = Dimensions.get('window');
  // Calculate width: (Screen - Padding 40 - Gap 12) / 2
  const cardWidth = (width - 52) / 2; 

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{ width: cardWidth, height: cardWidth * 1.3 }}
      className={`rounded-[24px] p-4 items-center justify-center mb-4 shadow-sm ${
        isSelected ? 'bg-white' : 'bg-[#1c1c1e]'
      }`}
    >
      <Image 
        source={imageSource} 
        style={{ width: 80, height: 80 }}
        resizeMode="contain" 
      />
      
      <Text className={`text-[16px] font-bold mb-1 text-center ${
        isSelected ? 'text-black' : 'text-white'
      }`}>
        {title}
      </Text>
      
      <Text className={`text-[11px] text-center leading-4 ${
        isSelected ? 'text-[#666]' : 'text-[#888]'
      }`}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
};

// --- Main Screen ---
export default function GroupSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // 🔥 Changed to null to support unselecting
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 🔥 1. LOAD SAVED SELECTION ON MOUNT
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const saved = await AsyncStorage.getItem('user_group_kind');
        if (saved) setSelected(saved);
      } catch (error) {
        console.error("Failed to load group selection", error);
      }
    };
    loadSavedData();
  }, []);

  // 🔥 2. TOGGLE SELECTION & SAVE
  const handleToggle = async (type: string) => {
    // If the same card is clicked, unselect it. Otherwise, select the new one.
    const newValue = selected === type ? null : type;
    setSelected(newValue);

    try {
      if (newValue) {
        await AsyncStorage.setItem('user_group_kind', newValue);
      } else {
        await AsyncStorage.removeItem('user_group_kind');
      }
    } catch (error) {
      console.error("Failed to save group selection", error);
    }
  };

  const handleNext = async () => {
    if (!selected) return; // Prevent next step if nothing is selected

    setIsLoading(true);
    try {
      // 🔥 Update Roadmap to Step 4
      await AsyncStorage.setItem('travel_step_reached', '4');
      
      // Map frontend selection to backend enum
      // const groupPref = selected === 'boys' ? 'boys-only' : 
      //                   selected === 'girls' ? 'girls-only' : 
      //                   selected === 'mixed' ? 'mixed' : 'any';

      try {
        // const profile = await connectionService.getProfile();
        // if (profile && profile.data) {
           // We'll update the most recent travel purpose
           // For now, we skip as we need the purpose ID
        // }
      } catch (err) {
        console.error("Failed to save group preference to backend", err);
      }

      router.push('/(protected)/(connection)/TravelStyleScreen');
    } catch (error) {
      console.error("Failed to save progress", error);
      router.push('/(protected)/(connection)/TravelStyleScreen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09090b]" edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View className="flex-row items-center h-[60px] px-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        
        {/* Progress Bar (Updated to Step 4 to match flow) */}
        <View className="flex-1 h-1 bg-[#1c1c1e] mx-4 rounded-full">
          <View className="h-full bg-white w-[56%] rounded-full" />
        </View>
        <Text className="text-[#a8a29e] text-[13px] font-semibold">04/07</Text>
      </View>

      {/* CONTENT */}
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-white text-[28px] font-bold my-6 leading-tight">
          What kind of group?
        </Text>

        {/* GRID LAYOUT */}
        <View className="flex-row flex-wrap justify-center gap-3">
          
          <GroupCard 
            title="Boys only"
            subtitle="This group include only boys"
            isSelected={selected === 'boys'}
            onPress={() => handleToggle('boys')}
            imageSource={require('@/assets/images/connection/boys.png')} 
          />

          <GroupCard 
            title="Girls only"
            subtitle="This group include only girls"
            isSelected={selected === 'girls'}
            onPress={() => handleToggle('girls')}
            imageSource={require('@/assets/images/connection/girls.png')} 
          />

          <GroupCard 
            title="Boys & Girls"
            subtitle="This is a mixed group"
            isSelected={selected === 'mixed'}
            onPress={() => handleToggle('mixed')}
            imageSource={require('@/assets/images/connection/mixed.png')} 
          />

        </View>
      </ScrollView>

      {/* FOOTER BUTTON */}
      <View className="bg-black pt-2 px-5 absolute bottom-0 left-0 right-0" style={{ paddingBottom: insets.bottom + 20 }}>
         {isLoading ? (
            <View className="h-[56px] justify-center items-center bg-[#1c1c1e] rounded-full">
               <ActivityIndicator color="#8b5cf6" />
            </View>
          ) : (
            <GradientButton title="Next" onPress={handleNext} />
          )}
      </View>

    </SafeAreaView>
  );
}
