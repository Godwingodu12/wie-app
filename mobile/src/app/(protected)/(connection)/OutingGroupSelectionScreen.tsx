import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  ImageSourcePropType,
  StatusBar 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 👇 1. IMPORT YOUR CUSTOM BUTTON COMPONENT
import { GradientButton } from '@/components/Connection/UI/Buttons'; 

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
        className="w-20 h-20 mb-4"
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
  const [selected, setSelected] = useState<string>('boys');

  const handleNext = () => {
    // Navigate to next page (e.g., Budget)
    console.log("Selected:", selected);
    router.push('/(protected)/(connection)/TravelStyleScreen');// router.push('/(protected)/(connection)/budget'); 
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
          <View className="h-full bg-white w-[28%] rounded-full" />
        </View>
        <Text className="text-[#a8a29e] text-[13px] font-semibold">02/07</Text>
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
            onPress={() => setSelected('boys')}
            imageSource={require('@/assets/images/connection/boys.png')} 
          />

          <GroupCard 
            title="Girls only"
            subtitle="This group include only girls"
            isSelected={selected === 'girls'}
            onPress={() => setSelected('girls')}
            imageSource={require('@/assets/images/connection/girls.png')} 
          />

          <GroupCard 
            title="Boys & Girls"
            subtitle="This is a mixed group"
            isSelected={selected === 'mixed'}
            onPress={() => setSelected('mixed')}
            imageSource={require('@/assets/images/connection/mixed.png')} 
          />

        </View>
      </ScrollView>

      {/* FOOTER BUTTON */}
      {/* 👇 2. Using GradientButton component here */}
      <View className="bg-black pt-2 pb-5 px-5 absolute bottom-0 left-0 right-0">
         <GradientButton title="Next" onPress={handleNext} />
      </View>

    </View>
  );
}
