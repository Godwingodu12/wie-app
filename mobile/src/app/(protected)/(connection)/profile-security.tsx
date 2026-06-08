import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import Custom Buttons
import { GradientButton, OutlineButton } from '@/components/Connection/UI/Buttons';

const ProfileSecurityScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Toggle States
  const [hideAccount, setHideAccount] = useState(false);
  const [restrictVideo, setRestrictVideo] = useState(false);

  const handleNext = () => {
    // FIXED: Navigate to Terms page, not Home
    router.push('/(protected)/(connection)/terms'); 
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
          <View className="flex-1 h-1 bg-[#1c1c1e] mx-[15px] rounded-sm">
            {/* Progress Bar (Full 100%) */}
            <View className="h-full bg-white rounded-sm w-full" />
          </View>
          <Text className="text-[#a8a29e] text-[13px] font-semibold">07/07</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          
          {/* TITLE SECTION */}
          <View className="mt-2.5 mb-10">
            <Text className="text-white text-[32px] font-bold leading-tight">
              Make your{"\n"}Profile secured...
            </Text>
            <Text className="text-[#71717a] text-base mt-2.5">
              You can hide your name and profile from others.
            </Text>
          </View>

          {/* TOGGLE OPTIONS */}
          <View className="gap-6">
            
            {/* Toggle 1: Hide Account */}
            <View className="flex-row items-center justify-between h-14">
              <Text 
                className="text-white text-[15px] font-medium flex-1 mr-4"
                numberOfLines={1} 
                adjustsFontSizeToFit
              >
                Hide Wie account from others.
              </Text>
              <Switch
                trackColor={{ false: "#27272a", true: "#6366f1" }}
                thumbColor={hideAccount ? "#ffffff" : "#71717a"}
                ios_backgroundColor="#27272a"
                onValueChange={setHideAccount}
                value={hideAccount}
                style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }} 
              />
            </View>

            {/* Toggle 2: Restrict Video Call */}
            <View className="flex-row items-center justify-between h-14">
              <Text 
                className="text-white text-[15px] font-medium flex-1 mr-4"
                numberOfLines={1} 
                adjustsFontSizeToFit
              >
                Restrict video call option in connection
              </Text>
              <Switch
                trackColor={{ false: "#27272a", true: "#6366f1" }}
                thumbColor={restrictVideo ? "#ffffff" : "#71717a"}
                ios_backgroundColor="#27272a"
                onValueChange={setRestrictVideo}
                value={restrictVideo}
                style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
              />
            </View>

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
            onPress={() => router.push('/(protected)/(connection)/terms')} 
          />
        </View>
        
        <View className="flex-1">
          <GradientButton 
            title="Next" 
            onPress={handleNext} 
          />
        </View>
      </View>
    </View>
  );
};

export default ProfileSecurityScreen;
