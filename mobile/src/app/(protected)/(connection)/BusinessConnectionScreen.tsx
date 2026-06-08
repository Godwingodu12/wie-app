import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  ScrollView, 
  StatusBar, 
  Text, 
  TouchableOpacity, 
  View, 
  Image,
  Platform, 
  UIManager,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

// Import Custom Buttons
import { GradientButton } from '@/components/Connection/UI/Buttons';
import { connectionService } from '@/services/connectionService';

// Enable Layout Animation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- DATA: Business Connection Options (Using local image assets) ---
const BUSINESS_OPTIONS = [
  {
    id: 'startup',
    label: 'Startup Collaboration',
    description: 'Co-founder, team member, or collaborator',
    image: require('@/assets/images/connection/startup-icon.png'),
  },
  {
    id: 'client',
    label: 'Client/Customer',
    description: '"Find customers or offer your services"',
    image: require('@/assets/images/connection/client-icon.png'),
  },
  {
    id: 'investor',
    label: 'Investor',
    description: '"Angel investors, VCs, or funding sources"',
    image: require('@/assets/images/connection/investor-icon.png'),
  },
  {
    id: 'mentor',
    label: 'Mentor',
    description: 'Business guidance and mentorship',
    image: require('@/assets/images/connection/mentor-icon.png'),
  },
  {
    id: 'exec',
    label: 'Connect with HR/CEO etc..',
    description: 'Business guidance and mentorship',
    image: require('@/assets/images/connection/exec-icon.png'),
  },
];

const BusinessConnectionScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string>('startup');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
        await connectionService.createProfessionalPurpose({
            connectionType: selectedId,
            status: 'draft'
        });
        router.push('/(protected)/(connection)/ProfessionalFieldScreen'); 
    } catch (e) {
        console.error("Error saving business connection", e);
        router.push('/(protected)/(connection)/ProfessionalFieldScreen'); 
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#09090b]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View style={{ paddingTop: insets.top }} className="flex-1 px-5">

        {/* HEADER */}
        <View className="flex-row items-center h-[60px] mb-2.5">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1 h-[2px] bg-[#1c1c1e] mx-[15px] rounded-full">
            <View className="h-full bg-white rounded-full w-[28%]" />
          </View>
          <Text className="text-[#a8a29e] text-[13px] font-semibold">02/07</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

          <View className="mt-2.5 mb-8">
            <Text className="text-white text-[24px] font-semibold leading-tight">
              What kind of business connection are you looking for?
            </Text>
          </View>

          {/* VERTICAL SELECTION LIST */}
          <View className="gap-y-4">
            {BUSINESS_OPTIONS.map((item) => {
              const isSelected = selectedId === item.id;

              return (
                <Animated.View 
                  key={item.id}
                  layout={Layout.springify()}
                >
                  <TouchableOpacity
                    onPress={() => handleSelect(item.id)}
                    activeOpacity={0.8}
                    className={`w-full p-5 rounded-[22px] border items-center justify-center ${
                      isSelected 
                        ? 'bg-white border-white' 
                        : 'bg-[#161618] border-[#27272a]'
                    }`}
                  >
                    {/* LOCAL IMAGE FROM FIGMA */}
                    <Image 
                      source={item.image} 
                      style={{ width: 40, height: 40, marginBottom: 12 }} 
                      resizeMode="contain"
                    />

                    <Text className={`text-[18px] font-bold text-center mb-1 ${
                      isSelected ? 'text-black' : 'text-white'
                    }`}>
                      {item.label}
                    </Text>

                    <Text className={`text-[10px] text-center ${
                      isSelected ? 'text-[#3f3f46]' : 'text-[#71717a]'
                    }`}>
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* FOOTER */}
      <View 
        className="px-5 bg-[#09090b] pt-2.5 absolute bottom-0 w-full"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
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
  );
};

export default BusinessConnectionScreen;
