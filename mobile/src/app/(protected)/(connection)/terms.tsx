import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import Custom Buttons
import { GradientButton, OutlineButton } from '@/components/Connection/UI/Buttons';

import { connectionService } from '@/services/connectionService';
import { ActivityIndicator } from 'react-native';

const TermsScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Checkbox State
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    if (!accepted) {
      setError("Please accept the terms and conditions to continue.");
      return;
    }
    
    setIsLoading(true);
    try {
        await connectionService.acceptTerms();
        router.push('/(protected)/(connection)/looking-for'); 
    } catch (e) {
        console.error("Error accepting terms", e);
        router.push('/(protected)/(connection)/looking-for');
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
        <View className="flex-row items-center h-[60px] mb-2.5 shrink-0">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: 'space-between', 
            paddingBottom: 120 // Adjusted to sit closer to footer
          }}
        >
          
          {/* TOP CONTENT SECTION */}
          <View>
            {/* TITLE */}
            <View className="mt-2.5 mb-8">
              <Text className="text-white text-[32px] font-bold leading-tight">
                Terms and conditions
              </Text>
            </View>

            {/* CONTENT TEXT */}
            <Text className="text-[#a1a1aa] text-[15px] leading-[24px] mb-4">
              There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don&apos;t look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn&apos;t anything embarrassing hidden in the middle of text.
            </Text>
            <Text className="text-[#a1a1aa] text-[15px] leading-[24px]">
              All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures.
            </Text>
          </View>

          {/* BOTTOM SECTION: CHECKBOX & ERROR */}
          <View className="mb-4 mt-8">
             {/* CHECKBOX ROW */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => {
                setAccepted(!accepted);
                setError(null); 
              }}
              className="flex-row items-center"
            >
              {/* Custom Checkbox UI */}
              <View 
                className={`w-6 h-6 rounded border mr-3 items-center justify-center ${
                  accepted 
                    ? 'bg-[#6366f1] border-[#6366f1]' 
                    : error 
                      ? 'border-red-500 bg-transparent' 
                      : 'border-[#a1a1aa] bg-transparent' // Lighter border for visibility
                }`}
              >
                {accepted && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              
              <Text className={`text-[15px] font-medium ${error ? 'text-red-500' : 'text-white'}`}>
                Accept the terms and conditions
              </Text>
            </TouchableOpacity>

            {/* INLINE ERROR MESSAGE */}
            {error && (
              <Text className="text-red-500 text-sm mt-3 ml-9 font-medium">
                {error}
              </Text>
            )}
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
            title="Go back" 
            onPress={() => router.back()} 
          />
        </View>
        
        <View className="flex-1">
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
    </View>
  );
};

export default TermsScreen;
